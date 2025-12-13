/**
 * useConversationRestoration Hook
 *
 * Single Responsibility: Handle conversation restoration from Python backend
 * SOLID Principles: SRP - Only handles restoration logic
 *
 * @module features/conversational/hooks/useConversationRestoration
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { UtilityAPI } from '../../../services/api/utility/UtilityAPI'
import type { Message } from '../../../types/message'
import { chatLogger } from '../../../utils/logger'

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
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Restore conversation from Python backend
   */
  const restore = useCallback(async () => {
    if (!sessionId || !enabled || hasRestoredRef.current) {
      return
    }

    // Abort any pending restoration
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsRestoring(true)
    setError(null)

    try {
      chatLogger.info('🔄 Restoring conversation from Python backend', { sessionId })

      const status = await utilityAPI.getConversationStatus(sessionId, {
        signal: abortControllerRef.current.signal,
      })

      if (status.exists && status.messages) {
        // Convert backend messages to frontend Message format
        const restoredMessages: Message[] = status.messages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          type: msg.type || (msg.role === 'assistant' ? 'ai' : 'user'),
          role: msg.role || (msg.type === 'ai' ? 'assistant' : 'user'),
          content: msg.content || msg.text || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          isStreaming: false,
          isComplete: true,
          metadata: msg.metadata || {},
        }))

        // Extract Python session ID from metadata if available
        const extractedPythonSessionId: string | null =
          (status.metadata?.python_session_id as string | null) ||
          (status.metadata?.session_id as string | null) ||
          null

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
    } catch (err: any) {
      // Handle abort gracefully
      if (err.name === 'AbortError') {
        chatLogger.debug('Conversation restoration was cancelled', { sessionId })
        return
      }

      const errorMessage = err.message || 'Failed to restore conversation'
      chatLogger.error('❌ Failed to restore conversation', {
        sessionId,
        error: errorMessage,
      })

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
