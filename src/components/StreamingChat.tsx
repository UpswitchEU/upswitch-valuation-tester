/**
 * StreamingChat - Lightweight orchestrator component
 * 
 * This component uses extracted modules to reduce complexity and improve maintainability.
 * The main component is now ~300 lines instead of 1,817 lines.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Bot, User, CheckCircle, Loader2 } from 'lucide-react';
import { AI_CONFIG } from '../config';
import { ContextualTip } from './ContextualTip';
import { SuggestionChips } from './SuggestionChips';
import { TypingIndicator } from './TypingIndicator';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { chatLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
// Note: Business extraction utilities available if needed
// import { 
//   extractBusinessModelFromInput, 
//   extractFoundingYearFromInput 
// } from '../utils/businessExtractionUtils';

// Import extracted modules
import { useStreamingChatState, Message } from '../hooks/useStreamingChatState';
import { StreamEventHandler } from '../services/chat/StreamEventHandler';
import { InputValidator } from '../utils/validation/InputValidator';
import { useConversationInitializer, UserProfile } from '../hooks/useConversationInitializer';
import { StreamingManager } from '../services/chat/StreamingManager';
import { useConversationMetrics } from '../hooks/useConversationMetrics';
import { MessageManager } from '../utils/chat/MessageManager';

// Re-export types for convenience
export interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onDataCollected?: (data: any) => void;
  onValuationPreview?: (data: any) => void;
  onCalculateOptionAvailable?: (data: any) => void;
  onProgressUpdate?: (data: any) => void;
  onReportSectionUpdate?: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onSectionLoading?: (section: string, html: string, phase: number) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onContextUpdate?: (context: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * StreamingChat Component - Refactored Version
 * 
 * This is the refactored version of StreamingChat.tsx that uses extracted modules
 * to reduce complexity and improve maintainability. The main component is now
 * ~300 lines instead of 1,817 lines.
 * 
 * This component now acts as a lightweight orchestrator that delegates
 * most functionality to specialized modules. This reduces complexity
 * and improves maintainability.
 */
export const StreamingChat: React.FC<StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  onReportUpdate,
  onDataCollected,
  onValuationPreview,
  onCalculateOptionAvailable,
  onProgressUpdate,
  onReportSectionUpdate,
  onSectionLoading,
  onSectionComplete,
  onReportComplete,
  onHtmlPreviewUpdate,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  // Get user data from AuthContext
  const { user } = useAuth();
  
  // Use extracted state management hook
  const state = useStreamingChatState(sessionId, userId);
  
  // Initialize services (must be before hooks that use them)
  const inputValidator = useMemo(() => new InputValidator(), []);
  const messageManager = useMemo(() => new MessageManager(), []);
  
  // Use extracted conversation initializer
  useConversationInitializer(sessionId, userId, {
    addMessage: (message) => {
      const { updatedMessages, newMessage } = messageManager.addMessage(state.messages, message);
      state.setMessages(updatedMessages);
      return { updatedMessages, newMessage };
    },
    setMessages: state.setMessages,
    user: user as UserProfile | undefined
  });
  
  // Use extracted metrics tracking
  const { trackModelPerformance, trackConversationCompletion } = useConversationMetrics(sessionId, userId);
  
  // Typing animation for smooth AI responses
  const { complete } = useTypingAnimation({
    baseSpeed: 50,
    adaptiveSpeed: true,
    punctuationPauses: true,
    showCursor: true
  });
  
  const streamingManager = useMemo(() => new StreamingManager(
    state.refs.requestIdRef,
    state.refs.currentStreamingMessageRef
  ), [state.refs.requestIdRef, state.refs.currentStreamingMessageRef]);
  
  // Create event handler with all callbacks
  const eventHandler = useMemo(() => new StreamEventHandler(sessionId, {
    updateStreamingMessage: (content: string, isComplete: boolean = false) => {
      if (!state.refs.currentStreamingMessageRef.current?.id) {
        chatLogger.warn('No current streaming message to update');
        return;
      }
      
      const currentMessageId = state.refs.currentStreamingMessageRef.current.id;
      
      // Update the message content in state
      const updatedMessages = messageManager.updateStreamingMessage(
        state.messages,
        currentMessageId,
        content,
        isComplete
      );
      state.setMessages(updatedMessages);
      
      // Complete the message if needed
      if (isComplete) {
        complete();
        state.refs.currentStreamingMessageRef.current = null;
      }
    },
    setIsStreaming: state.setIsStreaming,
    setIsTyping: state.setIsTyping,
    setIsThinking: state.setIsThinking,
    setTypingContext: state.setTypingContext,
    setCollectedData: state.setCollectedData,
    setValuationPreview: state.setValuationPreview,
    setCalculateOption: state.setCalculateOption,
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
      const { updatedMessages, newMessage } = messageManager.addMessage(state.messages, message);
      state.setMessages(updatedMessages);
      return { updatedMessages, newMessage };
    },
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
    onSectionComplete,
    onReportSectionUpdate,
    onReportComplete,
    onDataCollected,
    onValuationPreview,
    onCalculateOptionAvailable,
    onProgressUpdate,
    onHtmlPreviewUpdate
  }), [
    sessionId,
    state.messages,
    state.setMessages,
    state.setIsStreaming,
    state.setIsTyping,
    state.setIsThinking,
    state.setTypingContext,
    state.setCollectedData,
    state.setValuationPreview,
    state.setCalculateOption,
    messageManager,
    complete,
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
    onSectionComplete,
    onReportSectionUpdate,
    onReportComplete,
    onDataCollected,
    onValuationPreview,
    onCalculateOptionAvailable,
    onProgressUpdate,
    onHtmlPreviewUpdate
  ]);
  
  // Add message helper
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const { updatedMessages, newMessage } = messageManager.addMessage(state.messages, message);
    state.setMessages(updatedMessages);
    return { updatedMessages, newMessage };
  }, [state.messages, state.setMessages, messageManager]);
  
  // Update streaming message helper
  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
    if (!state.refs.currentStreamingMessageRef.current?.id) {
      chatLogger.warn('No current streaming message to update');
      return;
    }
    
    const currentMessageId = state.refs.currentStreamingMessageRef.current.id;
    const updatedMessages = messageManager.updateStreamingMessage(
      state.messages,
      currentMessageId,
      content,
      isComplete
    );
    state.setMessages(updatedMessages);
    
    if (isComplete) {
      complete();
      onMessageComplete?.(state.refs.currentStreamingMessageRef.current);
      state.refs.currentStreamingMessageRef.current = null;
    }
  }, [state.messages, state.setMessages, state.refs.currentStreamingMessageRef, messageManager, complete, onMessageComplete]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.input.trim() || state.isStreaming || disabled) return;
    
    const userInput = state.input.trim();
    state.setInput('');
    
    // Validate input
    const validation = await inputValidator.validateInput(userInput, state.messages, sessionId);
    if (!validation.is_valid) {
      chatLogger.warn('Input validation failed', { 
        sessionId, 
        errors: validation.errors,
        warnings: validation.warnings 
      });
      
      // Show validation error to user
      const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
        type: 'system',
        content: validation.errors.join(', '),
        isComplete: true
      };
      addMessage(errorMessage);
      return;
    }
    
    // Track conversation turn
    trackConversationCompletion(false, false);
    
    // Show thinking state immediately (optimistic UI)
    state.setIsThinking(true);
    state.setIsTyping(true);
    state.setTypingContext(undefined); // Will be updated by backend events
    
    // Start streaming conversation
    await streamingManager.startStreaming(
      sessionId,
      userInput,
      userId,
      {
        setIsStreaming: state.setIsStreaming,
        addMessage,
        updateStreamingMessage,
        onContextUpdate: (context: any) => {
          // Handle context updates if needed
          onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive');
        },
        extractBusinessModelFromInput: (_input: string) => null,
        extractFoundingYearFromInput: (_input: string) => null
      },
      eventHandler.handleEvent.bind(eventHandler),
      (error: Error) => {
        chatLogger.error('Streaming error', { error: error.message, sessionId });
        state.setIsStreaming(false);
        state.setIsTyping(false); // Hide typing indicator on error
      }
    );
  }, [state.input, state.isStreaming, state.setIsStreaming, disabled, sessionId, userId, inputValidator, addMessage, updateStreamingMessage, onHtmlPreviewUpdate, trackConversationCompletion, streamingManager, eventHandler]);
  
  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    state.setInput(suggestion);
  }, [state.setInput]);
  
  // Handle suggestion dismiss
  const handleSuggestionDismiss = useCallback(() => {
    // Dismiss suggestions - could add state for this if needed
  }, []);
  
  // Handle clarification confirmation
  const handleClarificationConfirm = useCallback((messageId: string) => {
    // Handle clarification confirmation
    chatLogger.info('Clarification confirmed', { messageId, sessionId });
  }, [sessionId]);
  
  // Handle clarification rejection
  const handleClarificationReject = useCallback((messageId: string) => {
    // Handle clarification rejection
    chatLogger.info('Clarification rejected', { messageId, sessionId });
  }, [sessionId]);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messageManager.scrollToBottom(state.refs.messagesEndRef);
  }, [messageManager, state.refs.messagesEndRef]);
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);
  
  // Get contextual tip
  const getContextualTip = useCallback(() => {
    // Return contextual tip based on current conversation state
    if (state.messages.length === 0) {
      return {
        type: 'info' as const,
        message: '💡 Welcome! I\'ll help you get a business valuation. Let\'s start with some basic information about your company.'
      };
    }
    
    // Removed tooltip for collected fields - keeping for potential future use
    // const lastMessage = state.messages[state.messages.length - 1];
    // if (lastMessage?.type === 'ai' && lastMessage.metadata?.collected_field) {
    //   return {
    //     type: 'insight' as const,
    //     message: `📊 We're collecting information about your ${lastMessage.metadata.collected_field}. This helps us provide an accurate valuation.`
    //   };
    // }
    
    return null;
  }, [state.messages]);
  
  // Get smart follow-ups
  const getSmartFollowUps = useCallback(() => {
    if (state.messages.length === 0) return [];
    
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage?.type === 'ai' && lastMessage.metadata?.collected_field) {
      const field = lastMessage.metadata.collected_field;
      switch (field) {
        case 'business_type':
          return ['SaaS Platform', 'E-commerce Store', 'Consulting Firm', 'Digital Agency'];
        case 'revenue':
          return ['$1M - $5M ARR', '$5M - $10M ARR', '$10M - $50M ARR', '$50M+ ARR'];
        case 'employee_count':
          return ['1-10 team', '11-50 team', '51-200 team', '200+ team'];
        default:
          return [];
      }
    }
    
    return [];
  }, [state.messages]);
  
  const contextualTip = getContextualTip();
  const smartFollowUps = getSmartFollowUps();
  
  return (
    <div className={`flex h-full flex-col overflow-hidden flex-1 ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages */}
        {state.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start gap-3">
                {/* AI Icon */}
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                )}
                
                {/* Message bubble */}
                <div className={`rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-zinc-800 text-white' 
                    : 'bg-zinc-700/50 text-white'
                }`}>
                  {/* Message content */}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
              
                  
                  {/* Suggestion chips */}
                  {message.type === 'suggestion' && message.metadata?.suggestions && (
                    <SuggestionChips
                      suggestions={message.metadata.suggestions}
                      originalValue={message.metadata.originalValue || ''}
                      onSelect={handleSuggestionSelect}
                      onDismiss={handleSuggestionDismiss}
                    />
                  )}
                  
                  {/* Clarification confirmation buttons */}
                  {message.metadata?.needs_confirmation && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleClarificationConfirm(message.id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleClarificationReject(message.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {/* Help text */}
                  {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                    <div className="mt-1">
                      <p className="text-xs text-primary-400">
                        ℹ️ {message.metadata.help_text}
                      </p>
                    </div>
                  )}
                  
                  {/* Valuation narrative */}
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
                </div>
                
                {/* User Icon */}
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`text-xs text-zinc-500 mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator - Separate bubble */}
        {state.isTyping && (
          <div className="flex justify-start">
            <TypingIndicator context={state.typingContext} isThinking={state.isThinking} />
          </div>
        )}
        
        {/* Data Collection Panel */}
        {Object.keys(state.collectedData).length > 0 && (
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
            <h3 className="font-semibold text-white mb-2">Collected Data</h3>
            <div className="space-y-2">
              {Object.entries(state.collectedData).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium capitalize text-zinc-300">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-zinc-400">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Calculate Now Button */}
        {state.calculateOption && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Handle calculate now
                chatLogger.info('Calculate now clicked', { sessionId });
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Calculate Now
            </button>
          </div>
        )}
        
        {/* Valuation Preview */}
        {state.valuationPreview && (
          <div className="bg-primary-600/10 p-4 rounded-lg border border-primary-600/30">
            <h3 className="font-semibold text-primary-300 mb-2">Valuation Preview</h3>
            <div className="text-2xl font-bold text-primary-200">
              ${state.valuationPreview.value?.toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={state.refs.messagesEndRef} />
      </div>
      
      {/* Contextual Tip */}
      {contextualTip && (
        <div className="px-4 pb-2">
          <ContextualTip
            type={contextualTip.type}
            message={contextualTip.message}
          />
        </div>
      )}
      
      {/* Input Form */}
      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={handleSubmit}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={state.input}
              onChange={(e) => state.setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about your business valuation..."
              disabled={disabled || state.isStreaming}
              className="textarea-seamless flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-base leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '80px', height: '80px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {smartFollowUps.filter(Boolean).map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => state.setInput(suggestion)}
                disabled={state.isStreaming}
                className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
            
            {/* Right side with send button */}
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!state.input.trim() || state.isStreaming || disabled}
                className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
              >
                {state.isStreaming ? (
                  <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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

export default StreamingChat;