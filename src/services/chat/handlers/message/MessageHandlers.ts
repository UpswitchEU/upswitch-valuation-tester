/**
 * Message Handlers - Focused event handlers for message-related streaming events
 *
 * Single Responsibility: Handle typing, message start, chunk, and completion events
 * Extracted from StreamEventHandler to follow SRP
 *
 * @module services/chat/handlers/message/MessageHandlers
 */

import { chatLogger } from '../../../../utils/logger'
import { StreamEventHandlerCallbacks } from '../../StreamEventHandler'

export class MessageHandlers {
  private callbacks: StreamEventHandlerCallbacks
  private hasStartedMessage: boolean = false
  private messageCreationLock: boolean = false
  private chunkBuffer: string[] = []
  private lastProcessedChunks: string[] = []
  private lastCompleteMessageSignature: string | null = null

  constructor(callbacks: StreamEventHandlerCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Reset handler state (called when new stream starts)
   */
  reset(): void {
    this.hasStartedMessage = false
    this.messageCreationLock = false
    this.chunkBuffer = []
    this.lastProcessedChunks = []
    this.lastCompleteMessageSignature = null
  }

  /**
   * Handle typing indicator events
   */
  handleTyping(_data: any): void {
    // CRITICAL DEBUG: Log typing events to verify they're being received
    chatLogger.info('⌨️ AI typing indicator received', {
      sessionId: _data?.session_id,
      timestamp: _data?.timestamp,
    })
    
    // Show typing indicator and thinking state
    this.callbacks.setIsTyping?.(true)
    this.callbacks.setIsThinking?.(true)

    // CRITICAL FIX: Thread-safe message creation
    // Prevents race conditions when multiple events arrive simultaneously
    this.ensureMessageExists().catch((err) => {
      chatLogger.error('Failed to ensure message exists', { error: err })
    })
  }

  /**
   * Handle message start events
   */
  handleMessageStart(_data: any): void {
    // DEBUG: Log message start events to track confirmation messages
    console.log('🎯 MESSAGE_START received:', {
      type: _data.type,
      field: _data.field,
      content: _data.content,
      session_id: _data.session_id,
      _is_confirmation: _data._is_confirmation,
    })

    // CRITICAL FIX: message_start always indicates a NEW message is starting
    // Must reset state and create new message, even if previous message is still active
    // This prevents confirmation messages from appending to previous messages

    // If a previous message is still active, complete it first
    if (this.hasStartedMessage) {
      chatLogger.debug(
        'message_start received while previous message active - completing previous message',
        {
          bufferedChunks: this.chunkBuffer.length,
        }
      )
      // Complete the previous message if it exists
      this.callbacks.updateStreamingMessage('', true)
      this.callbacks.setIsStreaming(false)
    }

    // CRITICAL FIX: Reset state COMPLETELY
    this.messageCreationLock = false
    this.chunkBuffer = []
    this.lastProcessedChunks = [] // CRITICAL FIX: Clear processed chunks on new message start
    this.lastCompleteMessageSignature = null // Reset duplicate guard for new message

    // Hide thinking state and typing indicator when message starts streaming
    this.callbacks.setIsThinking?.(false)
    this.callbacks.setIsTyping?.(false)
    this.callbacks.setTypingContext?.(undefined)
    // FIX: Explicitly set isStreaming to true when message starts
    // This ensures input field is properly disabled during streaming
    // and re-enabled after message_complete
    this.callbacks.setIsStreaming(true)

    // CRITICAL FIX: Create message immediately on message_start
    // This ensures the message exists before chunks arrive, preventing "No streaming message found" errors
    // We still use ensureMessageExists to handle the creation safely (with locking)
    this.ensureMessageExists().catch((err) => {
      chatLogger.error('Failed to ensure message exists on message_start', { error: err })
    })
  }

  /**
   * Handle message chunk events
   * CRITICAL FIX: Buffer chunks until message exists to prevent first chunk loss
   */
  async handleMessageChunk(data: any): Promise<void> {
    // Sanitize content to ensure it's a string
    const content = data.content != null ? String(data.content) : ''

    if (!content) {
      chatLogger.warn('⚠️ Empty message chunk received - skipping update')
      return
    }

    // Check for duplicate chunks
    const wasBuffered = this.chunkBuffer.includes(content)
    const wasRecentlyProcessed = this.lastProcessedChunks.slice(-3).includes(content) // Check last 3 processed chunks

    // CRITICAL FIX: If chunk was recently processed (within last 3 chunks), skip to prevent rapid duplicates
    // This handles cases where the same chunk arrives twice in quick succession
    if (wasRecentlyProcessed && !wasBuffered) {
      return
    }

    // CRITICAL FIX: Ensure message exists BEFORE processing chunk
    // This prevents first chunk loss when chunks arrive before message_start
    await this.ensureMessageExists()

    // CRITICAL FIX: Wait a tick to ensure React state has updated
    // This prevents "No streaming message found" errors when updateStreamingMessage
    // is called immediately after addMessage (React state updates are async)
    if (!this.hasStartedMessage) {
      // Wait for next tick to allow React state to update
      await new Promise((resolve) => setTimeout(resolve, 0))
      // Re-check after waiting
      if (!this.hasStartedMessage) {
        chatLogger.warn('⚠️ Message not created yet after ensureMessageExists - buffering chunk', {
          chunkContent: content.substring(0, 30),
        })
        // CRITICAL FIX: Only buffer if not already buffered to prevent duplicates
        if (!wasBuffered) {
          this.chunkBuffer.push(content)
        }
        return
      }
    }

    // Clear typing indicators since we're now streaming
    if (this.hasStartedMessage) {
      this.callbacks.setIsThinking?.(false)
      this.callbacks.setIsTyping?.(false)
    }

    // CRITICAL FIX: If chunk is currently buffered, it will be flushed by ensureMessageExists
    // Don't process it again to prevent duplication
    if (wasBuffered) {
      return
    }

    // Mark chunk as processed before updating message
    this.lastProcessedChunks.push(content)

    // Check for duplicate message signatures (same content + metadata)
    const messageSignature = content + JSON.stringify(data.metadata || {})
    if (this.lastCompleteMessageSignature === messageSignature) {
      chatLogger.warn('⚠️ Duplicate message signature detected - skipping chunk', {
        signature: messageSignature.substring(0, 50),
      })
      return
    }

    // Update the streaming message with the chunk
    this.callbacks.updateStreamingMessage(content, false, data.metadata)

    chatLogger.debug('Message chunk processed', {
      chunkLength: content.length,
      totalChunks: this.lastProcessedChunks.length,
      hasStarted: this.hasStartedMessage,
    })
  }

  /**
   * Handle message complete events
   */
  handleMessageComplete(data: any): void {
    // CRITICAL FIX: Extract metadata from multiple possible locations
    const metadata = data.metadata || data.data || {}
    const field = metadata.field || metadata.collected_field || metadata.clarification_field
    const value = metadata.value !== undefined ? metadata.value : metadata.collected_value
    const source = metadata.source || 'backend'

    chatLogger.info('Message completed', {
      field,
      hasValue: value !== undefined,
      source,
      contentLength: data.content?.length || 0,
      metadataKeys: Object.keys(metadata),
    })

    // CRITICAL FIX: Complete the streaming message
    this.callbacks.updateStreamingMessage(data.content || '', true, metadata)

    // Hide streaming indicators
    this.callbacks.setIsStreaming(false)
    this.callbacks.setIsTyping?.(false)
    this.callbacks.setIsThinking?.(false)

    // CRITICAL FIX: Store message signature to prevent duplicates
    const messageSignature = (data.content || '') + JSON.stringify(metadata)
    this.lastCompleteMessageSignature = messageSignature

    // Track model performance if metrics are available
    if (data.metrics) {
      this.callbacks.trackModelPerformance?.(data.metrics)
    }

    // Track conversation completion
    this.callbacks.trackConversationCompletion?.(true, false)
  }

  /**
   * Ensure a message exists for streaming
   * CRITICAL FIX: Thread-safe message creation with locking
   */
  private async ensureMessageExists(): Promise<void> {
    // CRITICAL FIX: Prevent concurrent message creation
    if (this.messageCreationLock) {
      chatLogger.debug('Message creation already in progress, skipping')
      return
    }

    // If message already exists, flush any buffered chunks
    if (this.hasStartedMessage) {
      if (this.chunkBuffer.length > 0) {
        chatLogger.debug('Flushing buffered chunks', { count: this.chunkBuffer.length })
        const combinedContent = this.chunkBuffer.join('')
        this.chunkBuffer = []
        this.callbacks.updateStreamingMessage(combinedContent, false)
      }
      return
    }

    // CRITICAL FIX: Acquire lock before creating message
    this.messageCreationLock = true

    try {
      chatLogger.debug('Creating new streaming message')

      // Create a new AI message for streaming
      this.callbacks.addMessage({
        type: 'ai',
        content: '',
        isStreaming: true,
        isComplete: false,
      })

      // CRITICAL FIX: Mark message as started and flush any buffered chunks
      this.hasStartedMessage = true

      if (this.chunkBuffer.length > 0) {
        chatLogger.debug('Flushing buffered chunks on message creation', {
          count: this.chunkBuffer.length,
        })
        const combinedContent = this.chunkBuffer.join('')
        this.chunkBuffer = []
        this.callbacks.updateStreamingMessage(combinedContent, false)
      }

      chatLogger.debug('Streaming message created successfully')
    } catch (error) {
      chatLogger.error('Failed to create streaming message', { error })
      // CRITICAL FIX: Reset lock on error
      this.messageCreationLock = false
      throw error
    } finally {
      // Always release lock, even on error
      this.messageCreationLock = false
    }
  }
}
