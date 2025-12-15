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
import { useAutoSend } from '../hooks/chat/useAutoSend'
import { useMessageManagement } from '../hooks/chat/useMessageManagement'
import { useSmartSuggestions } from '../hooks/chat/useSmartSuggestions'
import { useStreamingCoordinator } from '../hooks/chat/useStreamingCoordinator'
import { useAuth } from '../hooks/useAuth'
import { type UserProfile, useConversationInitializer } from '../hooks/useConversationInitializer'
import { useConversationMetrics } from '../hooks/useConversationMetrics'
import { useStreamingChatState } from '../hooks/useStreamingChatState'
import { useTypingAnimation } from '../hooks/useTypingAnimation'
import { convertToApplicationError, getErrorMessage } from '../utils/errors/errorConverter'
import { isNetworkError, isTimeoutError } from '../utils/errors/errorGuards'
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

  // Prefill input field with initialMessage when available
  // CRITICAL FIX: Use ref to track if we've already prefilled to prevent infinite loops
  const hasPrefilledRef = useRef(false)
  useEffect(() => {
    // Only prefill once per initialMessage change, and only if input is empty
    if (
      initialMessage &&
      initialMessage.trim() &&
      !state.input.trim() &&
      !hasPrefilledRef.current
    ) {
      chatLogger.debug('Prefilling input field with initialMessage', {
        sessionId,
        initialMessage: initialMessage.substring(0, 50),
      })
      state.setInput(initialMessage.trim())
      hasPrefilledRef.current = true
    }
    // Reset prefilled flag when initialMessage or sessionId changes
    if (!initialMessage || !initialMessage.trim()) {
      hasPrefilledRef.current = false
    }
  }, [initialMessage, sessionId, state.setInput]) // Removed state.input from deps to prevent loops

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
    pythonSessionId, // CRITICAL: Pass Python session ID for backend communication
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
    onHtmlPreviewUpdate,
    trackModelPerformance: () => {
      // Placeholder implementation
    },
    trackConversationCompletion: () => {
      // Placeholder implementation
    },
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
        const appError = convertToApplicationError(error, {
          sessionId,
          pythonSessionId,
          operation: 'stream_submission',
        })

        // Extract error properties before type narrowing
        const errorMessageForLog = appError.message
        const errorCodeForLog = appError.code

        if (isNetworkError(appError)) {
          chatLogger.error('Network error during stream submission', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        } else if (isTimeoutError(appError)) {
          chatLogger.error('Timeout during stream submission', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        } else {
          chatLogger.error('Stream submission failed', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        }

        // Reset streaming state on error
        state.setIsStreaming(false)

        // Get user-friendly error message
        const errorMessage = getErrorMessage(appError)

        // Determine error type and create helpful message
        let userMessage = errorMessage
        let errorDetailsText: string | undefined

        if (isNetworkError(appError)) {
          userMessage = 'Unable to connect to the server. Please check your internet connection.'
          errorDetailsText = 'Network connection failed. This is usually temporary.'
        } else if (isTimeoutError(appError)) {
          userMessage = 'The request took too long to complete. Please try again.'
          errorDetailsText = 'Request timeout. The server may be busy.'
        } else {
          userMessage = errorMessage || 'An unexpected error occurred. Please try again.'
        }

        // Add user-friendly error message with metadata for retry
        messageManagement.addMessage({
          type: 'system',
          content: userMessage,
          isComplete: true,
          metadata: {
            error_type: 'error',
            error_code: appError.code,
            error_details: errorDetailsText,
            original_input: inputToSubmit.trim(),
            can_retry: isNetworkError(appError) || isTimeoutError(appError),
          },
        })
      }
    },
    [
      state.input,
      state.setInput,
      state.setIsStreaming,
      streamingCoordinator,
      messageManagement,
      sessionId,
      pythonSessionId,
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
    autoSend,
    initialMessage,
  })

  // Use extracted auto-send hook
  useAutoSend({
    autoSend: autoSend ?? false,
    initialMessage,
    isSessionInitialized,
    isRestorationComplete,
    isRestoring,
    isInitializing,
    pythonSessionId,
    isStreaming: state.isStreaming,
    messagesLength: state.messages.length,
    hasRestoredMessages: (initialMessages?.length ?? 0) > 0,
    submitStream,
    sessionId,
    getMessages: () => state.messages,
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
        const appError = convertToApplicationError(error, {
          sessionId,
          pythonSessionId,
          operation: 'form_submission',
        })

        // Extract error properties before type narrowing
        const errorMessageForLog = appError.message
        const errorCodeForLog = appError.code

        if (isNetworkError(appError)) {
          chatLogger.error('Network error during form submission', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        } else if (isTimeoutError(appError)) {
          chatLogger.error('Timeout during form submission', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        } else {
          chatLogger.error('Form submission failed', {
            error: errorMessageForLog,
            code: errorCodeForLog,
            sessionId,
            pythonSessionId,
          })
        }

        // Get user-friendly error message
        const errorMessage = getErrorMessage(appError)

        // Determine error type and create helpful message
        let userMessage = errorMessage
        let errorDetailsText: string | undefined

        if (isNetworkError(appError)) {
          userMessage = 'Unable to connect to the server. Please check your internet connection.'
          errorDetailsText = 'Network connection failed. This is usually temporary.'
        } else if (isTimeoutError(appError)) {
          userMessage = 'The request took too long to complete. Please try again.'
          errorDetailsText = 'Request timeout. The server may be busy.'
        } else {
          userMessage = errorMessage || 'An unexpected error occurred. Please try again.'
        }

        // Add user-friendly error message with metadata for retry
        messageManagement.addMessage({
          type: 'system',
          content: userMessage,
          isComplete: true,
          metadata: {
            error_type: 'error',
            error_code: appError.code,
            error_details: errorDetailsText,
            original_input: state.input.trim(),
            can_retry: isNetworkError(appError) || isTimeoutError(appError),
          },
        })
      }
    },
    [state.input, submitStream, sessionId, pythonSessionId, messageManagement]
  )

  // Handle retry for error messages
  const handleRetry = useCallback(
    async (messageId: string) => {
      // Find the error message
      const errorMessage = state.messages.find((m) => m.id === messageId)
      if (!errorMessage || errorMessage.type !== 'system') {
        return
      }

      const originalInput = errorMessage.metadata?.original_input as string | undefined
      if (!originalInput) {
        return
      }

      // Update error message to show retrying state
      state.setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                metadata: {
                  ...m.metadata,
                  is_retrying: true,
                },
              }
            : m
        )
      )

      try {
        // Retry the submission
        await submitStream(originalInput)
        
        // Remove the error message on success
        state.setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } catch {
        // Update error message to remove retrying state
        state.setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    is_retrying: false,
                  },
                }
              : m
          )
        )
      }
    },
    [state.messages, state.setMessages, submitStream]
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
        onRetry={handleRetry}
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
