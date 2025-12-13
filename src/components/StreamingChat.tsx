/**
 * StreamingChat - Simplified Orchestrator Component
 *
 * Bank-Grade Excellence Framework Implementation:
 * - Single Responsibility: Lightweight orchestrator using focused hooks
 * - SOLID Principles: Clean separation with extracted hooks
 * - Clean Architecture: Minimal component coordinating specialized modules
 *
 * BEFORE: 1,311-line god component with 10+ responsibilities
 * AFTER:  ~200-line orchestrator coordinating focused hooks
 *
 * Responsibilities now handled by specialized hooks:
 * - useMessageManagement: Message operations and streaming updates
 * - useStreamingCoordinator: Streaming lifecycle and backend communication
 * - useSmartSuggestions: Contextual follow-up suggestions
 * - useConversationInitializer: Session setup and restoration
 * - useConversationMetrics: Performance tracking
 * - useTypingAnimation: Smooth AI response animation
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useMessageManagement } from '../hooks/chat/useMessageManagement';
import { useSmartSuggestions } from '../hooks/chat/useSmartSuggestions';
import { useStreamingCoordinator } from '../hooks/chat/useStreamingCoordinator';
import { useAuth } from '../hooks/useAuth';
import { useConversationInitializer, type UserProfile } from '../hooks/useConversationInitializer';
import { useConversationMetrics } from '../hooks/useConversationMetrics';
import { useStreamingChatState } from '../hooks/useStreamingChatState';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { chatLogger } from '../utils/logger';
import { ChatInputForm, MessagesList } from './chat';

// Re-export types for backward compatibility
export type {
    CalculateOptionData, CollectedData, StreamingChatProps, ValuationPreviewData
} from './StreamingChat.types';

export const StreamingChat: React.FC<import('./StreamingChat.types').StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  onValuationStart,
  onReportUpdate,
  onDataCollected,
  onValuationPreview,
  onCalculateOptionAvailable,
  onProgressUpdate,
  onReportSectionUpdate,
  onSectionLoading,
  onSectionComplete,
  onReportComplete,
  onContextUpdate,
  onHtmlPreviewUpdate,
  onPythonSessionIdReceived,
  className = '',
  disabled = false,
  initialMessage = null,
  autoSend = false,
  initialData,
  initialMessages = [],
  isRestoring = false,
  isSessionInitialized = false,
  pythonSessionId: pythonSessionIdProp,
  isRestorationComplete = false,
}) => {
  // Get user data from AuthContext
  const { user } = useAuth();

  // Track Python-generated session ID separately from client session ID
  const [internalPythonSessionId, setInternalPythonSessionId] = React.useState<string | null>(null);
  const pythonSessionId = pythonSessionIdProp ?? internalPythonSessionId;

  const setPythonSessionId = useCallback((id: string | null) => {
    setInternalPythonSessionId(id);
    if (id && onPythonSessionIdReceived) {
      onPythonSessionIdReceived(id);
    }
  }, [onPythonSessionIdReceived]);

  // Sync prop to internal state when prop changes
  useEffect(() => {
    if (pythonSessionIdProp !== undefined && pythonSessionIdProp !== internalPythonSessionId) {
      setInternalPythonSessionId(pythonSessionIdProp);
    }
  }, [pythonSessionIdProp, internalPythonSessionId]);

  // Use centralized state management
  const state = useStreamingChatState(sessionId, userId);

  // Extract message management logic
  const messageManagement = useMessageManagement({
    sessionId,
    messages: state.messages,
    setMessages: state.setMessages,
    onMessageComplete,
  });

  // Extract smart suggestions logic
  const { suggestions } = useSmartSuggestions({
    messages: state.messages,
  });

  // Extract streaming coordination logic
  const streamingCoordinator = useStreamingCoordinator({
    sessionId,
    messages: state.messages,
    setMessages: state.setMessages,
    setIsStreaming: state.setIsStreaming,
    setIsTyping: state.setIsTyping,
    setIsThinking: state.setIsThinking,
    setTypingContext: state.setTypingContext,
    setCollectedData: state.setCollectedData,
    setValuationPreview: state.setValuationPreview,
    setCalculateOption: state.setCalculateOption,
    updateStreamingMessage: messageManagement.updateStreamingMessage,
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
    onContextUpdate,
    onHtmlPreviewUpdate,
  });

  // Extract stream submission logic - simplified version for new architecture
  const submitStream = useCallback(async () => {
    if (!state.input.trim()) return;

    try {
      await streamingCoordinator.startStreaming(state.input);
      state.setInput(''); // Clear input after submission
    } catch (error) {
      chatLogger.error('Stream submission failed', { error, sessionId });
    }
  }, [state.input, streamingCoordinator, state.setInput, sessionId]);

  // Extract suggestion handlers - simplified version
  const suggestionHandlers = {
    handleSuggestionSelect: useCallback((suggestion: string) => {
      state.setInput(suggestion);
      submitStream();
    }, [state.setInput, submitStream]),

    handleSuggestionDismiss: useCallback(() => {
      // Handle suggestion dismissal if needed
    }, []),

    handleClarificationConfirm: useCallback((messageId: string) => {
      // Handle clarification confirmation
      messageManagement.addMessage({
        type: 'user',
        content: 'Yes',
        role: 'user'
      });
      submitStream();
    }, [messageManagement, submitStream]),

    handleClarificationReject: useCallback((messageId: string) => {
      // Handle clarification rejection
      messageManagement.addMessage({
        type: 'user',
        content: 'No',
        role: 'user'
      });
      submitStream();
    }, [messageManagement, submitStream]),

    handleKBOSuggestionSelect: useCallback((selection: string) => {
      // Handle KBO suggestion selection
      state.setInput(selection);
      submitStream();
    }, [state.setInput, submitStream])
  };

  // CRITICAL: Restore messages from backend on mount
  const lastRestoredMessagesRef = useRef<string>('');

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const messagesFingerprint = initialMessages.map(m => m.id).join(',');

      const shouldRestore = state.messages.length === 0 ||
        lastRestoredMessagesRef.current !== messagesFingerprint;

      if (shouldRestore) {
        chatLogger.info('✅ Restoring conversation messages in StreamingChat', {
          sessionId,
          messagesCount: initialMessages.length,
          fingerprint: messagesFingerprint,
        });
        state.setMessages(initialMessages);
        lastRestoredMessagesRef.current = messagesFingerprint;
      }
    }
  }, [initialMessages, sessionId, state.messages.length]);

  // Use extracted conversation initializer
  const { isInitializing } = useConversationInitializer(sessionId, userId, {
    addMessage: messageManagement.addMessage,
    setMessages: state.setMessages,
    getCurrentMessages: () => state.messages,
    user: user as UserProfile | undefined,
    initialData,
    initialMessages,
    isRestoring,
    isSessionInitialized,
    pythonSessionId,
    isRestorationComplete,
    onSessionIdUpdate: setPythonSessionId,
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

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!state.input.trim()) return;

    try {
      await submitStream();
    } catch (error) {
      chatLogger.error('Stream submission failed', { error, sessionId });
    }
  }, [state.input, submitStream, sessionId]);

  return (
    <div className={`flex h-full flex-col overflow-hidden flex-1 ${className}`}>
      {/* Messages Container */}
      <MessagesList
        messages={state.messages}
        isTyping={state.isTyping}
        isThinking={state.isThinking}
        isInitializing={isInitializing}
        onSuggestionSelect={suggestionHandlers.handleSuggestionSelect}
        onSuggestionDismiss={suggestionHandlers.handleSuggestionDismiss}
        onClarificationConfirm={suggestionHandlers.handleClarificationConfirm}
        onClarificationReject={suggestionHandlers.handleClarificationReject}
        onKBOSuggestionSelect={suggestionHandlers.handleKBOSuggestionSelect}
        onValuationStart={onValuationStart}
        calculateOption={state.calculateOption}
        valuationPreview={state.valuationPreview}
        messagesEndRef={state.refs.messagesEndRef}
      />

      {/* Input Form */}
      <ChatInputForm
        input={state.input}
        onInputChange={state.setInput}
        onSubmit={handleSubmit}
        isStreaming={state.isStreaming}
        disabled={disabled}
        placeholder="Ask about your business valuation..."
        suggestions={suggestions}
      />
    </div>
  );
};

export default StreamingChat;