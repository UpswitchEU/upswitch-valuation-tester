/**
 * StreamingChat Component - Real-time AI conversation with streaming responses
 * Inspired by IlaraAI Mercury MCPChatUI architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Bot, User } from 'lucide-react';
import { AI_CONFIG } from '../config';
import { streamingChatService } from '../services/chat/streamingChatService';
import { ContextualTip } from './ContextualTip';
import { ValuationProgressTracker } from './ValuationProgressTracker';
import { LoadingDots } from './LoadingDots';
import { useLoadingMessage } from '../hooks/useLoadingMessage';
// Removed complex validation imports - using simple approach like IlaraAI
import { chatLogger } from '../utils/logger';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: any;
}

interface ProgressItem {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onProgressUpdate?: (items: ProgressItem[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const StreamingChat: React.FC<StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  onReportUpdate,
  onProgressUpdate,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const loadingMessage: string = useLoadingMessage();
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([
    { id: 'company', label: 'Company Information', status: 'pending' },
    { id: 'revenue', label: 'Revenue Data', status: 'pending' },
    { id: 'profitability', label: 'Profitability Metrics', status: 'pending' },
    { id: 'growth', label: 'Growth Trends', status: 'pending' },
    { id: 'market', label: 'Market Position', status: 'pending' },
    { id: 'assets', label: 'Assets & Liabilities', status: 'pending' },
    { id: 'industry', label: 'Industry Benchmarks', status: 'pending' }
  ]);
  
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

  // Simple monitoring - just log message count changes
  useEffect(() => {
    chatLogger.debug('Messages state updated', { count: messages.length });
  }, [messages]);

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
    // Simple, direct approach like IlaraAI - trust TypeScript types
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isComplete: message.isComplete ?? false,
      isStreaming: message.isStreaming ?? false,
      content: message.content ?? ''
    };
    
    chatLogger.debug('Adding message', { messageId: newMessage.id, type: newMessage.type });
    
    // Simple state update like IlaraAI - no complex validation
    setMessages(prev => [...prev, newMessage]);
    
    return newMessage;
  }, []);

  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
    if (!currentStreamingMessageRef.current?.id) {
      chatLogger.warn('No current streaming message to update');
      return;
    }
    
    const currentMessageId = currentStreamingMessageRef.current.id;
    chatLogger.debug('Updating streaming message', { messageId: currentMessageId, contentLength: content.length, isComplete });
    
    // Simple state update like IlaraAI - no complex validation
    setMessages(prev => prev.map(msg => 
      msg.id === currentMessageId
        ? { ...msg, content: msg.content + content, isComplete, isStreaming: !isComplete }
        : msg
    ));
    
    if (isComplete && currentStreamingMessageRef.current) {
      chatLogger.debug('Completing streaming message', { messageId: currentMessageId });
      onMessageComplete?.(currentStreamingMessageRef.current);
      currentStreamingMessageRef.current = null;
    }
  }, [onMessageComplete]);

  // EventSource fallback function
  const tryEventSourceFallback = useCallback((sessionId: string, userInput: string, userId: string | undefined, _aiMessage: Message) => {
    chatLogger.info('Attempting EventSource fallback', { sessionId });
    
    const eventSource = streamingChatService.streamConversationEventSource(
      sessionId,
      userInput,
      userId,
      (event) => {
        chatLogger.info('EventSource event received', { type: event.type, hasContent: !!event.content });
        handleStreamEvent(event);
      },
      (error) => {
        chatLogger.error('EventSource error', { error: error.message });
        setIsStreaming(false);
        addMessage({
          type: 'system',
          content: 'EventSource connection failed. Please try again.',
          isComplete: true
        });
      },
      () => {
        chatLogger.info('EventSource completed', { sessionId });
        setIsStreaming(false);
      }
    );
    
    // Store reference for cleanup
    eventSourceRef.current = eventSource as any;
  }, [addMessage]);

  const handleStreamEvent = useCallback((data: any) => {
    chatLogger.debug('Received stream event', { type: data.type, hasContent: !!data.content, contentLength: data.content?.length });
    
    switch (data.type) {
      case 'typing':
        // AI is typing
        chatLogger.debug('AI typing indicator received');
        break;
        
      case 'message_start':
        // Start of AI response
        chatLogger.debug('AI message start received');
        break;
        
      case 'message_chunk':
        // Stream content
        chatLogger.debug('Message chunk received', { contentLength: data.content?.length });
        updateStreamingMessage(data.content);
        break;
        
      case 'report_update':
        // NEW: Update live report as sections are generated
        onReportUpdate?.(data.html, data.progress);
        break;
        
      case 'progress_update':
        // Backend sends which items are collected
        setProgressItems(prev => {
          const updated = prev.map(item => 
            data.collected_items?.includes(item.id)
              ? { ...item, status: 'completed' as const }
              : data.current_item === item.id
              ? { ...item, status: 'in_progress' as const }
              : item
          );
          onProgressUpdate?.(updated);
          return updated;
        });
        break;
        
      case 'message_complete':
        // Complete response
        chatLogger.debug('Message complete received', { hasMetadata: !!data.metadata, hasValuationResult: !!data.metadata?.valuation_result });
        updateStreamingMessage('', true);
        setIsStreaming(false);
        
        // Check for valuation result
        if (data.metadata?.valuation_result) {
          chatLogger.info('Valuation result received', { valuationResult: data.metadata.valuation_result });
          onValuationComplete?.(data.metadata.valuation_result);
        }
        break;
        
      case 'error':
        console.error('Stream error:', data.content || 'An error occurred');
        setIsStreaming(false);
        updateStreamingMessage('', true);
        break;
    }
  }, [updateStreamingMessage, onValuationComplete, onReportUpdate]);

  const startStreaming = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isStreaming) return;

    chatLogger.info('Starting streaming conversation', { userInput: userInput.substring(0, 50) + '...', sessionId, userId });
    setIsStreaming(true);

    // Add user message
    const userMessage = addMessage({
      type: 'user',
      content: userInput,
      isComplete: true
    });
    chatLogger.debug('User message added', { messageId: userMessage.id });

    // Create streaming AI message
    const aiMessage = addMessage({
      type: 'ai',
      content: '',
      isStreaming: true,
      isComplete: false
    });
    
    if (!aiMessage) {
      chatLogger.error('Failed to create AI message - this should not happen');
      setIsStreaming(false);
      return;
    }
    
    chatLogger.debug('AI message created for streaming', { messageId: aiMessage.id });
    currentStreamingMessageRef.current = aiMessage;

    try {
      chatLogger.info('Starting async generator consumption', { sessionId, userInput: userInput.substring(0, 50) + '...' });
      let eventCount = 0;
      let generatorTimeout: NodeJS.Timeout;
      
      // Set timeout to detect if generator hangs
      generatorTimeout = setTimeout(() => {
        chatLogger.warn('Async generator timeout - no events received in 10 seconds', { sessionId });
        setIsStreaming(false);
        addMessage({
          type: 'system',
          content: 'Streaming timeout. Please try again.',
          isComplete: true
        });
      }, 10000);
      
      // Use streaming service
      for await (const event of streamingChatService.streamConversation(
        sessionId,
        userInput,
        userId
      )) {
        clearTimeout(generatorTimeout);
        eventCount++;
        chatLogger.info('Event received from generator', { 
          eventCount, 
          type: event.type, 
          hasContent: !!event.content,
          contentLength: event.content?.length,
          sessionId: event.session_id 
        });
        handleStreamEvent(event);
      }
      
      clearTimeout(generatorTimeout);
      chatLogger.info('Async generator completed', { 
        totalEvents: eventCount, 
        sessionId,
        messageId: aiMessage.id 
      });
      
      // If no events were received, try EventSource fallback
      if (eventCount === 0) {
        chatLogger.warn('No events received from async generator, trying EventSource fallback', { sessionId });
        tryEventSourceFallback(sessionId, userInput, userId, aiMessage);
        return;
      }

    } catch (error) {
      chatLogger.error('Async generator error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        messageId: aiMessage.id,
        userInput: userInput.substring(0, 50) + '...'
      });
      
      console.error('Failed to start streaming:', error);
      setIsStreaming(false);
      
      // Complete the streaming message properly
      if (currentStreamingMessageRef.current) {
        updateStreamingMessage('', true);
      }
      
      // Show user-friendly error message
      addMessage({
        type: 'system',
        content: 'Connection error. Please check your internet connection and try again.',
        isComplete: true
      });
    }
  }, [sessionId, userId, isStreaming, addMessage, handleStreamEvent]);


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

  const getSmartFollowUps = useCallback(() => {
    const messageCount = messages.length;
    const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
    const lastAiContent = lastAiMessage?.content.toLowerCase() || '';
    
    chatLogger.debug('Getting smart follow-ups', { 
      messageCount,
      lastAiMessageId: lastAiMessage?.id 
    });
    
    // Smart responses based on AI's last question
    if (lastAiContent.includes('revenue') || lastAiContent.includes('turnover')) {
      return [
        "€100K - €500K",
        "€500K - €1M",
        "€1M - €5M",
        "€5M+"
      ];
    }
    
    if (lastAiContent.includes('profit') || lastAiContent.includes('ebitda')) {
      return [
        "10-20% margin",
        "20-30% margin",
        "30%+ margin",
        "Not profitable yet"
      ];
    }
    
    if (lastAiContent.includes('industry') || lastAiContent.includes('sector')) {
      return [
        "Technology/SaaS",
        "E-commerce/Retail",
        "Professional Services",
        "Manufacturing"
      ];
    }
    
    if (lastAiContent.includes('growth') || lastAiContent.includes('growing')) {
      return [
        "Growing 20%+ YoY",
        "Growing 10-20% YoY",
        "Stable (0-10%)",
        "Declining"
      ];
    }
    
    if (lastAiContent.includes('employees') || lastAiContent.includes('team')) {
      return [
        "1-10 employees",
        "11-50 employees",
        "51-200 employees",
        "200+ employees"
      ];
    }
    
    // Default contextual suggestions based on stage
    if (messageCount <= 2) {
      return [
        "What is my business worth?",
        "How do you calculate valuation?",
        "What information do you need?"
      ];
    } else if (messageCount <= 5) {
      return [
        "Can you explain the methodology?",
        "What are industry benchmarks?",
        "How accurate is this valuation?"
      ];
    } else {
      return [
        "Generate full report",
        "Compare to similar businesses",
        "What affects my valuation?"
      ];
    }
  }, [messages]);

  const getContextualTip = useCallback(() => {
    const messageCount = messages.length;
    const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
    
    // Skip tips at the very start - only show when contextually relevant
    if (messageCount < 2) {
      return null;
    }
    
    // Mid-conversation tips based on AI questions
    if (lastAiMessage?.content.toLowerCase().includes('revenue')) {
      return {
        type: 'info' as const,
        message: 'Tip: Include 3 years of revenue for better trend analysis'
      };
    }
    
    if (lastAiMessage?.content.toLowerCase().includes('industry') || 
        lastAiMessage?.content.toLowerCase().includes('sector')) {
      return {
        type: 'insight' as const,
        message: 'Industry benchmarks will be applied automatically'
      };
    }
    
    // Progress-based tips
    if (messageCount > 5 && messageCount <= 8) {
      return {
        type: 'success' as const,
        message: 'Great progress! Enough info to start building your report'
      };
    }
    
    if (messageCount > 8) {
      return {
        type: 'insight' as const,
        message: 'You can request the full report anytime'
      };
    }
    
    return null;
  }, [messages]);

  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>

      {/* Progress header */}
      <div className="border-b border-zinc-800 p-4">
        <ValuationProgressTracker items={progressItems} compact={true} />
      </div>

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
                    <div className="flex items-center gap-2 animate-fade-in">
                      <LoadingDots size="sm" color="text-white" />
                      <span className="text-sm text-zinc-300 animate-pulse">{loadingMessage}</span>
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

      {/* Contextual tip */}
      {getContextualTip() && (
        <div className="px-4 pb-2">
          <ContextualTip {...getContextualTip()!} />
        </div>
      )}

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
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white border-none"
              style={{ minHeight: '60px', height: '60px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {getSmartFollowUps().map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(suggestion)}
                disabled={isStreaming}
                className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
            
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
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="100%" 
                    height="100%" 
                    viewBox="0 -960 960 960" 
                    className="shrink-0 h-5 w-5 text-black" 
                    fill="currentColor"
                  >
                    <path d="M452-644 303-498q-9 9-21 8.5t-21-9.5-9-21 9-21l199-199q9-9 21-9t21 9l199 199q9 9 9 21t-9 21-21 9-21-9L512-646v372q0 13-8.5 21.5T482-244t-21.5-8.5T452-274z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
