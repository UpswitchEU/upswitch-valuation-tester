/**
 * StreamEventHandler - Handles all SSE events from the streaming conversation
 *
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all event handling logic in a single, testable class.
 */

import { BUSINESS_TYPES_FALLBACK, BusinessTypeOption } from '../../config/businessTypes'
import type { Message } from '../../types/message'
import { chatLogger } from '../../utils/logger'
import { useConversationStore } from '../../store/useConversationStore'
import type { StreamEvent } from './streamingChatService'
import { businessTypesApiService } from '../businessTypesApi'
import { registryService } from '../registry/registryService'
import { ReportHandlers, UIHandlers, ValuationHandlers } from './handlers'

const normalizeText = (value: string) => value.trim().toLowerCase()

const simpleSimilarity = (a: string, b: string): number => {
  // Lightweight similarity: longest common substring ratio
  const s1 = normalizeText(a)
  const s2 = normalizeText(b)
  if (!s1 || !s2) return 0
  let longest = 0
  for (let i = 0; i < s1.length; i++) {
    for (let j = i + 1; j <= s1.length; j++) {
      const substr = s1.slice(i, j)
      if (s2.includes(substr) && substr.length > longest) {
        longest = substr.length
      }
    }
  }
  return longest / Math.max(s1.length, s2.length)
}

const _getFallbackBusinessTypeSuggestions = (query: string, limit = 5) => {
  const normalized = normalizeText(query)
  const scored = BUSINESS_TYPES_FALLBACK.map((bt: BusinessTypeOption) => ({
    text: bt.label?.replace(/^[^\s]+\s/, '') || bt.label || bt.value,
    confidence: simpleSimilarity(normalized, bt.label || bt.value),
    reason: bt.category || 'Similar business type',
  }))
    .filter((s) => s.confidence > 0.2) // discard very weak matches
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))

  // If still nothing, offer a single cleaned-up guess
  if (scored.length === 0) {
    return [
      {
        text: query,
        confidence: 0.3,
        reason: 'Closest guess',
      },
    ]
  }

  return scored.slice(0, limit)
}

// Re-export types for convenience
export interface ModelPerformanceMetrics {
  model_name: string
  model_version: string
  time_to_first_token_ms: number
  total_response_time_ms: number
  tokens_per_second: number
  response_coherence_score?: number
  response_relevance_score?: number
  hallucination_detected: boolean
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  error_occurred: boolean
  error_type?: string
  retry_count: number
}

export interface StreamEventHandlerCallbacks {
  updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: any) => void
  setIsStreaming: (streaming: boolean) => void
  setIsTyping?: (typing: boolean) => void
  setIsThinking?: (thinking: boolean) => void
  setTypingContext?: (context?: string) => void
  setCollectedData: React.Dispatch<React.SetStateAction<Record<string, any>>>
  setValuationPreview: React.Dispatch<React.SetStateAction<any>>
  setCalculateOption: React.Dispatch<React.SetStateAction<any>>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    updatedMessages: Message[]
    newMessage: Message
  }
  trackModelPerformance: (metrics: ModelPerformanceMetrics) => void
  trackConversationCompletion: (success: boolean, hasValuation: boolean) => void
  onValuationComplete?: (result: any) => void
  onReportUpdate?: (html: string, progress: number) => void
  onSectionLoading?: (section: string, html: string, phase: number, data?: any) => void
  onSectionComplete?: (event: {
    sectionId: string
    sectionName: string
    html: string
    progress: number
    phase?: number
  }) => void
  onReportSectionUpdate?: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void
  onReportComplete?: (html: string, valuationId: string) => void
  onDataCollected?: (data: any) => void
  onValuationPreview?: (data: any) => void
  onCalculateOptionAvailable?: (data: any) => void
  onProgressUpdate?: (data: any) => void
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void
  onStreamStart?: () => void // CRITICAL FIX: Callback to reset event handler state when new stream starts
}

/**
 * Centralized event handler for streaming conversation events
 *
 * Handles all SSE events from the backend, including:
 * - Message streaming (typing, chunks, completion)
 * - Report updates (sections, progress, completion)
 * - Data collection events
 * - Valuation results
 * - Error handling
 * - Metrics tracking
 */
export class StreamEventHandler {
  private sessionId: string

  // Modular handler instances - each handles a specific domain
  // MessageHandlers removed - using Zustand store directly
  private reportHandlers: ReportHandlers
  private valuationHandlers: ValuationHandlers
  private uiHandlers: UIHandlers

  constructor(
    sessionId: string,
    private callbacks: StreamEventHandlerCallbacks
  ) {
    this.sessionId = sessionId

    // Initialize modular handlers (message handling now uses store directly)
    this.reportHandlers = new ReportHandlers(callbacks)
    this.valuationHandlers = new ValuationHandlers(callbacks)
    this.uiHandlers = new UIHandlers(callbacks)
  }

  /**
   * Reset event handler state for a new stream
   * Simplified - no complex message handler state to reset
   */
  reset(): void {
    chatLogger.debug('Resetting StreamEventHandler state for new stream', {
      sessionId: this.sessionId,
    })
    // Store handles state, no reset needed
  }

  /**
   * Main event handler - routes events to appropriate handlers
   *
   * @param data - Event data from SSE stream
   */
  handleEvent(data: StreamEvent): void {
    // Defensive parsing: extract event type from multiple possible locations
    const eventType = data?.type || data?.event || 'unknown'

    try {
      switch (eventType) {
        // Message-related events - direct store updates (simple linear flow)
        case 'typing': {
          const store = useConversationStore.getState()
          store.setTyping(true)
          store.setThinking(true)
          // Callbacks for non-message state (collectedData, etc.)
          this.callbacks.setIsTyping?.(true)
          this.callbacks.setIsThinking?.(true)
          return
        }
        case 'message_start': {
          // Simple: Create message immediately in store (optimistic update)
          const store = useConversationStore.getState()
          const messageId = store.addMessage({
            type: 'ai',
            content: data.content || '',
            isStreaming: true,
            isComplete: false,
            metadata: data.metadata || data.data || {},
          })
          store.setStreaming(true)
          store.setTyping(false)
          store.setThinking(false)
          // Callbacks for non-message state only
          this.callbacks.setIsStreaming(true)
          this.callbacks.setIsTyping?.(false)
          this.callbacks.setIsThinking?.(false)
          chatLogger.debug('Message started', { messageId, sessionId: this.sessionId })
          return
        }
        case 'message_chunk': {
          // Simple: Append content to streaming message (store only, no callback)
          const store = useConversationStore.getState()
          const streamingId = store.currentStreamingMessageId
          if (streamingId && data.content) {
            store.appendToMessage(streamingId, data.content)
          } else if (!streamingId && data.content) {
            // Edge case: Chunk arrived before message_start - create message optimistically
            chatLogger.warn('Message chunk received before message_start - creating message optimistically', {
              sessionId: this.sessionId,
              hasContent: !!data.content,
            })
            const messageId = store.addMessage({
              type: 'ai',
              content: data.content,
              isStreaming: true,
              isComplete: false,
              metadata: data.metadata || {},
            })
            store.setStreaming(true)
          } else {
            chatLogger.warn('Message chunk received but no streaming message found and no content', {
              sessionId: this.sessionId,
              hasContent: !!data.content,
            })
          }
          return
        }
        case 'message_complete': {
          // CRITICAL FIX: Don't replace content - it's already accumulated from chunks
          // Backend sends empty content in message_complete (content sent via chunks)
          const store = useConversationStore.getState()
          const streamingId = store.currentStreamingMessageId
          if (streamingId) {
            // Only update completion status and metadata, preserve accumulated content
            const currentMessage = store.messages.find((m) => m.id === streamingId)
            const completedMessage = {
              ...currentMessage!,
              content: currentMessage?.content || data.content || '',
              isComplete: true,
              isStreaming: false,
              metadata: { ...currentMessage?.metadata, ...(data.metadata || data.data || {}) },
            }
            
            store.updateMessage(streamingId, completedMessage)
            store.setStreaming(false)
            
            // Track completion if callback provided
            if (this.callbacks.trackConversationCompletion) {
              this.callbacks.trackConversationCompletion(true, false)
            }
            
            // Note: onMessageComplete callback is handled by StreamingChat component
            // via useMessageManagement hook (if still used) or directly in component
          } else {
            chatLogger.warn('Message complete received but no streaming message found', {
              sessionId: this.sessionId,
            })
          }
          return
        }

        // Report-related events
        case 'report_update':
          return this.reportHandlers.handleReportUpdate(data)
        case 'section_loading':
          return this.reportHandlers.handleSectionLoading(data)
        case 'section_complete':
          return this.reportHandlers.handleSectionComplete(data)
        case 'report_section':
          return this.reportHandlers.handleReportSection(data)
        case 'report_complete':
          return this.reportHandlers.handleReportComplete(data)

        // Valuation-related events
        case 'valuation_preview':
          return this.valuationHandlers.handleValuationPreview(data)
        case 'calculate_option':
          return this.valuationHandlers.handleCalculateOption(data)
        case 'valuation_ready':
          return this.valuationHandlers.handleValuationReady(data)
        case 'valuation_confirmed':
          return this.valuationHandlers.handleValuationConfirmed(data)
        case 'valuation_complete':
          return this.valuationHandlers.handleValuationComplete(data)

        // UI and data events
        case 'progress_summary':
          return this.uiHandlers.handleProgressSummary(data)
        case 'progress_update':
          return this.uiHandlers.handleProgressUpdate(data)
        case 'data_collected':
          return this.uiHandlers.handleDataCollected(data)
        case 'suggestion_offered':
          return this.uiHandlers.handleSuggestionOffered(data)
        case 'clarification_needed':
          return this.uiHandlers.handleClarificationNeeded(data)
        case 'html_preview':
          return this.uiHandlers.handleHtmlPreview(data)
        case 'error':
          return this.uiHandlers.handleError(data)

        case 'unknown':
          // Treat unknown events as errors with a readable fallback
          return this.uiHandlers.handleError({
            ...data,
            message: data.message || data.content || 'An unexpected event occurred',
            content: data.content || 'Unknown event type',
          })
        default:
          // Fallback for truly unrecognized event types
          chatLogger.warn('Unrecognized event type, treating as error', { type: eventType })
          return this.uiHandlers.handleError({
            ...data,
            message: `Unrecognized event: ${eventType}`,
            content: data.content || 'An unexpected error occurred',
          })
      }
    } catch (error) {
      chatLogger.error('Error in handleEvent', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // Fallback to error handling
      this.uiHandlers.handleError({
        ...data,
        message: `Event processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error_type: 'handler_error',
      })
    }
  }
}
