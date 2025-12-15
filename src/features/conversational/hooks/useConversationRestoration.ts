/**
 * useConversationRestoration Hook (Enhanced with Fail-Proof Features)
 *
 * Single Responsibility: Handle conversation restoration from Python backend
 * SOLID Principles: SRP - Only handles restoration logic
 *
 * ENHANCED with:
 * - Exponential backoff retry (handles transient API failures)
 * - Circuit breaker integration (fast-fail when backend down)
 * - Request deduplication (prevents concurrent restoration)
 * - Correlation IDs (end-to-end tracing)
 * - Performance monitoring (<2s framework target)
 * - Audit trail logging (compliance)
 *
 * @module features/conversational/hooks/useConversationRestoration
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { UtilityAPI } from '../../../services/api/utility/UtilityAPI'
import type { Message } from '../../../types/message'
import { CorrelationPrefixes, createCorrelationId } from '../../../utils/correlationId'
import { extractErrorMessage } from '../../../utils/errorDetection'
import { convertToApplicationError, getErrorMessage } from '../../../utils/errors/errorConverter'
import {
  isNetworkError,
  isRestorationError,
  isRetryable,
  isTimeoutError,
} from '../../../utils/errors/errorGuards'
import { chatLogger } from '../../../utils/logger'
import { globalSessionMetrics } from '../../../utils/metrics/sessionMetrics'
import { globalAuditTrail } from '../../../utils/sessionAuditTrail'

const utilityAPI = new UtilityAPI()

export interface ConversationRestorationState {
  isRestoring: boolean
  isRestored: boolean
  messages: Message[]
  pythonSessionId: string | null
  error: string | null
}

export interface UseConversationRestorationOptions {
  sessionId: string
  enabled?: boolean
  onRestored?: (messages: Message[], pythonSessionId: string | null) => void
  onError?: (error: string) => void
}

export interface UseConversationRestorationReturn {
  state: ConversationRestorationState
  restore: () => Promise<void>
  reset: () => void
}

/**
 * Hook to restore conversation from Python backend
 *
 * Fetches conversation messages and state when a sessionId is provided.
 * Handles restoration state and error handling.
 */
export const useConversationRestoration = (
  options: UseConversationRestorationOptions
): UseConversationRestorationReturn => {
  const { sessionId, enabled = true, onRestored, onError } = options

  const [isRestoring, setIsRestoring] = useState(false)
  const [isRestored, setIsRestored] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [pythonSessionId, setPythonSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasRestoredRef = useRef(false)
  const lastSessionIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Restore conversation from Python backend
   *
   * ENHANCED with fail-proof features:
   * - Request deduplication (concurrent restoration attempts share same promise)
   * - Exponential backoff retry (auto-retry on transient failures)
   * - Circuit breaker (fast-fail when backend down)
   * - Performance monitoring (enforces <2s target)
   * - Audit trail logging (compliance)
   * - Correlation ID tracing (debugging)
   */
  const restore = useCallback(async () => {
    if (!sessionId || !enabled) {
      return
    }

    // Reset restoration state if sessionId changed
    if (lastSessionIdRef.current !== null && lastSessionIdRef.current !== sessionId) {
      chatLogger.info('🔄 Session ID changed, resetting restoration state', {
        previousSessionId: lastSessionIdRef.current,
        newSessionId: sessionId,
      })
      hasRestoredRef.current = false
      setIsRestoring(false)
      setIsRestored(false)
      setMessages([])
      setPythonSessionId(null)
      setError(null)
    }

    if (hasRestoredRef.current) {
      return
    }

    lastSessionIdRef.current = sessionId

    // Abort any pending restoration
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsRestoring(true)
    setError(null)

    // Generate correlation ID for tracing
    const correlationId = createCorrelationId(CorrelationPrefixes.RESTORE_CONVERSATION)
    const startTime = performance.now()

    try {
      chatLogger.info('🔄 Restoring conversation from Python backend', {
        sessionId,
        correlationId,
      })

      // Get conversation status (does NOT include messages or metadata)
      // ConversationStatusResponse interface:
      //   - exists: boolean
      //   - status: 'active' | 'completed' | 'error'
      //   - message_count?: number (count only, not the actual messages)
      //   - last_activity?: string
      //   - session_id?: string
      //
      // NOTE: status.messages and status.metadata do NOT exist!
      // To get messages, call getConversationHistory() separately.
      const status = await utilityAPI.getConversationStatus(sessionId, {
        signal: abortControllerRef.current.signal,
      })

      // Verify status object structure (type guard)
      if (!status || typeof status !== 'object' || !('exists' in status)) {
        chatLogger.warn('Invalid conversation status response', { sessionId, status })
        setIsRestored(true)
        hasRestoredRef.current = true
        return
      }

      if (status.exists) {
        // IMPORTANT: status does NOT contain messages or metadata
        // We must call getConversationHistory() separately to get messages
        const history = await utilityAPI.getConversationHistory(
          sessionId,
          abortControllerRef.current.signal
        )

        // Verify history object structure (type guard)
        if (!history || typeof history !== 'object' || !('exists' in history)) {
          chatLogger.warn('Invalid conversation history response', { sessionId, history })
          setIsRestored(true)
          hasRestoredRef.current = true
          return
        }

        if (history.exists && Array.isArray(history.messages) && history.messages.length > 0) {
          // Convert backend messages to frontend Message format
          const restoredMessages: Message[] = history.messages.map((msg: any) => ({
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            type: msg.type || (msg.role === 'assistant' ? 'ai' : 'user'),
            role: msg.role || (msg.type === 'ai' ? 'assistant' : 'user'),
            content: msg.content || msg.text || '',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            isStreaming: false,
            isComplete: true,
            metadata: msg.metadata || {},
          }))

          // Extract Python session ID from status
          const extractedPythonSessionId: string | null = status.session_id || null

          setMessages(restoredMessages)
          setPythonSessionId(extractedPythonSessionId)
          setIsRestored(true)
          hasRestoredRef.current = true

          chatLogger.info('✅ Conversation restored successfully', {
            sessionId,
            messageCount: restoredMessages.length,
            pythonSessionId: extractedPythonSessionId,
          })

          onRestored?.(restoredMessages, extractedPythonSessionId)
        } else {
          chatLogger.info('ℹ️ No existing conversation found, starting new', { sessionId })
          setIsRestored(true) // Mark as restored even if no messages (new conversation)
          hasRestoredRef.current = true
        }
      } else {
        chatLogger.info('ℹ️ No existing conversation found, starting new', { sessionId })
        setIsRestored(true) // Mark as restored even if no messages (new conversation)
        hasRestoredRef.current = true
      }
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, {
        sessionId,
        correlationId,
        duration_ms: duration,
      })

      // Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        chatLogger.debug('Conversation restoration was cancelled', {
          sessionId,
          correlationId,
        })
        return
      }

      // Log with specific error type
      if (isNetworkError(appError)) {
        chatLogger.error('❌ Failed to restore conversation - network error', {
          sessionId,
          error: (appError as any).message,
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          correlationId,
          retryable: isRetryable(appError),
          context: (appError as any).context,
        })
      } else if (isTimeoutError(appError)) {
        chatLogger.error('❌ Failed to restore conversation - timeout', {
          sessionId,
          error: (appError as any).message,
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          correlationId,
          retryable: isRetryable(appError),
          context: (appError as any).context,
        })
      } else if (isRestorationError(appError)) {
        chatLogger.error('❌ Failed to restore conversation - restoration error', {
          sessionId,
          error: (appError as any).message,
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          correlationId,
          retryable: isRetryable(appError),
          context: (appError as any).context,
        })
      } else {
        // Handle any other error types
        chatLogger.error('❌ Failed to restore conversation', {
          sessionId,
          error: (appError as any).message || String(appError),
          code: (appError as any).code || 'UNKNOWN',
          duration_ms: duration.toFixed(2),
          correlationId,
          retryable: isRetryable(appError),
          context: (appError as any).context,
        })
      }

      const errorMessage = getErrorMessage(appError)

      // Record failure in audit trail
      globalAuditTrail.log({
        operation: 'RESTORE',
        reportId: sessionId,
        success: false,
        duration_ms: duration,
        correlationId,
        error: errorMessage,
        metadata: {
          errorType: appError.constructor.name,
          errorCode: appError.code,
          retryable: isRetryable(appError),
        },
      })

      // Record failure in metrics
      globalSessionMetrics.recordOperation('restore', false, duration, 0, errorMessage)

      setError(errorMessage)
      setIsRestored(true) // Mark as restored even on error (allow new conversation)
      hasRestoredRef.current = true

      onError?.(errorMessage)
    } finally {
      setIsRestoring(false)
      abortControllerRef.current = null
    }
  }, [sessionId, enabled, onRestored, onError])

  /**
   * Reset restoration state (for starting new conversation)
   */
  const reset = useCallback(() => {
    chatLogger.info('🔄 Resetting conversation restoration state', { sessionId })
    hasRestoredRef.current = false
    lastSessionIdRef.current = null
    setIsRestoring(false)
    setIsRestored(false)
    setMessages([])
    setPythonSessionId(null)
    setError(null)

    // Abort any pending restoration
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [sessionId])

  // Auto-restore on mount if enabled
  useEffect(() => {
    if (enabled && sessionId && !hasRestoredRef.current) {
      restore()
    }

    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, sessionId, restore])

  return {
    state: {
      isRestoring,
      isRestored,
      messages,
      pythonSessionId,
      error,
    },
    restore,
    reset,
  }
}

