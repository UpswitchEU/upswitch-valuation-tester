/**
 * MessageManager - Handles message CRUD operations for StreamingChat component
 *
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all message-related operations in a single, testable class.
 */

import { Message } from '../../hooks/useStreamingChatState'
import { chatLogger } from '../logger'

/**
 * Centralized message manager for streaming chat
 *
 * Handles all message operations including:
 * - Adding new messages
 * - Updating streaming messages
 * - Auto-scrolling
 * - Message ID generation
 */
export class MessageManager {
  /**
   * Add a new message to the messages array
   *
   * @param messages - Current messages array
   * @param newMessage - Message to add (without id and timestamp)
   * @returns Object containing updated messages array and the new message
   */
  addMessage(
    messages: Message[],
    newMessage: Omit<Message, 'id' | 'timestamp'>
  ): { updatedMessages: Message[]; newMessage: Message } {
    const message: Message = {
      ...newMessage,
      id: this.generateMessageId(),
      timestamp: new Date(),
    }

    chatLogger.debug('Adding new message', {
      messageId: message.id,
      type: message.type,
      contentLength: message.content.length,
    })

    const updatedMessages = [...messages, message]
    return { updatedMessages, newMessage: message }
  }

  /**
   * Update a streaming message with new content
   *
   * @param messages - Current messages array
   * @param messageId - ID of message to update
   * @param content - New content to append
   * @param isComplete - Whether the message is complete
   * @param metadata - Optional metadata to attach to message
   * @returns Updated messages array
   */
  updateStreamingMessage(
    messages: Message[],
    messageId: string,
    content: string,
    isComplete: boolean,
    metadata?: any
  ): Message[] {
    chatLogger.debug('Updating streaming message', {
      messageId,
      contentLength: content.length,
      isComplete,
      hasMetadata: !!metadata,
      metadataKeys: metadata ? Object.keys(metadata) : [],
    })

    return messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            content: msg.content + content,
            isComplete,
            isStreaming: !isComplete,
            // CRITICAL FIX: Merge metadata when provided
            ...(metadata ? { metadata: { ...msg.metadata, ...metadata } } : {}),
          }
        : msg
    )
  }

  /**
   * Scroll to bottom of messages container
   *
   * @param messagesEndRef - Ref to the messages end element
   */
  scrollToBottom(messagesEndRef: React.RefObject<HTMLDivElement>): void {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      chatLogger.debug('Scrolled to bottom of messages')
    } else {
      chatLogger.warn('Messages end ref not available for scrolling')
    }
  }

  /**
   * Generate a unique message ID
   *
   * @returns Unique message identifier
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Find a message by ID
   *
   * @param messages - Messages array to search
   * @param messageId - ID to search for
   * @returns Found message or undefined
   */
  findMessageById(messages: Message[], messageId: string): Message | undefined {
    return messages.find((msg) => msg.id === messageId)
  }

  /**
   * Get the last message from the array
   *
   * @param messages - Messages array
   * @returns Last message or undefined
   */
  getLastMessage(messages: Message[]): Message | undefined {
    return messages.length > 0 ? messages[messages.length - 1] : undefined
  }

  /**
   * Get messages by type
   *
   * @param messages - Messages array
   * @param type - Message type to filter by
   * @returns Filtered messages array
   */
  getMessagesByType(messages: Message[], type: Message['type']): Message[] {
    return messages.filter((msg) => msg.type === type)
  }

  /**
   * Get user messages count
   *
   * @param messages - Messages array
   * @returns Number of user messages
   */
  getUserMessageCount(messages: Message[]): number {
    return this.getMessagesByType(messages, 'user').length
  }

  /**
   * Get AI messages count
   *
   * @param messages - Messages array
   * @returns Number of AI messages
   */
  getAIMessageCount(messages: Message[]): number {
    return this.getMessagesByType(messages, 'ai').length
  }

  /**
   * Check if there are any streaming messages
   *
   * @param messages - Messages array
   * @returns True if any message is streaming
   */
  hasStreamingMessages(messages: Message[]): boolean {
    return messages.some((msg) => msg.isStreaming)
  }

  /**
   * Get all incomplete messages
   *
   * @param messages - Messages array
   * @returns Array of incomplete messages
   */
  getIncompleteMessages(messages: Message[]): Message[] {
    return messages.filter((msg) => !msg.isComplete)
  }

  /**
   * Clear all messages
   *
   * @returns Empty messages array
   */
  clearAllMessages(): Message[] {
    chatLogger.debug('Clearing all messages')
    return []
  }

  /**
   * Remove a message by ID
   *
   * @param messages - Current messages array
   * @param messageId - ID of message to remove
   * @returns Updated messages array without the specified message
   */
  removeMessage(messages: Message[], messageId: string): Message[] {
    const filteredMessages = messages.filter((msg) => msg.id !== messageId)

    chatLogger.debug('Removed message', {
      messageId,
      remainingCount: filteredMessages.length,
    })

    return filteredMessages
  }
}
