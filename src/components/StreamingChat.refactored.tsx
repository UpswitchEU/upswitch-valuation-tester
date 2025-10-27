/**
 * StreamingChat Refactored - Lightweight orchestrator component
 * 
 * This is the refactored version of StreamingChat.tsx that uses extracted modules
 * to reduce complexity and improve maintainability. The main component is now
 * ~300 lines instead of 1,817 lines.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Loader2, Bot, User, CheckCircle } from 'lucide-react';
import { AI_CONFIG } from '../config';
import { ContextualTip } from './ContextualTip';
import { LoadingDots } from './LoadingDots';
import { SuggestionChips } from './SuggestionChips';
import { useLoadingMessage } from '../hooks/useLoadingMessage';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { TypingCursor } from './TypingCursor';
import { chatLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
import { 
  extractBusinessModelFromInput, 
  extractFoundingYearFromInput 
} from '../utils/businessExtractionUtils';

// Import extracted modules
import { useStreamingChatState, Message } from '../hooks/useStreamingChatState';
import { StreamEventHandler, StreamEventHandlerCallbacks } from '../services/chat/StreamEventHandler';
import { InputValidator } from '../utils/validation/InputValidator';
import { useConversationInitializer } from '../hooks/useConversationInitializer';
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
  onReportComplete?: (html: string, valuationId: string) => void;
  onContextUpdate?: (context: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Refactored StreamingChat component - Lightweight orchestrator
 * 
 * This component now acts as a lightweight orchestrator that delegates
 * most functionality to specialized modules. This reduces complexity
 * and improves maintainability.
 */
export const StreamingChatRefactored: React.FC<StreamingChatProps> = ({
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
  onReportComplete,
  onContextUpdate,
  onHtmlPreviewUpdate,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  // Get user data from AuthContext
  const { user } = useAuth();
  
  // Use extracted state management hook
  const state = useStreamingChatState(sessionId, userId);
  
  // Use extracted conversation initializer
  const { isInitializing } = useConversationInitializer(sessionId, userId, {
    addMessage: (message) => {
      const newMessages = messageManager.addMessage(state.messages, message);
      state.setMessages(newMessages);
      return newMessages[newMessages.length - 1];
    },
    setMessages: state.setMessages,
    user
  });
  
  // Use extracted metrics tracking
  const { metrics, trackModelPerformance, trackConversationCompletion } = useConversationMetrics(sessionId, userId);
  
  // Typing animation for smooth AI responses
  const { displayedText, isTyping, addToBuffer, complete, reset } = useTypingAnimation({
    baseSpeed: 50,
    adaptiveSpeed: true,
    punctuationPauses: true,
    showCursor: true
  });
  
  const loadingMessage: string = useLoadingMessage();
  
  // Initialize services
  const inputValidator = useMemo(() => new InputValidator(), []);
  const messageManager = useMemo(() => new MessageManager(), []);
  const streamingManager = useMemo(() => new StreamingManager(
    state.refs.requestIdRef,
    state.refs.currentStreamingMessageRef
  ), [state.refs.requestIdRef, state.refs.currentStreamingMessageRef]);
  
  // Create event handler with all callbacks
  const eventHandler = useMemo(() => new StreamEventHandler(sessionId, {
    updateStreamingMessage: (content: string, isComplete?: boolean) => {
      if (!state.refs.currentStreamingMessageRef.current?.id) {
        chatLogger.warn('No current streaming message to update');
        return;
      }
      
      const currentMessageId = state.refs.currentStreamingMessageRef.current.id;
      chatLogger.debug('Updating streaming message', { 
        messageId: currentMessageId, 
        contentLength: content.length, 
        isComplete 
      });
      
      // Add content to typing animation buffer
      addToBuffer(content);
      
      // Update the message content in state
      const updatedMessages = messageManager.updateStreamingMessage(
        state.messages,
        currentMessageId,
        content,
        isComplete || false
      );
      state.setMessages(updatedMessages);
      
      if (isComplete && state.refs.currentStreamingMessageRef.current) {
        chatLogger.debug('Completing streaming message', { messageId: currentMessageId });
        complete(); // Complete the typing animation
        onMessageComplete?.(state.refs.currentStreamingMessageRef.current);
        state.refs.currentStreamingMessageRef.current = null;
      }
    },
    setIsStreaming: state.setIsStreaming,
    setCollectedData: state.setCollectedData,
    setValuationPreview: state.setValuationPreview,
    setCalculateOption: state.setCalculateOption,
    addMessage: (message) => {
      const newMessages = messageManager.addMessage(state.messages, message);
      state.setMessages(newMessages);
      return newMessages[newMessages.length - 1];
    },
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
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
    state.setCollectedData,
    state.setValuationPreview,
    state.setCalculateOption,
    addToBuffer,
    complete,
    onMessageComplete,
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
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
    const newMessages = messageManager.addMessage(state.messages, message);
    state.setMessages(newMessages);
    return newMessages[newMessages.length - 1];
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
    
    if (isComplete && state.refs.currentStreamingMessageRef.current) {
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
    
    // Validate input before processing
    const validation = await inputValidator.validateInput(userInput, state.messages, sessionId);
    
    if (!validation.is_valid) {
      // Show validation errors to user
      addMessage({
        type: 'system',
        content: `Please correct the following issues:\n${validation.errors.join('\n')}`,
        isComplete: true,
        metadata: {
          intent: 'error',
          validation_status: 'invalid',
          error_type: 'validation_failed'
        }
      });
      return;
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      addMessage({
        type: 'system',
        content: `Note: ${validation.warnings.join(', ')}`,
        isComplete: true,
        metadata: {
          intent: 'warning',
          validation_status: 'valid_with_warnings'
        }
      });
    }
    
    // Start streaming conversation
    await streamingManager.startStreaming(
      sessionId,
      userInput,
      userId,
      {
        setIsStreaming: state.setIsStreaming,
        addMessage,
        updateStreamingMessage,
        onContextUpdate,
        extractBusinessModelFromInput,
        extractFoundingYearFromInput
      },
      (event) => eventHandler.handleEvent(event),
      (error) => {
        chatLogger.error('Streaming error', { error: error.message });
        state.setIsStreaming(false);
        addMessage({
          type: 'system',
          content: 'Connection failed. Please try again.',
          isComplete: true
        });
      }
    );
    
    // Clear input
    state.setInput('');
  }, [
    state.input,
    state.isStreaming,
    disabled,
    inputValidator,
    state.messages,
    sessionId,
    addMessage,
    streamingManager,
    state.setIsStreaming,
    updateStreamingMessage,
    onContextUpdate,
    state.setInput,
    eventHandler
  ]);
  
  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messageManager.scrollToBottom(state.refs.messagesEndRef);
  }, [messageManager, state.refs.messagesEndRef]);
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (field: string, selected: string) => {
    chatLogger.info('Suggestion selected', { field, selected });
    state.setInput(selected);
  }, [state.setInput]);

  // Handle suggestion dismiss
  const handleSuggestionDismiss = useCallback(async (field: string, originalValue: string) => {
    chatLogger.info('Suggestion dismissed', { field, originalValue });
    // Keep original value in input
    state.setInput(originalValue);
  }, [state.setInput]);

  // Handle clarification confirmation
  const handleClarificationConfirm = useCallback(async (field: string, value: string) => {
    chatLogger.info('Clarification confirmed', { field, value });
    
    // Add user message showing confirmation
    addMessage({
      type: 'user',
      content: 'yes',
      isComplete: true,
      metadata: {
        intent: 'confirmation',
        collected_field: field,
        confirmation_value: value,
        validation_status: 'confirmed'
      }
    });
  }, [addMessage]);

  // Handle clarification rejection
  const handleClarificationReject = useCallback(async (field: string) => {
    chatLogger.info('Clarification rejected', { field });
    
    // Add user message showing rejection
    addMessage({
      type: 'user',
      content: 'no',
      isComplete: true,
      metadata: {
        intent: 'rejection',
        collected_field: field,
        validation_status: 'rejected'
      }
    });
  }, [addMessage]);

  // Get contextual tip
  const getContextualTip = useCallback(() => {
    // Return contextual tip based on current conversation state
    if (state.messages.length === 0) {
      return {
        type: 'info',
        title: 'Welcome!',
        message: 'I\'ll help you get a business valuation. Let\'s start with some basic information about your company.',
        icon: '💡'
      };
    }
    return null;
  }, [state.messages.length]);

  // Get smart follow-ups
  const getSmartFollowUps = useCallback(() => {
    // Return smart follow-up suggestions based on current conversation state
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return [];
    
    if (lastMessage.metadata?.collected_field === 'business_type') {
      return ['SaaS', 'E-commerce', 'Manufacturing', 'Services'];
    }
    if (lastMessage.metadata?.collected_field === 'revenue') {
      return ['$100K - $500K', '$500K - $1M', '$1M - $5M', '$5M+'];
    }
    return [];
  }, [state.messages]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.refs.eventSourceRef.current) {
        state.refs.eventSourceRef.current.close();
      }
    };
  }, [state.refs.eventSourceRef]);
  
  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading state while backend initializes */}
        {isInitializing && state.messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] mr-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center animate-pulse bot-avatar">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-zinc-700/50 text-white">
                  <div className="whitespace-pre-wrap text-sm text-zinc-400">
                    Preparing your personalized valuation experience...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {state.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start gap-3">
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center bot-avatar">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                )}
                
                <div className={`rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-zinc-800 text-white' 
                    : 'bg-zinc-700/50 text-white'
                }`}>
                  <div 
                    className="whitespace-pre-wrap text-sm cursor-pointer" 
                    onClick={() => isTyping && complete()}
                    title={isTyping ? "Click to complete typing" : ""}
                  >
                    {message.type === 'ai' && message.isStreaming ? displayedText : message.content}
                    {message.type === 'ai' && message.isStreaming && (
                      <TypingCursor isVisible={isTyping} />
                    )}
                  </div>
                  
                  {/* Display suggestion chips if available */}
                  {message.type === 'suggestion' && message.metadata?.suggestions && (
                    <div className="mt-3">
                      <SuggestionChips
                        suggestions={message.metadata.suggestions}
                        originalValue={message.metadata.originalValue || ''}
                        onSelect={(selected) => handleSuggestionSelect(message.metadata?.field || '', selected)}
                        onDismiss={() => handleSuggestionDismiss(message.metadata?.field || '', message.metadata?.originalValue || '')}
                      />
                    </div>
                  )}
                  
                  {/* Display clarification confirmation buttons */}
                  {message.metadata?.needs_confirmation && message.metadata?.clarification_value && (
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => handleClarificationConfirm(
                          message.metadata?.clarification_field || '',
                          message.metadata?.clarification_value || ''
                        )}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Yes, "{message.metadata.clarification_value}" is correct
                        </span>
                      </button>
                      <button
                        onClick={() => handleClarificationReject(message.metadata?.clarification_field || '')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                      >
                        <span className="text-sm font-medium">
                          No, let me provide the correct value
                        </span>
                      </button>
                    </div>
                  )}
                  
                  {/* Display help text if available */}
                  {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                    <div className="mt-1">
                      <p className="text-xs text-primary-400">
                        ℹ️ {message.metadata.help_text}
                      </p>
                    </div>
                  )}
                  
                  {/* Display valuation narrative if available */}
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
        
        <div ref={state.refs.messagesEndRef} />
      </div>

      {/* Data Collection Panel */}
      {Object.keys(state.collectedData).length > 0 && (
        <div className="px-4 pb-2">
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Collected Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(state.collectedData).map(([field, data]: [string, any]) => (
                <div key={field} className="flex items-center gap-2 text-xs data-collected-item">
                  <span className="text-zinc-400">{data.icon}</span>
                  <span className="text-zinc-300">{data.display_name}:</span>
                  <span className="text-white font-medium">{data.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calculate Now Button */}
      {state.calculateOption && (
        <div className="px-4 pb-2">
          <div className="bg-primary-600/20 rounded-lg p-4 border border-primary-500/50">
            <p className="text-sm text-white mb-3">{state.calculateOption.message}</p>
            <button
              onClick={() => {
                // Handle calculate now action
                chatLogger.info('Calculate now clicked', { tier: state.calculateOption.tier });
                // TODO: Implement calculate now functionality
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {state.calculateOption.cta}
            </button>
            <p className="text-xs text-zinc-400 mt-2 text-center">
              {state.calculateOption.continue_message}
            </p>
          </div>
        </div>
      )}

      {/* Valuation Preview */}
      {state.valuationPreview && (
        <div className="px-4 pb-2">
          <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/50">
            <h4 className="text-sm font-semibold text-white mb-3">Valuation Preview</h4>
            <div className="text-xs text-zinc-300">
              <p>Range: ${state.valuationPreview.range_low?.toLocaleString()} - ${state.valuationPreview.range_high?.toLocaleString()}</p>
              <p>Confidence: {state.valuationPreview.confidence_label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contextual tip */}
      {getContextualTip() && (
        <div className="px-4 pb-2">
          <ContextualTip {...getContextualTip()!} />
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
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || state.isStreaming}
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
                  <svg 
                    className="w-4 h-4 text-zinc-900" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                    />
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
