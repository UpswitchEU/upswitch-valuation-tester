/**
 * StreamingChat Component - Real-time AI conversation with streaming responses
 * Inspired by IlaraAI Mercury MCPChatUI architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle } from 'lucide-react';
import { AI_CONFIG } from '../config';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: any;
}

interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const StreamingChat: React.FC<StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentStreamingMessageRef = useRef<Message | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: `Hello! I'm your ${AI_CONFIG.branding.expertTitle.toLowerCase()} with ${AI_CONFIG.branding.levelIndicator.toLowerCase()} expertise. I'll help you get a professional business valuation through our intelligent conversation. What's the name of your business?`,
        timestamp: new Date(),
        isComplete: true,
        metadata: {
          reasoning: "Starting with company identification to establish context for valuation",
          help_text: "Please provide your company's legal name as it appears on official documents"
        }
      }]);
    }
  }, [messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
    if (currentStreamingMessageRef.current) {
      setMessages(prev => prev.map(msg => 
        msg.id === currentStreamingMessageRef.current!.id
          ? { ...msg, content: msg.content + content, isComplete }
          : msg
      ));
      
      if (isComplete) {
        currentStreamingMessageRef.current.isComplete = true;
        onMessageComplete?.(currentStreamingMessageRef.current);
        currentStreamingMessageRef.current = null;
      }
    }
  }, [onMessageComplete]);

  const handleStreamEvent = useCallback((data: any) => {
    switch (data.type) {
      case 'typing':
        // AI is typing
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
  }, [updateStreamingMessage, onValuationComplete]);

  const startStreaming = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setConnectionStatus('connecting');

    // Add user message
    addMessage({
      type: 'user',
      content: userInput,
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

      // Create streaming request using fetch with ReadableStream
      const response = await fetch(
        `${import.meta.env.VITE_VALUATION_ENGINE_URL || 'https://web-production-8d00b.up.railway.app'}/api/v1/intelligent-conversation/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_input: userInput,
            user_id: userId,
            context: {
              message_count: messages.length,  // ✅ Safe - only count
              conversation_stage: Math.floor(messages.length / 2)  // ✅ Safe - stage only
              // DO NOT send message content from frontend (privacy compliance)
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  handleStreamEvent(data);
                } catch (parseError) {
                  console.error('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          setConnectionStatus('disconnected');
          setError('Stream connection lost');
          setIsStreaming(false);
        }
      };

      processStream();
      setConnectionStatus('connected');

    } catch (error) {
      console.error('Failed to start streaming:', error);
      setError('Failed to start conversation');
      setIsStreaming(false);
      handleFallbackResponse(userInput);
    }
  }, [sessionId, userId, messages, isStreaming, addMessage, updateStreamingMessage, onValuationComplete, handleStreamEvent]);

  const handleFallbackResponse = useCallback((_userInput: string) => {
    // Fallback response when streaming fails
    setTimeout(() => {
      const fallbackResponse = "I understand you're looking for a business valuation. Let me help you with that. Could you tell me your company's annual revenue?";
      updateStreamingMessage(fallbackResponse, true);
    }, 1000);
  }, [updateStreamingMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    
    const userInput = input.trim();
    setInput('');
    startStreaming(userInput);
  }, [input, isStreaming, disabled, startStreaming]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{AI_CONFIG.branding.expertTitle}</h3>
          {AI_CONFIG.branding.showLevelBadge && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {AI_CONFIG.branding.levelIndicator}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {getConnectionStatusIcon()}
          <span>{getConnectionStatusText()}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start gap-3">
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div className={`rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                  
                  {/* NEW: Display reasoning if available */}
                  {AI_CONFIG.showReasoning && message.metadata?.reasoning && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 italic">
                        💡 {message.metadata.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display help text if available */}
                  {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                    <div className="mt-1">
                      <p className="text-xs text-blue-600">
                        ℹ️ {message.metadata.help_text}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display valuation narrative if available */}
                  {AI_CONFIG.showNarratives && message.metadata?.valuation_narrative && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        Why this valuation?
                      </h4>
                      <div className="text-sm text-blue-800 whitespace-pre-wrap">
                        {message.metadata.valuation_narrative}
                      </div>
                    </div>
                  )}
                  
                  {message.type !== 'user' && message.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI is typing...</span>
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
