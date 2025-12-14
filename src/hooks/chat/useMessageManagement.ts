/**
 * useMessageManagement - Extracted message management logic from StreamingChat
 *
 * Handles message operations, deduplication, and streaming updates.
 * Follows Single Responsibility Principle by focusing only on message management.
 */

import { useCallback, useMemo } from 'react'
import { MessageManager } from '../../utils/chat/MessageManager'
import { Message } from '../useStreamingChatState'

export interface UseMessageManagementOptions {
  sessionId: string
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  onMessageComplete?: (message: Message) => void
}

export interface UseMessageManagementReturn {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    updatedMessages: Message[]
    newMessage: Message
  }
  updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: unknown) => void
  dedupeValuationCTA: (
    messages: Message[],
    incoming: Omit<Message, 'id' | 'timestamp'>
  ) => Message[]
  isValuationReadyCTA: (msg: { metadata?: unknown }) => boolean
}

/**
 * Custom hook for message management operations
 *
 * Extracts complex message handling logic from StreamingChat component
 * to improve maintainability and testability.
 */
export function useMessageManagement({
  sessionId,
  messages,
  setMessages,
  onMessageComplete,
}: UseMessageManagementOptions): UseMessageManagementReturn {
  // Initialize message manager
  const messageManager = useMemo(() => new MessageManager(), [])

  // Check if message is a valuation ready CTA
  const isValuationReadyCTA = useCallback((msg: { metadata?: unknown }) => {
    const meta = msg?.metadata as Record<string, unknown> | undefined
    if (!meta) return false
    const field = meta.collected_field || meta.clarification_field || meta.field
    return meta.input_type === 'cta_button' && field === 'valuation_confirmed'
  }, [])

  // Deduplicate valuation CTAs to prevent stacking
  const dedupeValuationCTA = useCallback(
    (messages: Message[], incoming: Omit<Message, 'id' | 'timestamp'>) => {
      if (!isValuationReadyCTA(incoming)) return messages

      const filtered = messages.filter((msg) => !isValuationReadyCTA(msg))
      return filtered
    },
    [isValuationReadyCTA]
  )

  // Add a new message to the conversation
  const addMessage = useCallback(
    (message: Omit<Message, 'id' | 'timestamp'>) => {
      // Deduplicate valuation CTAs
      const baseMessages = dedupeValuationCTA(messages, message)
      const result = messageManager.addMessage(baseMessages, message)
      setMessages(result.updatedMessages)
      return result
    },
    [messages, setMessages, dedupeValuationCTA, messageManager]
  )

  // Update streaming message content
  const updateStreamingMessage = useCallback(
    (content: string, isComplete?: boolean, metadata?: unknown) => {
      // Find the streaming message ID
      const streamingMessage = messages.find((msg) => msg.isStreaming && !msg.isComplete)
      const messageId = streamingMessage?.id || ''

      const updatedMessages = messageManager.updateStreamingMessage(
        messages,
        messageId,
        content,
        isComplete ?? false,
        metadata
      )

      setMessages(updatedMessages)

      // Notify completion if message is done
      if (isComplete) {
        const completedMessage = updatedMessages.find(
          (msg) => msg.type === 'ai' && msg.isComplete && !msg.isStreaming
        )
        if (completedMessage && onMessageComplete) {
          onMessageComplete(completedMessage)
        }
      }
    },
    [messages, setMessages, messageManager, onMessageComplete]
  )

  return {
    addMessage,
    updateStreamingMessage,
    dedupeValuationCTA,
    isValuationReadyCTA,
  }
}
