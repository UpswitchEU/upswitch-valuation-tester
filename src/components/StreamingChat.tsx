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

import React, { useCallback, useEffect, useRef } from 'react'
import { useMessageManagement } from '../hooks/chat/useMessageManagement'
import { useSmartSuggestions } from '../hooks/chat/useSmartSuggestions'
import { useStreamingCoordinator } from '../hooks/chat/useStreamingCoordinator'
import { useAuth } from '../hooks/useAuth'
import { type UserProfile, useConversationInitializer } from '../hooks/useConversationInitializer'
import { useConversationMetrics } from '../hooks/useConversationMetrics'
import { useStreamingChatState } from '../hooks/useStreamingChatState'
import { useTypingAnimation } from '../hooks/useTypingAnimation'
import { chatLogger } from '../utils/logger'
import { ChatInputForm, MessagesList } from './chat'

// Re-export types for backward compatibility
export type {
  CalculateOptionData,
  CollectedData,
  StreamingChatProps,
  ValuationPreviewData,
} from './StreamingChat.types'

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
  const { user } = useAuth()

  // Track Python-generated session ID separately from client session ID
  const [internalPythonSessionId, setInternalPythonSessionId] = React.useState<string | null>(null)
  const pythonSessionId = pythonSessionIdProp ?? internalPythonSessionId

  const setPythonSessionId = useCallback(
    (id: string | null) => {
      setInternalPythonSessionId(id)
      if (id && onPythonSessionIdReceived) {
        onPythonSessionIdReceived(id)
      }
    },
    [onPythonSessionIdReceived]
  )

  // Sync prop to internal state when prop changes
  useEffect(() => {
    if (pythonSessionIdProp !== undefined && pythonSessionIdProp !== internalPythonSessionId) {
      setInternalPythonSessionId(pythonSessionIdProp)
    }
  }, [pythonSessionIdProp, internalPythonSessionId])

  // Use centralized state management
  const state = useStreamingChatState(sessionId, userId)

  // Extract message management logic
  const messageManagement = useMessageManagement({
    sessionId,
    messages: state.messages,
    setMessages: state.setMessages,
    onMessageComplete,
  })

  // Extract smart suggestions logic
  const { suggestions } = useSmartSuggestions({
    messages: state.messages,
  })

  // Extract streaming coordination logic
  const streamingCoordinator = useStreamingCoordinator({
    sessionId,
    userId: userId ?? user?.id,
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
  })

  // Extract stream submission logic - simplified version for new architecture
  // Accepts optional input parameter to handle async state updates
  const submitStream = useCallback(
    async (inputValue?: string) => {
      const inputToSubmit = inputValue ?? state.input

      // Validate input before submission
      if (!inputToSubmit || !inputToSubmit.trim()) {
        chatLogger.warn('Attempted to submit empty input', { sessionId })
        return
      }

      try {
        // Add user message before starting stream
        messageManagement.addMessage({
          type: 'user',
          content: inputToSubmit.trim(),
          role: 'user',
        })

        // Clear input before starting stream (use provided value or state)
        if (inputValue) {
          state.setInput('')
        } else {
          state.setInput('')
        }

        // Start streaming with validated input
        await streamingCoordinator.startStreaming(inputToSubmit.trim())
      } catch (error) {
        chatLogger.error('Stream submission failed', { error, sessionId })
        // Reset streaming state on error
        state.setIsStreaming(false)
      }
    },
    [
      state.input,
      state.setInput,
      state.setIsStreaming,
      streamingCoordinator,
      messageManagement,
      sessionId,
    ]
  )

  // Extract suggestion handlers - simplified version
  const suggestionHandlers = {
    handleSuggestionSelect: useCallback(
      (suggestion: string) => {
        // Fix Bug 2: Pass suggestion directly to submitStream to avoid async state update issue
        state.setInput(suggestion)
        // Use the suggestion value directly instead of relying on state update
        submitStream(suggestion)
      },
      [state.setInput, submitStream]
    ),

    handleSuggestionDismiss: useCallback(() => {
      // Handle suggestion dismissal if needed
    }, []),

    handleClarificationConfirm: useCallback(
      (messageId: string) => {
        // Fix Bug 3: Set input before calling submitStream
        const confirmationText = 'Yes'
        state.setInput(confirmationText)
        // Pass the confirmation text directly to avoid async state issue
        submitStream(confirmationText)
      },
      [state.setInput, submitStream]
    ),

    handleClarificationReject: useCallback(
      (messageId: string) => {
        // Fix Bug 3: Set input before calling submitStream
        const rejectionText = 'No'
        state.setInput(rejectionText)
        // Pass the rejection text directly to avoid async state issue
        submitStream(rejectionText)
      },
      [state.setInput, submitStream]
    ),

    handleKBOSuggestionSelect: useCallback(
      (selection: string) => {
        // Fix Bug 2: Pass selection directly to submitStream to avoid async state update issue
        state.setInput(selection)
        // Use the selection value directly instead of relying on state update
        submitStream(selection)
      },
      [state.setInput, submitStream]
    ),
  }

  // CRITICAL: Restore messages from backend on mount
  const lastRestoredMessagesRef = useRef<string>('')

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      const messagesFingerprint = initialMessages.map((m) => m.id).join(',')

      const shouldRestore =
        state.messages.length === 0 || lastRestoredMessagesRef.current !== messagesFingerprint

      if (shouldRestore) {
        chatLogger.info('✅ Restoring conversation messages in StreamingChat', {
          sessionId,
          messagesCount: initialMessages.length,
          fingerprint: messagesFingerprint,
        })
        state.setMessages(initialMessages)
        lastRestoredMessagesRef.current = messagesFingerprint
      }
    }
  }, [initialMessages, sessionId, state.messages.length, state.setMessages])

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
  })

  // Use extracted metrics tracking
  const {
    trackModelPerformance: _trackModelPerformance,
    trackConversationCompletion: _trackConversationCompletion,
  } = useConversationMetrics(sessionId, userId)

  // Typing animation for smooth AI responses
  const { complete: _complete } = useTypingAnimation({
    baseSpeed: 50,
    adaptiveSpeed: true,
    punctuationPauses: true,
    showCursor: true,
  })

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (!state.input.trim()) return

      try {
        await submitStream()
      } catch (error) {
        chatLogger.error('Stream submission failed', { error, sessionId })
      }
    },
    [state.input, submitStream, sessionId]
  )

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
  )
}

export default StreamingChat
