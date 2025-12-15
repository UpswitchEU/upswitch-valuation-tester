/**
 * useStreamingCoordinator - Extracted streaming coordination logic from StreamingChat
 *
 * Handles streaming lifecycle, cleanup, and coordination with backend.
 * Follows Single Responsibility Principle by focusing only on streaming operations.
 */

import { useCallback, useEffect, useRef } from 'react'
import type {
  CalculateOptionData,
  CollectedData,
  ValuationPreviewData,
} from '../../components/StreamingChat.types'
import { ModelPerformanceMetrics, StreamEventHandler } from '../../services/chat/StreamEventHandler'
import type { StreamEvent } from '../../services/chat/streamingChatService'
import {
  StreamingManager,
  type StreamingManagerCallbacks,
} from '../../services/chat/StreamingManager'
import type { ValuationResponse } from '../../types/valuation'
import {
  extractBusinessModelFromInput,
  extractFoundingYearFromInput,
} from '../../utils/businessExtractionUtils'
import { convertToApplicationError, getErrorMessage } from '../../utils/errors/errorConverter'
import { isNetworkError, isTimeoutError } from '../../utils/errors/errorGuards'
import { chatLogger } from '../../utils/logger'
import type { Message } from '../useStreamingChatState'
import { useValuationSessionStore } from '../../store/useValuationSessionStore'

export interface UseStreamingCoordinatorOptions {
  sessionId: string
  pythonSessionId?: string | null // CRITICAL: Python backend session ID (preferred over client sessionId)
  userId?: string
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setIsStreaming: (streaming: boolean) => void
  setIsTyping: (typing: boolean) => void
  setIsThinking: (thinking: boolean) => void
  setTypingContext: (context?: string) => void
  setCollectedData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  setValuationPreview: (preview: ValuationPreviewData) => void
  setCalculateOption: (option: CalculateOptionData) => void
  updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: unknown) => void
  onValuationComplete?: (result: ValuationResponse) => void
  onReportUpdate?: (htmlContent: string, progress: number) => void
  onDataCollected?: (data: CollectedData) => void
  onValuationPreview?: (data: ValuationPreviewData) => void
  onCalculateOptionAvailable?: (data: CalculateOptionData) => void
  onProgressUpdate?: (data: unknown) => void
  onReportSectionUpdate?: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void
  onSectionLoading?: (section: string, html: string, phase: number, data?: unknown) => void
  onSectionComplete?: (event: {
    sectionId: string
    sectionName: string
    html: string
    progress: number
    phase?: number
  }) => void
  onReportComplete?: (html: string, valuationId: string) => void
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void
  trackModelPerformance?: (metrics: ModelPerformanceMetrics) => void
  trackConversationCompletion?: (success: boolean, hasValuation: boolean) => void
}

export interface UseStreamingCoordinatorReturn {
  startStreaming: (userInput: string) => Promise<void>
  stopStreaming: () => void
  isStreaming: boolean
}

/**
 * Streaming coordinator hook
 *
 * Manages the complete streaming lifecycle including:
 * - Starting streaming sessions
 * - Event handling coordination
 * - Cleanup and error handling
 * - Backend communication
 */
export function useStreamingCoordinator({
  sessionId,
  pythonSessionId,
  userId,
  messages,
  setMessages,
  setIsStreaming,
  setIsTyping,
  setIsThinking,
  setTypingContext,
  setCollectedData,
  setValuationPreview,
  setCalculateOption,
  updateStreamingMessage,
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
  trackModelPerformance,
  trackConversationCompletion,
}: UseStreamingCoordinatorOptions): UseStreamingCoordinatorReturn {
  // CRITICAL: Use Python session ID if available, otherwise fall back to client session ID
  const effectiveSessionId = pythonSessionId || sessionId
  // Refs for streaming state
  const streamingManagerRef = useRef<StreamingManager | null>(null)
  const eventHandlerRef = useRef<StreamEventHandler | null>(null)
  const _activeRequestRef = useRef<{ abort: () => void } | null>(null)

  // Initialize streaming manager
  useEffect(() => {
    const requestIdRef = { current: null }
    const currentStreamingMessageRef = { current: null }
    const eventSourceRef: { current: EventSource | null } = { current: null }
    const abortControllerRef: { current: AbortController | null } = { current: null }

    streamingManagerRef.current = new StreamingManager(requestIdRef, currentStreamingMessageRef)

    // Create event handler with all callbacks
    eventHandlerRef.current = new StreamEventHandler(effectiveSessionId, {
      updateStreamingMessage,
      setIsStreaming,
      setIsTyping,
      setIsThinking,
      setTypingContext,
      setCollectedData,
      setValuationPreview,
      setCalculateOption,
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
        // Simple message addition for streaming context
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date(),
          },
        ])
        return { updatedMessages: [], newMessage: {} as Message }
      },
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
      trackModelPerformance: trackModelPerformance || (() => {}),
      trackConversationCompletion: trackConversationCompletion || (() => {}),
    })

    return () => {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [
    sessionId,
    pythonSessionId,
    // effectiveSessionId is derived from pythonSessionId and sessionId, so we don't need it in deps
    setMessages,
    setIsStreaming,
    setIsTyping,
    setIsThinking,
    setTypingContext,
    setCollectedData,
    setValuationPreview,
    setCalculateOption,
    updateStreamingMessage,
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
  ])

  // Start streaming session
  const startStreaming = useCallback(
    async (userInput: string) => {
      if (!streamingManagerRef.current || !eventHandlerRef.current) {
        throw new Error('Streaming coordinator not initialized')
      }

      // Validate input before starting stream
      if (!userInput || !userInput.trim()) {
        chatLogger.warn('Attempted to start streaming with empty input', { 
          sessionId,
          pythonSessionId,
          effectiveSessionId,
        })
        return
      }

      // Create callbacks object matching StreamingManagerCallbacks interface
      const callbacks: StreamingManagerCallbacks = {
        setIsStreaming,
        addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
          // Simple message addition for streaming context
          setMessages((prev) => {
            const newMessage: Message = {
              ...message,
              id: `msg-${Date.now()}`,
              timestamp: new Date(),
            }
            return [...prev, newMessage]
          })

          // Mark as having unsaved conversation changes
          useValuationSessionStore.getState().updateSessionData({})

          return { updatedMessages: [], newMessage: {} as Message }
        },
        updateStreamingMessage,
        extractBusinessModelFromInput,
        extractFoundingYearFromInput,
        onStreamStart: () => {
          // Reset event handler state when new stream starts
          eventHandlerRef.current?.reset()
        },
      }

      // Create event handler
      const onEvent = (event: StreamEvent) => {
        try {
          eventHandlerRef.current?.handleEvent(event)
        } catch (error) {
          const appError = convertToApplicationError(error, {
            sessionId,
            pythonSessionId,
            effectiveSessionId,
            eventType: event.type,
            operation: 'event_handling',
          })

          // Type assertion since we know appError is an ApplicationError from convertToApplicationError
          const errorDetails = appError as any

          if (isNetworkError(appError)) {
            chatLogger.error('Network error handling streaming event', {
              error: errorDetails.message,
              code: errorDetails.code,
              sessionId,
              pythonSessionId,
              effectiveSessionId,
              eventType: event.type,
            })
          } else if (isTimeoutError(appError)) {
            chatLogger.error('Timeout handling streaming event', {
              error: errorDetails.message,
              code: errorDetails.code,
              sessionId,
              pythonSessionId,
              effectiveSessionId,
              eventType: event.type,
            })
          } else {
            chatLogger.error('Error handling streaming event', {
              error: errorDetails.message,
              code: errorDetails.code,
              sessionId,
              pythonSessionId,
              effectiveSessionId,
              eventType: event.type,
            })
          }
        }
      }

      // Create error handler
      const onError = (error: Error) => {
        chatLogger.error('Streaming error', {
          error: error.message,
          sessionId,
          pythonSessionId,
          effectiveSessionId,
          stack: error.stack,
        })
        setIsStreaming(false)
        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            type: 'system',
            content: `Error: ${error.message}`,
            timestamp: new Date(),
          },
        ])
      }

      try {
        setIsStreaming(true)
        // Reset event handler state before starting new stream
        eventHandlerRef.current.reset()

        // CRITICAL: Use Python session ID if available, otherwise fall back to client session ID
        chatLogger.info('Starting stream with session ID', {
          clientSessionId: sessionId,
          pythonSessionId,
          effectiveSessionId,
        })
        
        // Call startStreaming with all 6 required parameters
        await streamingManagerRef.current.startStreaming(
          effectiveSessionId,
          userInput,
          userId,
          callbacks,
          onEvent,
          onError
        )
      } catch (error) {
        setIsStreaming(false)

        const appError = convertToApplicationError(error, {
          sessionId,
          pythonSessionId,
          effectiveSessionId,
          operation: 'stream_start',
        })

        // Type assertion since we know appError is an ApplicationError from convertToApplicationError
        const errorDetails = appError as any

        if (isNetworkError(appError)) {
          chatLogger.error('Network error starting stream', {
            error: errorDetails.message,
            code: errorDetails.code,
            sessionId,
            pythonSessionId,
            effectiveSessionId,
          })
        } else if (isTimeoutError(appError)) {
          chatLogger.error('Timeout starting stream', {
            error: errorDetails.message,
            code: errorDetails.code,
            sessionId,
            pythonSessionId,
            effectiveSessionId,
          })
        } else {
          chatLogger.error('Error starting stream', {
            error: errorDetails.message,
            code: errorDetails.code,
            sessionId,
            pythonSessionId,
            effectiveSessionId,
          })
        }

        // Convert to Error for onError handler (maintains backward compatibility)
        const errorForHandler = appError instanceof Error ? appError : new Error(getErrorMessage(appError))
        onError(errorForHandler)

        throw appError
      }
    },
    [sessionId, pythonSessionId, userId, setIsStreaming, setMessages, updateStreamingMessage]
    // effectiveSessionId is derived from pythonSessionId and sessionId, so we don't need it in deps
  )

  // Stop streaming session
  const stopStreaming = useCallback(() => {
    if (streamingManagerRef.current) {
      streamingManagerRef.current.clearCurrentRequest()
    }
    setIsStreaming(false)
  }, [setIsStreaming])

  return {
    startStreaming,
    stopStreaming,
    isStreaming: false, // This would need to be tracked in state
  }
}
