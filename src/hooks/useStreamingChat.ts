/**
 * useStreamingChat Hook - Manages streaming conversation state and API calls
 * Inspired by IlaraAI Mercury streaming architecture
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface StreamingMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: any;
}

interface StreamingChatState {
  messages: StreamingMessage[];
  isStreaming: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  error: string | null;
  sessionId: string;
}

interface UseStreamingChatOptions {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: StreamingMessage) => void;
  onValuationComplete?: (result: any) => void;
  onError?: (error: string) => void;
  fallbackEnabled?: boolean;
}

interface UseStreamingChatReturn {
  // State
  messages: StreamingMessage[];
  isStreaming: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  error: string | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryConnection: () => void;
  addSystemMessage: (content: string) => void;
  
  // Utilities
  getLastMessage: () => StreamingMessage | null;
  getMessagesByType: (type: 'user' | 'ai' | 'system') => StreamingMessage[];
  isConnected: boolean;
}

export const useStreamingChat = (options: UseStreamingChatOptions): UseStreamingChatReturn => {
  const {
    sessionId,
    userId,
    onMessageComplete,
    onValuationComplete,
    onError,
    fallbackEnabled = true
  } = options;

  const [state, setState] = useState<StreamingChatState>({
    messages: [],
    isStreaming: false,
    connectionStatus: 'disconnected',
    error: null,
    sessionId
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentStreamingMessageRef = useRef<StreamingMessage | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Initialize with welcome message
  useEffect(() => {
    if (state.messages.length === 0) {
      addSystemMessage('Hello! I\'m your AI valuation expert. I\'ll help you get a professional business valuation through our conversation. What\'s the name of your business?');
    }
  }, [state.messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const addMessage = useCallback((message: Omit<StreamingMessage, 'id' | 'timestamp'>) => {
    const newMessage: StreamingMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
    
    return newMessage;
  }, []);

  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
    if (currentStreamingMessageRef.current) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === currentStreamingMessageRef.current!.id
            ? { ...msg, content: msg.content + content, isComplete }
            : msg
        )
      }));
      
      if (isComplete) {
        currentStreamingMessageRef.current.isComplete = true;
        onMessageComplete?.(currentStreamingMessageRef.current);
        currentStreamingMessageRef.current = null;
      }
    }
  }, [onMessageComplete]);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
    onError?.(error);
  }, [onError]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setConnectionStatus = useCallback((status: 'connected' | 'connecting' | 'disconnected') => {
    setState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  const setIsStreaming = useCallback((streaming: boolean) => {
    setState(prev => ({ ...prev, isStreaming: streaming }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isStreaming) return;

    clearError();
    setIsStreaming(true);
    setConnectionStatus('connecting');

    // Add user message
    const userMessage = addMessage({
      type: 'user',
      content: content.trim(),
      isComplete: true
    });

    // Create streaming AI message
    const aiMessage = addMessage({
      type: 'ai',
      content: '',
      isStreaming: true,
      isComplete: false
    });

    currentStreamingMessageRef.current = aiMessage;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Prepare request data
      const requestData = {
        session_id: sessionId,
        user_input: content.trim(),
        user_id: userId,
        context: {
          previous_messages: state.messages.slice(-5).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      };

      // Create EventSource connection
      const eventSource = new EventSource(
        `${process.env.REACT_APP_VALUATION_ENGINE_URL}/api/v1/intelligent-conversation/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        }
      );

      eventSourceRef.current = eventSource;
      setConnectionStatus('connected');
      retryCountRef.current = 0; // Reset retry count on successful connection

      // Handle streaming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'typing':
              // AI is typing - could show typing indicator
              break;
              
            case 'message_start':
              // Start of AI response
              break;
              
            case 'message_chunk':
              // Stream content
              updateStreamingMessage(data.content);
              break;
              
            case 'message_complete':
              // Complete response
              updateStreamingMessage('', true);
              setIsStreaming(false);
              
              // Check for valuation result
              if (data.metadata?.valuation_result) {
                onValuationComplete?.(data.metadata.valuation_result);
              }
              break;
              
            case 'error':
              setError(data.content || 'An error occurred');
              setIsStreaming(false);
              updateStreamingMessage('', true);
              break;
          }
        } catch (parseError) {
          console.error('Failed to parse SSE data:', parseError);
          setError('Failed to parse response');
          setIsStreaming(false);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('disconnected');
        
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setError(`Connection lost. Retrying... (${retryCountRef.current}/${maxRetries})`);
          
          // Retry after delay
          retryTimeoutRef.current = setTimeout(() => {
            sendMessage(content);
          }, 2000 * retryCountRef.current); // Exponential backoff
        } else {
          setError('Connection failed. Please try again.');
          setIsStreaming(false);
          
          if (fallbackEnabled) {
            handleFallbackResponse(content);
          }
        }
      };

      eventSource.onopen = () => {
        setConnectionStatus('connected');
        clearError();
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      setError('Failed to start conversation');
      setIsStreaming(false);
      
      if (fallbackEnabled) {
        handleFallbackResponse(content);
      }
    }
  }, [sessionId, userId, state.messages, state.isStreaming, addMessage, updateStreamingMessage, onValuationComplete, fallbackEnabled, clearError, setIsStreaming, setConnectionStatus, setError]);

  const handleFallbackResponse = useCallback((userInput: string) => {
    // Fallback response when streaming fails
    setTimeout(() => {
      const fallbackResponses = [
        "I understand you're looking for a business valuation. Let me help you with that. Could you tell me your company's annual revenue?",
        "I'm here to help with your business valuation. What's your company's name and what industry are you in?",
        "Let's get started with your valuation. Can you share your company's annual revenue and number of employees?"
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      updateStreamingMessage(randomResponse, true);
    }, 1000);
  }, [updateStreamingMessage]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null
    }));
  }, []);

  const retryConnection = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    retryCountRef.current = 0;
    clearError();
    setConnectionStatus('connecting');
  }, [clearError, setConnectionStatus]);

  const addSystemMessage = useCallback((content: string) => {
    addMessage({
      type: 'system',
      content,
      isComplete: true
    });
  }, [addMessage]);

  const getLastMessage = useCallback((): StreamingMessage | null => {
    return state.messages[state.messages.length - 1] || null;
  }, [state.messages]);

  const getMessagesByType = useCallback((type: 'user' | 'ai' | 'system'): StreamingMessage[] => {
    return state.messages.filter(msg => msg.type === type);
  }, [state.messages]);

  const isConnected = state.connectionStatus === 'connected';

  return {
    // State
    messages: state.messages,
    isStreaming: state.isStreaming,
    connectionStatus: state.connectionStatus,
    error: state.error,
    
    // Actions
    sendMessage,
    clearMessages,
    retryConnection,
    addSystemMessage,
    
    // Utilities
    getLastMessage,
    getMessagesByType,
    isConnected
  };
};
