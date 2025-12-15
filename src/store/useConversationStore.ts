/**
 * Conversation Store - Simple Linear Zustand Store for Messages
 *
 * Single Responsibility: Manage conversation messages state
 * Simple linear flow matching useValuationSessionStore pattern
 *
 * Key principles:
 * - Single source of truth: Zustand store
 * - Linear flow: Direct updates, no complex handlers
 * - Optimistic updates: Create message immediately when message_start arrives
 * - No race conditions: Zustand handles atomic updates
 */

import { create } from 'zustand'
import type { Message } from '../types/message'
import { storeLogger } from '../utils/logger'

// Message window management constants
const MAX_MESSAGES = 100 // Maximum messages to keep in state
const PRUNE_THRESHOLD = 120 // When to trigger pruning
const KEEP_RECENT = 50 // Keep most recent N messages when pruning
const KEEP_FIRST = 10 // Keep first N messages (initial context)

export interface ConversationStore {
  // State
  messages: Message[]
  isStreaming: boolean
  isTyping: boolean
  isThinking: boolean
  typingContext?: string
  currentStreamingMessageId: string | null

  // Simple actions (like report store)
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  appendToMessage: (id: string, content: string) => void
  setStreaming: (streaming: boolean) => void
  setTyping: (typing: boolean) => void
  setThinking: (thinking: boolean) => void
  setTypingContext: (context?: string) => void
  clearMessages: () => void
  setMessages: (messages: Message[]) => void
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Prune messages when conversation gets too long
 */
function pruneMessages(messages: Message[]): Message[] {
  if (messages.length <= MAX_MESSAGES) {
    return messages
  }

  // Keep first messages (initial context) and most recent messages
  const firstMessages = messages.slice(0, KEEP_FIRST)
  const recentMessages = messages.slice(-KEEP_RECENT)

  // Combine, removing duplicates
  const prunedMessages = [
    ...firstMessages,
    ...recentMessages.filter((msg) => !firstMessages.find((fm) => fm.id === msg.id)),
  ]

  storeLogger.warn('Message pruning triggered', {
    originalCount: messages.length,
    prunedCount: prunedMessages.length,
    keptFirst: firstMessages.length,
    keptRecent: recentMessages.length,
    removed: messages.length - prunedMessages.length,
  })

  return prunedMessages
}

export const useConversationStore = create<ConversationStore>((set, get) => {
  return {
    // Initial state
    messages: [],
    isStreaming: false,
    isTyping: false,
    isThinking: false,
    typingContext: undefined,
    currentStreamingMessageId: null,

    /**
     * Add a new message to the conversation
     * Returns the message ID for reference
     */
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
      const id = generateMessageId()
      const newMessage: Message = {
        ...message,
        id,
        timestamp: new Date(),
      }

      set((state) => {
        // CRITICAL: If adding a new streaming message, complete any existing streaming message
        // This prevents multiple streaming messages and ensures smooth conversation flow
        let updatedMessages = [...state.messages]
        if (newMessage.isStreaming && state.currentStreamingMessageId) {
          updatedMessages = updatedMessages.map((msg) =>
            msg.id === state.currentStreamingMessageId
              ? { ...msg, isStreaming: false, isComplete: true }
              : msg
          )
          storeLogger.debug('Completed previous streaming message before adding new one', {
            previousId: state.currentStreamingMessageId,
            newId: id,
          })
        }

        updatedMessages = [...updatedMessages, newMessage]
        const prunedMessages =
          updatedMessages.length >= PRUNE_THRESHOLD
            ? pruneMessages(updatedMessages)
            : updatedMessages

        // Track streaming message ID
        const streamingId = newMessage.isStreaming ? id : state.currentStreamingMessageId

        return {
          messages: prunedMessages,
          currentStreamingMessageId: streamingId,
        }
      })

      storeLogger.debug('Message added', {
        messageId: id,
        type: message.type,
        contentLength: message.content.length,
        isStreaming: message.isStreaming,
      })

      return id
    },

    /**
     * Update an existing message
     */
    updateMessage: (id: string, updates: Partial<Message>) => {
      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg.id === id ? { ...msg, ...updates } : msg
        )

        // Update streaming message ID if message is no longer streaming
        let streamingId = state.currentStreamingMessageId
        if (updates.isStreaming === false && id === state.currentStreamingMessageId) {
          streamingId = null
        } else if (updates.isStreaming === true && id !== state.currentStreamingMessageId) {
          streamingId = id
        }

        return {
          messages: updatedMessages,
          currentStreamingMessageId: streamingId,
        }
      })

      storeLogger.debug('Message updated', {
        messageId: id,
        updates: Object.keys(updates),
      })
    },

    /**
     * Append content to an existing message
     * Optimized: Single pass through messages array
     */
    appendToMessage: (id: string, content: string) => {
      if (!content) {
        // Skip empty content to avoid unnecessary updates
        return
      }

      set((state) => {
        // Fast path: Check if message exists and find index in single pass
        let messageIndex = -1
        for (let i = 0; i < state.messages.length; i++) {
          if (state.messages[i].id === id) {
            messageIndex = i
            break
          }
        }

        if (messageIndex === -1) {
          // CRITICAL: Try fallback search before giving up
          const fallbackMessage = state.messages
            .slice()
            .reverse()
            .find((msg) => msg.isStreaming && !msg.isComplete)
          
          if (fallbackMessage) {
            storeLogger.debug('Found streaming message via fallback in appendToMessage', {
              requestedId: id,
              fallbackId: fallbackMessage.id,
            })
            // Update the fallback message instead
            const fallbackIndex = state.messages.findIndex((m) => m.id === fallbackMessage.id)
            if (fallbackIndex !== -1) {
              const updatedMessages = [...state.messages]
              updatedMessages[fallbackIndex] = {
                ...updatedMessages[fallbackIndex],
                content: updatedMessages[fallbackIndex].content + content,
              }
              return {
                messages: updatedMessages,
                currentStreamingMessageId: fallbackMessage.id, // Update ID if it wasn't set
              }
            }
          }
          
          storeLogger.warn('Cannot append to message - message not found', { 
            messageId: id,
            availableMessageIds: state.messages.map((m) => m.id).slice(-5), // Last 5 IDs for debugging
            currentStreamingId: state.currentStreamingMessageId,
            streamingMessages: state.messages.filter((m) => m.isStreaming).map((m) => ({ id: m.id, isComplete: m.isComplete })),
          })
          return state
        }

        // Update only the specific message (more efficient than map)
        const updatedMessages = [...state.messages]
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: updatedMessages[messageIndex].content + content,
        }

        return {
          messages: updatedMessages,
        }
      })
    },

    /**
     * Set streaming state
     */
    setStreaming: (streaming: boolean) => {
      set({ isStreaming: streaming })
      if (!streaming) {
        // Clear streaming message ID when streaming stops
        set({ currentStreamingMessageId: null })
      }
    },

    /**
     * Set typing state
     */
    setTyping: (typing: boolean) => {
      set({ isTyping: typing })
    },

    /**
     * Set thinking state
     */
    setThinking: (thinking: boolean) => {
      set({ isThinking: thinking })
    },

    /**
     * Set typing context
     */
    setTypingContext: (context?: string) => {
      set({ typingContext: context })
    },

    /**
     * Clear all messages
     */
    clearMessages: () => {
      set({
        messages: [],
        currentStreamingMessageId: null,
        isStreaming: false,
        isTyping: false,
        isThinking: false,
      })
      storeLogger.debug('Messages cleared')
    },

    /**
     * Set messages directly (for restoration/initialization)
     */
    setMessages: (messages: Message[]) => {
      const prunedMessages = messages.length >= PRUNE_THRESHOLD ? pruneMessages(messages) : messages
      const streamingMessage = prunedMessages.find((msg) => msg.isStreaming)
      set({
        messages: prunedMessages,
        currentStreamingMessageId: streamingMessage?.id || null,
      })
      storeLogger.debug('Messages set', { count: prunedMessages.length })
    },
  }
})

