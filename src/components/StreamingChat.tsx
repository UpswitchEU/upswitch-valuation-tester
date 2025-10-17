/**
 * StreamingChat Component - Real-time AI conversation with streaming responses
 * Inspired by IlaraAI Mercury MCPChatUI architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
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
    if (currentStreamingMessageRef.current && currentStreamingMessageRef.current.id) {
      setMessages(prev => prev.map(msg => 
        msg && msg.id === currentStreamingMessageRef.current!.id
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
        console.error('Stream error:', data.content || 'An error occurred');
        setIsStreaming(false);
        updateStreamingMessage('', true);
        break;
    }
  }, [updateStreamingMessage, onValuationComplete]);

  const startStreaming = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isStreaming) return;

    setIsStreaming(true);

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
          setIsStreaming(false);
        }
      };

      processStream();

    } catch (error) {
      console.error('Failed to start streaming:', error);
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


  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg shadow-lg ${className}`}>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(msg => msg && msg.id).map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start gap-3">
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                )}
                
                <div className={`rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-zinc-800 text-white' 
                    : 'bg-zinc-700/50 text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                  
                  {/* NEW: Display reasoning if available */}
                  {AI_CONFIG.showReasoning && message.metadata?.reasoning && (
                    <div className="mt-2 pt-2 border-t border-zinc-600/30">
                      <p className="text-xs text-zinc-400 italic">
                        💡 {message.metadata.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display help text if available */}
                  {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                    <div className="mt-1">
                      <p className="text-xs text-primary-400">
                        ℹ️ {message.metadata.help_text}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display valuation narrative if available */}
                  {AI_CONFIG.showNarratives && message.metadata?.valuation_narrative && (
                    <div className="mt-3 p-3 bg-primary-600/10 rounded-lg">
                      <h4 className="text-sm font-semibold text-primary-300 mb-2">
                        Why this valuation?
                      </h4>
                      <div className="text-sm text-primary-200 whitespace-pre-wrap">
                        {message.metadata.valuation_narrative}
                      </div>
                    </div>
                  )}
                  
                  {message.type !== 'user' && message.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI is typing...</span>
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-zinc-500 mt-1 ${
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
      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={handleSubmit}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '60px', height: '60px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              type="button"
              onClick={() => setInput('What is my business worth?')}
              className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
            >
              What is my business worth?
            </button>
            <button
              type="button"
              onClick={() => setInput('How do you calculate valuation?')}
              className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
            >
              How do you calculate valuation?
            </button>
            
            {/* Right side with send button */}
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!input.trim() || isStreaming || disabled}
                className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-zinc-900" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
