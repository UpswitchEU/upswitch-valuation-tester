/**
 * StreamEventHandler - Handles all SSE events from the streaming conversation
 *
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all event handling logic in a single, testable class.
 */

import { BUSINESS_TYPES_FALLBACK, BusinessTypeOption } from '../../config/businessTypes'
import { Message } from '../../hooks/useStreamingChatState'
import { chatLogger } from '../../utils/logger'
import { businessTypesApiService } from '../businessTypesApi'
import { registryService } from '../registry/registryService'
import { MessageHandlers, ReportHandlers, UIHandlers, ValuationHandlers } from './handlers'

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
  private messageHandlers: MessageHandlers
  private reportHandlers: ReportHandlers
  private valuationHandlers: ValuationHandlers
  private uiHandlers: UIHandlers

  constructor(
    sessionId: string,
    private callbacks: StreamEventHandlerCallbacks
  ) {
    this.sessionId = sessionId

    // Initialize modular handlers
    this.messageHandlers = new MessageHandlers(callbacks)
    this.reportHandlers = new ReportHandlers(callbacks)
    this.valuationHandlers = new ValuationHandlers(callbacks)
    this.uiHandlers = new UIHandlers(callbacks)
  }

  /**
   * Reset event handler state for a new stream
   * CRITICAL FIX: Resets flags when a new stream starts, not just when message completes
   * This prevents the second message from appearing empty
   */
  reset(): void {
    chatLogger.debug('Resetting StreamEventHandler state for new stream', {
      sessionId: this.sessionId,
    })

    // Reset all modular handlers
    this.messageHandlers.reset()
  }

  /**
   * Main event handler - routes events to appropriate handlers
   *
   * @param data - Event data from SSE stream
   */
  handleEvent(data: any): void {
    // Defensive parsing: extract event type from multiple possible locations
    const eventType = data?.type || data?.event || 'unknown'

    try {
      switch (eventType) {
        // Message-related events
        case 'typing':
          return this.messageHandlers.handleTyping(data)
        case 'message_start':
          return this.messageHandlers.handleMessageStart(data)
        case 'message_chunk':
          // CRITICAL FIX: handleMessageChunk is async - handle promise
          this.messageHandlers.handleMessageChunk(data).catch((err) => {
            chatLogger.error('Error handling message chunk', { error: err })
          })
          return
        case 'message_complete':
          return this.messageHandlers.handleMessageComplete(data)

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
