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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.refs.eventSourceRef.current) {
        state.refs.eventSourceRef.current.close();
      }
    };
  }, [state.refs.eventSourceRef]);
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : message.type === 'system'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {message.type === 'ai' && <Bot className="w-4 h-4" />}
                {message.type === 'user' && <User className="w-4 h-4" />}
                {message.type === 'system' && <CheckCircle className="w-4 h-4" />}
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap">
                {message.type === 'ai' && message.isStreaming ? displayedText : message.content}
                {message.type === 'ai' && message.isStreaming && <TypingCursor />}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {state.isStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <LoadingDots />
            </div>
          </div>
        )}
        
        {/* Initialization loading */}
        {isInitializing && (
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initializing conversation...</span>
            </div>
          </div>
        )}
        
        <div ref={state.refs.messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={state.input}
            onChange={(e) => state.setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || state.isStreaming}
            className="flex-1 rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent text-gray-900 border border-gray-300"
            style={{ minHeight: '60px', height: '60px' }}
          />
          <button
            type="submit"
            disabled={disabled || state.isStreaming || !state.input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
