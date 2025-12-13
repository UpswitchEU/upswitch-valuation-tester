/**
 * useStreamSubmission Hook
 *
 * Single Responsibility: Handle stream submission logic
 * Extracted from StreamingChat.tsx to follow SRP
 *
 * @module hooks/chat/useStreamSubmission
 */

import { useCallback } from 'react'
import { StreamingManager } from '../../services/chat/StreamingManager'
import { StreamEventHandler } from '../../services/chat/StreamEventHandler'
import { InputValidator } from '../../utils/validation/InputValidator'
import { MessageManager } from '../../utils/chat/MessageManager'
import { chatLogger, debugLogger } from '../../utils/logger'
import { Message } from '../useStreamingChatState'

export interface UseStreamSubmissionOptions {
  sessionId: string
  pythonSessionId: string | null
  userId?: string
  input: string
  messages: Message[]
  streamingManager: StreamingManager
  eventHandler: StreamEventHandler
  inputValidator: InputValidator
  messageManager: MessageManager
  messagesRef: React.MutableRefObject<Message[]>
  isRequestInProgressRef: React.MutableRefObject<boolean>
  setIsStreaming: (streaming: boolean) => void
  setIsTyping: (typing: boolean) => void
  setIsThinking: (thinking: boolean) => void
  setInput: (value: string) => void
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setCurrentStreamingMessageRef: React.MutableRefObject<Message | null>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    updatedMessages: Message[]
    newMessage: Message
  }
  updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: any) => void
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void
  trackConversationCompletion: (success: boolean, hasValuation: boolean) => void
  disabled?: boolean
}

/**
 * Hook for handling stream submission
 *
 * Manages:
 * - Input validation
 * - Stream initialization
 * - Event handling
 * - Error handling
 * - Lock management
 */
export const useStreamSubmission = ({
  sessionId,
  pythonSessionId,
  userId,
  input,
  messages,
  streamingManager,
  eventHandler,
  inputValidator,
  messageManager,
  messagesRef,
  isRequestInProgressRef,
  setIsStreaming,
  setIsTyping,
  setIsThinking,
  setInput,
  setMessages,
  setCurrentStreamingMessageRef,
  addMessage,
  updateStreamingMessage,
  onHtmlPreviewUpdate,
  trackConversationCompletion,
  disabled = false,
}: UseStreamSubmissionOptions) => {
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const userInput = input.trim()

      // CRITICAL DEBUG: Log ALL state BEFORE any checks to diagnose blocking
      debugLogger.log('[DEBUG]', 'handleSubmit ENTRY - Lock State Check', {
        isRequestInProgress: isRequestInProgressRef.current,
        isStreaming: false, // Will be set below
        hasInput: !!userInput,
        disabled,
        inputValue: userInput.substring(0, 30),
        messageCount: messagesRef.current.length,
        timestamp: new Date().toISOString(),
      })

      // CRITICAL DEBUG: Log ALL state BEFORE any checks to diagnose blocking
      debugLogger.log('[DEBUG]', 'handleSubmit ENTRY - Lock State Check', {
        isRequestInProgress: isRequestInProgressRef.current,
        hasInput: !!userInput,
        disabled,
        inputValue: userInput.substring(0, 30),
        messageCount: messagesRef.current.length,
        timestamp: new Date().toISOString(),
      })

      debugLogger.log('[StreamingChat]', 'handleSubmit called', {
        input: userInput,
        sessionId,
        pythonSessionId,
        timestamp: new Date().toISOString(),
      })

      // CRITICAL FIX: Enhanced lock check with detailed logging
      // Check both state and ref to prevent duplicate requests
      if (isRequestInProgressRef.current || !userInput || disabled) {
        debugLogger.warn('[StreamingChat]', 'Submit blocked', {
          reason: !userInput
            ? 'empty input'
            : isRequestInProgressRef.current
              ? 'request in progress'
              : 'disabled',
          requestInProgress: isRequestInProgressRef.current,
          hasInput: !!userInput,
          disabled,
          inputPreview: userInput.substring(0, 20),
        })
        chatLogger.warn('Request blocked by lock', {
          requestInProgress: isRequestInProgressRef.current,
          hasInput: !!userInput,
          disabled,
          inputPreview: userInput.substring(0, 20),
        })
        return
      }

      // FIX: Validate BEFORE setting lock or clearing input
      const validation = await inputValidator.validateInput(userInput, messages, sessionId)
      if (!validation.is_valid) {
        chatLogger.warn('Input validation failed', {
          sessionId,
          errors: validation.errors,
          warnings: validation.warnings,
        })

        // FIX: Show error but DON'T clear input - let user see their mistake
        const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
          type: 'system',
          content: validation.errors.join(', '),
          isComplete: true,
        }
        addMessage(errorMessage)
        return // Exit early, input still visible - lock not set yet
      }

      // Set lock immediately after validation passes to prevent race conditions
      isRequestInProgressRef.current = true

      // CRITICAL FIX: Set isStreaming BEFORE async call to prevent duplicate requests
      setIsStreaming(true)

      // FIX: Add user message IMMEDIATELY (before clearing)
      const userMessageData: Omit<Message, 'id' | 'timestamp'> = {
        type: 'user',
        content: userInput,
        isComplete: true,
      }
      addMessage(userMessageData)

      // FIX: Clear input ONLY after message is successfully added
      setInput('')

      // Track conversation turn
      trackConversationCompletion(false, false)

      // Show thinking state immediately (optimistic UI)
      setIsThinking(true)
      setIsTyping(true)

      // CRITICAL FIX: Use Python session ID if available, otherwise use client session ID
      const effectiveSessionId = pythonSessionId || sessionId

      try {
        await streamingManager.startStreaming(
          effectiveSessionId,
          userInput.trim(),
          userId,
          {
            setIsStreaming,
            addMessage,
            updateStreamingMessage,
            onContextUpdate: (context: any) => {
              onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive')
            },
            extractBusinessModelFromInput: (_input: string) => null,
            extractFoundingYearFromInput: (_input: string) => null,
            onStreamStart: () => {
              // CRITICAL FIX: Reset event handler state when new stream starts
              eventHandler.reset()
              chatLogger.debug('Stream start - reset event handler state')
            },
          },
          (event) => {
            try {
              if (!eventHandler) {
                chatLogger.error('Event handler is null/undefined', {
                  sessionId: effectiveSessionId,
                })
                return
              }

              if (typeof eventHandler.handleEvent !== 'function') {
                chatLogger.error('Event handler handleEvent is not a function', {
                  sessionId: effectiveSessionId,
                  eventHandlerType: typeof eventHandler,
                  hasHandleEvent: 'handleEvent' in eventHandler,
                })
                return
              }

              eventHandler.handleEvent(event)
            } catch (error) {
              chatLogger.error('Error in onEvent callback', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                eventType: event?.type,
                sessionId: event?.session_id || effectiveSessionId,
              })
            }
          },
          (error: Error) => {
            chatLogger.error('Streaming error', {
              error: error.message,
              sessionId: effectiveSessionId,
            })
            setIsStreaming(false)
            setIsTyping(false)
            setIsThinking(false)

            // CRITICAL FIX: Add error message to chat so user knows what happened
            addMessage({
              type: 'system',
              content: `Error: ${error.message || 'Failed to complete valuation. Please try again.'}`,
              isComplete: true,
            })
          }
        )

        chatLogger.debug('Stream request completed')
      } catch (error) {
        chatLogger.error('Streaming failed', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          sessionId: effectiveSessionId,
        })
        setIsStreaming(false)
        setIsTyping(false)
        setIsThinking(false)

        // CRITICAL FIX: Add error message to chat so user knows what happened
        addMessage({
          type: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to complete valuation. Please try again.'}`,
          isComplete: true,
        })
      } finally {
        // CRITICAL FIX: ALWAYS release lock when done (success or error)
        isRequestInProgressRef.current = false
        chatLogger.debug('Request lock released', {
          sessionId: effectiveSessionId,
          isStreaming: false,
        })
      }
    },
    [
      sessionId,
      pythonSessionId,
      userId,
      input,
      messages,
      streamingManager,
      eventHandler,
      inputValidator,
      messageManager,
      messagesRef,
      isRequestInProgressRef,
      setIsStreaming,
      setIsTyping,
      setIsThinking,
      setInput,
      addMessage,
      updateStreamingMessage,
      onHtmlPreviewUpdate,
      trackConversationCompletion,
      disabled,
    ]
  )

  return { handleSubmit }
}
