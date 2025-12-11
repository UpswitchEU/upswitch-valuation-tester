/**
 * StreamEventHandler - Handles all SSE events from the streaming conversation
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all event handling logic in a single, testable class.
 */

import { BUSINESS_TYPES_FALLBACK, BusinessTypeOption } from '../../config/businessTypes';
import { Message } from '../../hooks/useStreamingChatState';
import { chatLogger } from '../../utils/logger';
import { businessTypesApiService } from '../businessTypesApi';
import { registryService } from '../registry/registryService';

const normalizeText = (value: string) => value.trim().toLowerCase();

const simpleSimilarity = (a: string, b: string): number => {
  // Lightweight similarity: longest common substring ratio
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (!s1 || !s2) return 0;
  let longest = 0;
  for (let i = 0; i < s1.length; i++) {
    for (let j = i + 1; j <= s1.length; j++) {
      const substr = s1.slice(i, j);
      if (s2.includes(substr) && substr.length > longest) {
        longest = substr.length;
      }
    }
  }
  return longest / Math.max(s1.length, s2.length);
};

const getFallbackBusinessTypeSuggestions = (query: string, limit = 5) => {
  const normalized = normalizeText(query);
  const scored = BUSINESS_TYPES_FALLBACK.map((bt: BusinessTypeOption) => ({
    text: bt.label?.replace(/^[^\s]+\s/, '') || bt.label || bt.value,
    confidence: simpleSimilarity(normalized, bt.label || bt.value),
    reason: bt.category || 'Similar business type'
  }))
    .filter(s => s.confidence > 0.2) // discard very weak matches
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // If still nothing, offer a single cleaned-up guess
  if (scored.length === 0) {
    return [{
      text: query,
      confidence: 0.3,
      reason: 'Closest guess'
    }];
  }

  return scored.slice(0, limit);
};

// Re-export types for convenience
export interface ModelPerformanceMetrics {
  model_name: string;
  model_version: string;
  time_to_first_token_ms: number;
  total_response_time_ms: number;
  tokens_per_second: number;
  response_coherence_score?: number;
  response_relevance_score?: number;
  hallucination_detected: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  error_occurred: boolean;
  error_type?: string;
  retry_count: number;
}

export interface StreamEventHandlerCallbacks {
  updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: any) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsTyping?: (typing: boolean) => void;
  setIsThinking?: (thinking: boolean) => void;
  setTypingContext?: (context?: string) => void;
  setCollectedData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setValuationPreview: React.Dispatch<React.SetStateAction<any>>;
  setCalculateOption: React.Dispatch<React.SetStateAction<any>>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => { updatedMessages: Message[], newMessage: Message };
  trackModelPerformance: (metrics: ModelPerformanceMetrics) => void;
  trackConversationCompletion: (success: boolean, hasValuation: boolean) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (html: string, progress: number) => void;
  onSectionLoading?: (section: string, html: string, phase: number, data?: any) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportSectionUpdate?: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onDataCollected?: (data: any) => void;
  onValuationPreview?: (data: any) => void;
  onCalculateOptionAvailable?: (data: any) => void;
  onProgressUpdate?: (data: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  onStreamStart?: () => void; // CRITICAL FIX: Callback to reset event handler state when new stream starts
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
  private sessionId: string;
  private hasStartedMessage: boolean = false;
  private messageCreationLock: boolean = false; // CRITICAL FIX: Prevent race conditions
  private chunkBuffer: string[] = []; // CRITICAL FIX: Buffer chunks until message exists
  private lastProcessedChunks: string[] = []; // CRITICAL FIX: Track last few processed chunks to detect rapid duplicates
  // Track last completed AI message to avoid duplicate renders (same content/field)
  private lastCompleteMessageSignature: string | null = null;
  private lastCompleteMessageTimestamp: number = 0;

  constructor(
    sessionId: string,
    private callbacks: StreamEventHandlerCallbacks
  ) {
    this.sessionId = sessionId;
  }
  
  /**
   * Reset event handler state for a new stream
   * CRITICAL FIX: Resets flags when a new stream starts, not just when message completes
   * This prevents the second message from appearing empty
   */
  reset(): void {
    chatLogger.debug('Resetting StreamEventHandler state for new stream', {
      sessionId: this.sessionId,
      hadStartedMessage: this.hasStartedMessage,
      hadLock: this.messageCreationLock,
      bufferedChunks: this.chunkBuffer.length,
      processedChunks: this.lastProcessedChunks.length
    });
    this.hasStartedMessage = false;
    this.messageCreationLock = false;
    this.chunkBuffer = []; // CRITICAL FIX: Clear chunk buffer on reset
    this.lastProcessedChunks = []; // CRITICAL FIX: Clear processed chunks tracking on reset
  }
  
  /**
   * Thread-safe message creation helper
   * CRITICAL FIX: Prevents duplicate messages from concurrent event handlers
   * Also flushes buffered chunks once message is created
   */
  private async ensureMessageExists(): Promise<void> {
    if (this.hasStartedMessage || this.messageCreationLock) {
      // Message exists or being created - flush any buffered chunks if message exists
      if (this.hasStartedMessage && this.chunkBuffer.length > 0) {
        const bufferedContent = this.chunkBuffer.join('');
        // Mark all buffered chunks as processed before flushing
        this.lastProcessedChunks.push(...this.chunkBuffer);
        // Keep only last 10 chunks to prevent memory growth
        if (this.lastProcessedChunks.length > 10) {
          this.lastProcessedChunks = this.lastProcessedChunks.slice(-10);
        }
        this.chunkBuffer = [];
        this.callbacks.updateStreamingMessage(bufferedContent);
      }
      return; // Message already exists or creation in progress
    }
    
    // Acquire lock
    this.messageCreationLock = true;
    
    try {
      // Double-check after acquiring lock (race condition prevention)
      if (!this.hasStartedMessage) {
        chatLogger.debug('Creating placeholder message (thread-safe)', {
          bufferedChunks: this.chunkBuffer.length
        });
        this.callbacks.addMessage({
          type: 'ai',  // FIX: Use correct type from Message type definition
          content: '',
          isStreaming: true,
          isComplete: false
        });
        this.hasStartedMessage = true;
        
        // CRITICAL FIX: Flush any buffered chunks now that message exists
        if (this.chunkBuffer.length > 0) {
          const bufferedContent = this.chunkBuffer.join('');
          // Mark all buffered chunks as processed before flushing
          this.lastProcessedChunks.push(...this.chunkBuffer);
          // Keep only last 10 chunks to prevent memory growth
          if (this.lastProcessedChunks.length > 10) {
            this.lastProcessedChunks = this.lastProcessedChunks.slice(-10);
          }
          this.chunkBuffer = [];
          this.callbacks.updateStreamingMessage(bufferedContent);
        }
      }
    } finally {
      // Always release lock, even on error
      this.messageCreationLock = false;
    }
  }

  /**
   * Main event handler - routes events to appropriate handlers
   * 
   * @param data - Event data from SSE stream
   */
  handleEvent(data: any): void {
    // Defensive parsing: extract event type from multiple possible locations
    const eventType = data?.type || data?.event || 'unknown';
    
    switch (eventType) {
      case 'typing':
        return this.handleTyping(data);
      case 'message_start':
        return this.handleMessageStart(data);
      case 'message_chunk':
        // CRITICAL FIX: handleMessageChunk is now async - handle promise
        this.handleMessageChunk(data).catch(err => {
          chatLogger.error('Error handling message chunk', { error: err });
        });
        return;
      case 'report_update':
        return this.handleReportUpdate(data);
      case 'section_loading':
        return this.handleSectionLoading(data);
      case 'section_complete':
        return this.handleSectionComplete(data);
      case 'report_section':
        return this.handleReportSection(data);
      case 'report_complete':
        return this.handleReportComplete(data);
      case 'message_complete':
        return this.handleMessageComplete(data);
      case 'valuation_complete':
        return this.handleValuationComplete(data);
      case 'error':
        return this.handleError(data);
      case 'data_collected':
        return this.handleDataCollected(data);
      case 'suggestion_offered':
        return this.handleSuggestionOffered(data);
      case 'valuation_preview':
        return this.handleValuationPreview(data);
      case 'calculate_option':
        return this.handleCalculateOption(data);
      case 'progress_summary':
        return this.handleProgressSummary(data);
      case 'progress_update':
        return this.handleProgressUpdate(data);
      case 'clarification_needed':
        return this.handleClarificationNeeded(data);
      case 'valuation_ready':
        return this.handleValuationReady(data);
      case 'valuation_confirmed':
        return this.handleValuationConfirmed(data);
      case 'html_preview':
        return this.handleHtmlPreview(data);
      case 'unknown':
        // Treat unknown events as errors with a readable fallback
        return this.handleError({
          ...data,
          message: data.message || data.content || 'An unexpected event occurred',
          content: data.content || 'Unknown event type'
        });
      default:
        // Fallback for truly unrecognized event types
        chatLogger.warn('Unrecognized event type, treating as error', { type: eventType });
        return this.handleError({
          ...data,
          message: `Unrecognized event: ${eventType}`,
          content: data.content || 'An unexpected error occurred'
        });
    }
  }

  /**
   * Handle typing indicator events
   */
  private handleTyping(_data: any): void {
    chatLogger.debug('AI typing indicator received');
    // Show typing indicator and thinking state
    this.callbacks.setIsTyping?.(true);
    this.callbacks.setIsThinking?.(true);
    
    // CRITICAL FIX: Thread-safe message creation
    // Prevents race conditions when multiple events arrive simultaneously
    this.ensureMessageExists().catch(err => {
      chatLogger.error('Failed to ensure message exists', { error: err });
    });
  }

  /**
   * Handle message start events
   */
  private handleMessageStart(_data: any): void {
    // CRITICAL FIX: message_start always indicates a NEW message is starting
    // Must reset state and create new message, even if previous message is still active
    // This prevents confirmation messages from appending to previous messages
    
    // If a previous message is still active, complete it first
    if (this.hasStartedMessage) {
      chatLogger.debug('message_start received while previous message active - completing previous message', {
        bufferedChunks: this.chunkBuffer.length
      });
      // Complete the previous message if it exists
      this.callbacks.updateStreamingMessage('', true);
      this.callbacks.setIsStreaming(false);
    }
    
    // CRITICAL FIX: Reset state COMPLETELY - don't set hasStartedMessage=true yet
    // Let the chunks trigger ensureMessageExists to create the message
    // This prevents duplicate message creation
    this.hasStartedMessage = false;
    this.messageCreationLock = false;
    this.chunkBuffer = [];
    this.lastProcessedChunks = []; // CRITICAL FIX: Clear processed chunks on new message start
    this.lastCompleteMessageSignature = null; // Reset duplicate guard for new message
    
    // Hide thinking state and typing indicator when message starts streaming
    this.callbacks.setIsThinking?.(false);
    this.callbacks.setIsTyping?.(false);
    this.callbacks.setTypingContext?.(undefined);
    // FIX: Explicitly set isStreaming to true when message starts
    // This ensures input field is properly disabled during streaming
    // and re-enabled after message_complete
    this.callbacks.setIsStreaming(true);
    
    // CRITICAL FIX: Don't call ensureMessageExists here - let chunks create the message
    // This prevents creating duplicate messages when:
    // 1. handleTyping() creates message via ensureMessageExists
    // 2. handleMessageStart() resets state and calls ensureMessageExists again
    // 3. handleMessageChunk() calls ensureMessageExists again
    // Instead, chunks will call ensureMessageExists which will create the message once
  }

  /**
   * Handle message chunk events
   * CRITICAL FIX: Buffer chunks until message exists to prevent first chunk loss
   */
  private async handleMessageChunk(data: any): Promise<void> {
    // Sanitize content to ensure it's a string
    const content = data.content != null ? String(data.content) : '';
    
    if (!content) {
      chatLogger.warn('⚠️ Empty message chunk received - skipping update');
      return;
    }
    
    // Check for duplicate chunks
    const wasBuffered = this.chunkBuffer.includes(content);
    const wasRecentlyProcessed = this.lastProcessedChunks.slice(-3).includes(content); // Check last 3 processed chunks
    
    // CRITICAL FIX: If chunk was recently processed (within last 3 chunks), skip to prevent rapid duplicates
    // This handles cases where the same chunk arrives twice in quick succession
    if (wasRecentlyProcessed && !wasBuffered) {
      return;
    }
    
    // CRITICAL FIX: Ensure message exists BEFORE processing chunk
    // This prevents first chunk loss when chunks arrive before message_start
    await this.ensureMessageExists();
    
    // Clear typing indicators since we're now streaming
    if (this.hasStartedMessage) {
      this.callbacks.setIsThinking?.(false);
      this.callbacks.setIsTyping?.(false);
    }
    
    // If message doesn't exist yet (shouldn't happen after await, but defensive), buffer the chunk
    if (!this.hasStartedMessage) {
      chatLogger.warn('⚠️ Message not created yet after ensureMessageExists - buffering chunk', {
        chunkContent: content.substring(0, 30)
      });
      // CRITICAL FIX: Only buffer if not already buffered to prevent duplicates
      if (!wasBuffered) {
        this.chunkBuffer.push(content);
      }
      return;
    }
    
    // CRITICAL FIX: If chunk is currently buffered, it will be flushed by ensureMessageExists
    // Don't process it again to prevent duplication
    if (wasBuffered) {
      return;
    }
    
    // Mark chunk as processed before updating message
    this.lastProcessedChunks.push(content);
    // Keep only last 10 chunks to prevent memory growth
    if (this.lastProcessedChunks.length > 10) {
      this.lastProcessedChunks = this.lastProcessedChunks.slice(-10);
    }
    
    // Message exists - update it with the chunk
    this.callbacks.updateStreamingMessage(content);
  }

  /**
   * Handle report update events
   */
  private handleReportUpdate(data: any): void {
    chatLogger.info('Report update received', {
      sessionId: this.sessionId,
      progress: data.progress,
      htmlLength: data.html?.length || 0,
      hasHtml: !!data.html,
      timestamp: new Date().toISOString()
    });
    
    // Update live report as sections are generated
    this.callbacks.onReportUpdate?.(data.html, data.progress);
    
    chatLogger.debug('Report update processed', {
      sessionId: this.sessionId,
      progress: data.progress,
      htmlPreview: data.html?.substring(0, 100) + '...'
    });
  }

  /**
   * Handle section loading events
   */
  private handleSectionLoading(data: any): void {
    chatLogger.info('Section loading received', {
      sessionId: this.sessionId,
      section: data.section,
      phase: data.phase,
      htmlLength: data.html?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    this.callbacks.onSectionLoading?.(
      data.section || data.section_id,
      data.html,
      data.phase,
      data
    );
  }

  /**
   * Handle section complete events (new progressive report system)
   * 
   * This is the new event type emitted by StreamingHTMLGenerator
   * for jaw-dropping Lovable.dev-style section-by-section rendering.
   */
  private handleSectionComplete(data: any): void {
    chatLogger.info('✅ Section complete received', {
      sessionId: this.sessionId,
      sectionId: data.section_id,
      sectionName: data.section_name,
      progress: data.progress,
      htmlLength: data.html?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Call the new onSectionComplete callback
    this.callbacks.onSectionComplete?.({
      sectionId: data.section_id,
      sectionName: data.section_name,
      html: data.html,
      progress: data.progress,
      phase: data.phase
    });
    
    chatLogger.debug('Section complete processed', {
      sessionId: this.sessionId,
      sectionId: data.section_id,
      progress: data.progress,
      htmlPreview: data.html?.substring(0, 100) + '...'
    });
  }

  /**
   * Handle report section events
   */
  private handleReportSection(data: any): void {
    chatLogger.info('Report section received', {
      sessionId: this.sessionId,
      section: data.section,
      phase: data.phase,
      progress: data.progress,
      htmlLength: data.html?.length || 0,
      is_fallback: data.is_fallback,
      is_error: data.is_error,
      timestamp: new Date().toISOString()
    });
    
    this.callbacks.onReportSectionUpdate?.(
      data.section,
      data.html,
      data.phase,
      data.progress,
      data.is_fallback,
      data.is_error,
      data.error_message
    );
    
    chatLogger.debug('Report section processed', {
      sessionId: this.sessionId,
      section: data.section,
      phase: data.phase,
      progress: data.progress,
      htmlPreview: data.html?.substring(0, 100) + '...'
    });
  }

  /**
   * Handle report complete events
   */
  private handleReportComplete(data: any): void {
    chatLogger.info('Report complete received', {
      sessionId: this.sessionId,
      valuationId: data.valuation_id,
      htmlLength: data.html?.length || 0,
      progress: data.progress,
      timestamp: new Date().toISOString()
    });
    
    this.callbacks.onReportComplete?.(data.html, data.valuation_id);
    
    chatLogger.debug('Report complete processed', {
      sessionId: this.sessionId,
      valuationId: data.valuation_id,
      progress: data.progress,
      htmlPreview: data.html?.substring(0, 100) + '...'
    });
  }

  /**
   * Handle message complete events
   */
  private handleMessageComplete(data: any): void {
    // CRITICAL DEBUG: Log metadata contents
    chatLogger.info('Message complete', { 
      hasMetadata: !!data.metadata, 
      hasValuationResult: !!data.metadata?.valuation_result,
      metadata: data.metadata // ← LOG FULL METADATA
    });
    
    // Ensure valuation CTA metadata is present when the valuation confirmation question arrives
    const isValuationCTA =
      data.field === 'valuation_confirmed' ||
      data.metadata?.clarification_field === 'valuation_confirmed' ||
      data.metadata?.section === 'valuation_ready';

    // Fallback: if the content clearly looks like the valuation confirmation question,
    // treat it as a CTA even if metadata is missing (some backends omit section/field).
    const contentLower = (data.content || data.message || '').toLowerCase();
    const looksLikeValuationCTA =
      contentLower.includes('ready to generate your valuation report') ||
      (contentLower.includes('valuation') && contentLower.includes('confirm'));

    if (isValuationCTA || looksLikeValuationCTA) {
      const updatedMeta = {
        ...data.metadata,
        input_type: data.metadata?.input_type || 'cta_button',
        button_text: data.metadata?.button_text || 'Create Valuation Report',
        collected_field: 'valuation_confirmed',
        clarification_field: 'valuation_confirmed'
      };
      data = { ...data, metadata: updatedMeta };
    }

    // Deduplicate identical AI messages to avoid repeated bubbles for the same question
    const signature = `${data.content || data.message || ''}|${data.metadata?.collected_field || ''}|${data.metadata?.clarification_field || ''}|${data.metadata?.input_type || ''}`;
    const now = Date.now();
    // Skip if identical signature arrives within 6 seconds
    if (signature && this.lastCompleteMessageSignature === signature && (now - this.lastCompleteMessageTimestamp) < 6000) {
      chatLogger.debug('Skipping duplicate message_complete', { signature, age_ms: now - this.lastCompleteMessageTimestamp });
      // Still clear streaming/typing state even if skipping content
      this.callbacks.setIsStreaming(false);
      this.callbacks.setIsTyping?.(false);
      this.callbacks.setIsThinking?.(false);
      this.hasStartedMessage = false;
      this.messageCreationLock = false;
      return;
    }
    this.lastCompleteMessageSignature = signature;
    this.lastCompleteMessageTimestamp = now;

    // If this is a business_type clarification (message_complete path), proactively surface suggestions
    const isBusinessTypeClarification =
      data.field === 'business_type' ||
      data.metadata?.collected_field === 'business_type' ||
      data.metadata?.clarification_field === 'business_type' ||
      data.metadata?.input_type === 'business_type_selector';

    if (isBusinessTypeClarification && typeof data.metadata?.clarification_value === 'string') {
      const meta = data.metadata || {};
      const candidateValue =
        meta.clarification_value ||
        meta.value ||
        meta.original_value ||
        meta.collected_value ||
        meta.last_value ||
        meta.user_value ||
        meta.input_value;

      const query = typeof candidateValue === 'string' ? candidateValue.trim() : '';
      if (query.length >= 3) {
        businessTypesApiService.searchBusinessTypes(query, 5)
          .then((suggestions) => {
            const list = (suggestions && suggestions.length > 0) ? suggestions : getFallbackBusinessTypeSuggestions(query, 5);
            if (list.length > 0) {
              this.handleSuggestionOffered({
                field: 'business_type',
                original_value: query,
                suggestions: list,
                message: 'Did you mean one of these business types?'
              });
            }
          })
          .catch((error) => {
            chatLogger.error('Business type suggestion lookup failed (message_complete)', { error: error instanceof Error ? error.message : String(error) });
            const fallback = getFallbackBusinessTypeSuggestions(query, 5);
            if (fallback.length > 0) {
              this.handleSuggestionOffered({
                field: 'business_type',
                original_value: query,
                suggestions: fallback,
                message: 'Did you mean one of these business types?'
              });
            }
          });
      }
    }
    
    // CRITICAL FIX: Ensure message exists before completing
    if (!this.hasStartedMessage) {
      chatLogger.warn('Message complete received but no message was started - creating final message');
      this.callbacks.addMessage({
        type: 'ai',  // FIX: Use correct type from Message type definition
        content: data.content || data.message || '',
        metadata: data.metadata, // ← CRITICAL FIX: Include metadata!
        isComplete: true
      });
    } else {
      // Update existing streaming message and mark complete
      // Need to set metadata on the last message
      this.callbacks.updateStreamingMessage('', true, data.metadata); // ← Pass metadata
    }
    
    this.callbacks.setIsStreaming(false);
    this.callbacks.setIsTyping?.(false);
    this.callbacks.setIsThinking?.(false);
    // CRITICAL FIX: Reset state for next message (release lock too)
    this.hasStartedMessage = false;
    this.messageCreationLock = false; // Release lock when message completes
    
    // Track model performance if metadata is available
    if (data.metadata) {
      const performanceMetrics: ModelPerformanceMetrics = {
        model_name: data.metadata.model || 'gpt-4o-mini',
        model_version: '1.0',
        time_to_first_token_ms: data.metadata.response_time_ms || 0,
        total_response_time_ms: data.metadata.response_time_ms || 0,
        tokens_per_second: data.metadata.tokens_used ? (data.metadata.tokens_used / ((data.metadata.response_time_ms || 1) / 1000)) : 0,
        response_coherence_score: data.metadata.confidence_score,
        response_relevance_score: data.metadata.confidence_score,
        hallucination_detected: false, // Would need ML model to detect
        input_tokens: 0, // Not provided by backend
        output_tokens: data.metadata.tokens_used || 0,
        estimated_cost_usd: (data.metadata.tokens_used || 0) * 0.00015, // GPT-4o-mini pricing
        error_occurred: false,
        retry_count: 0
      };
      this.callbacks.trackModelPerformance(performanceMetrics);
    }
    
    // Check for valuation result
    if (data.metadata?.valuation_result) {
      chatLogger.info('Valuation result received', { valuationResult: data.metadata.valuation_result });
      this.callbacks.onValuationComplete?.(data.metadata.valuation_result);
      // Track successful completion with valuation
      this.callbacks.trackConversationCompletion(true, true);
    }
  }

  /**
   * Handle valuation complete events
   */
  private handleValuationComplete(data: any): void {
    chatLogger.info('Valuation complete event received', { 
      hasResult: !!data.result,
      sessionId: data.session_id,
      hasContent: !!data.content,
      contentPreview: data.content?.substring(0, 50)
    });
    
    // Extract content from event (backend sends completion message)
    const completionMessage = data.content || data.message || '';
    
    // Only update/create message if we have content to show
    if (completionMessage) {
      // CRITICAL FIX: Check if streaming message exists before updating
      // If it doesn't exist, addMessage will create it with the correct content
      // If it exists, updateStreamingMessage will append (which is correct for streaming)
      // But for completion messages, we want to ensure no duplication
      const hasStreamingMessage = this.hasStartedMessage;
      
      if (!hasStreamingMessage) {
        // No existing message - create new one with completion message
        // Don't call updateStreamingMessage as it would append and duplicate
        this.callbacks.addMessage({
          type: 'ai',
          content: completionMessage,
          isStreaming: false,
          isComplete: true
        });
      } else {
        // Existing message - update it (will append, but that's fine for streaming completion)
        this.callbacks.updateStreamingMessage(completionMessage, true);
      }
    } else {
      // No content - just clear state without creating empty message
      chatLogger.debug('Valuation complete with no message content - skipping message creation');
    }
    
    this.callbacks.setIsStreaming(false);
    this.callbacks.setIsThinking?.(false);
    this.callbacks.setIsTyping?.(false);
    // CRITICAL FIX: Reset state for next message
    this.hasStartedMessage = false;
    this.messageCreationLock = false;
    
    if (data.result) {
      chatLogger.info('Processing valuation result', { 
        valuationId: data.result.valuation_id,
        enterpriseValue: data.result.enterprise_value 
      });
      this.callbacks.onValuationComplete?.(data.result);
      // Track successful completion with valuation
      this.callbacks.trackConversationCompletion(true, true);
    }
  }

  /**
   * Handle error events
   * 
   * Gracefully handles errors even if they arrive as the first event,
   * preserving the user's message bubble and displaying a system error.
   */
  private handleError(data: any): void {
    chatLogger.error('Stream error received', { 
      error: data.content,
      sessionId: this.sessionId,
      hasStartedMessage: this.hasStartedMessage,
      timestamp: new Date().toISOString()
    });
    
    // Stop all streaming/thinking/typing states
    this.callbacks.setIsStreaming(false);
    this.callbacks.setIsTyping?.(false);
    this.callbacks.setIsThinking?.(false);
    this.callbacks.setTypingContext?.(undefined);
    // CRITICAL FIX: Don't reset hasStartedMessage on error - preserve conversation state
    // Only reset the lock to allow retry, but keep message state so conversation can continue
    this.messageCreationLock = false;
    
    // Show user-friendly error message
    const errorMessage = data.message || data.content || 'Unknown error';
    const userFriendlyError = errorMessage.includes('rate limit') 
      ? 'I\'m receiving too many requests right now. Please wait a moment and try again.'
      : errorMessage.includes('timeout')
      ? 'The request took too long. Please try again with a shorter message.'
      : errorMessage.includes('Context retrieval failed')
      ? 'I\'m having trouble accessing your conversation history. Please try again.'
      : errorMessage.includes('Valuation failed')
      ? 'I encountered an issue calculating your valuation. Please try again.'
      : errorMessage.includes('Processing failed')
      ? 'I\'m having trouble processing your request. Please try again.'
      : errorMessage;
    
    // CRITICAL FIX: Always show error as a separate message to avoid duplication
    // Complete any active streaming message first, then show error
    if (this.hasStartedMessage) {
      // Complete the current message if it exists
      this.callbacks.updateStreamingMessage('', true);
      this.callbacks.setIsStreaming(false);
      // Reset state to prevent duplication
      this.hasStartedMessage = false;
      this.chunkBuffer = [];
    }
    
    // Always add error as a separate system message
    // This ensures the error is shown only once and doesn't get appended to existing messages
    this.callbacks.addMessage({
      type: 'system',
      content: userFriendlyError,
      isComplete: true
    });
  }

  /**
   * Handle progress update events (for typing context and thinking state)
   */
  private handleProgressUpdate(data: any): void {
    chatLogger.debug('Progress update received', {
      currentStep: data.current_step,
      progress: data.progress
    });
    
    // Set thinking state when progress update arrives
    this.callbacks.setIsThinking?.(true);
    
    // Update typing context based on current step
    if (data.current_step) {
      this.callbacks.setTypingContext?.(data.current_step);
    }
    
    // Notify parent component for progress tracking
    this.callbacks.onProgressUpdate?.(data);
  }

  /**
   * Handle data collected events
   */
  private handleDataCollected(data: any): void {
    chatLogger.info('Data collected', {
      field: data.field,
      displayName: data.display_name,
      completeness: data.completeness,
      has_metadata: !!data.metadata,
      metadata_keys: data.metadata ? Object.keys(data.metadata) : []
      // SECURITY: Don't log actual value - may contain PII/financial data
    });
    
    // FIX: Don't reset streaming/thinking states here - conversation should continue
    // The backend will immediately stream the next question, which will reset states via message_start
    // Resetting here would block the next question from appearing
    
    // CRITICAL FIX: Sanitize value to ensure it's always a string
    // Backend might send objects, which would render as "[object Object]"
    // MEMORY FIX: Limit JSON stringify size to prevent memory issues
    const MAX_JSON_SIZE = 500; // Maximum characters for JSON string representation
    
    let sanitizedValue = data.value;
    if (sanitizedValue !== null && sanitizedValue !== undefined) {
      // TYPE SAFETY: Explicit type checking
      const valueType = typeof sanitizedValue;
      
      if (valueType === 'object') {
        // If value is an object, extract meaningful string representation
        if (Array.isArray(sanitizedValue)) {
          sanitizedValue = sanitizedValue.length > 0 ? String(sanitizedValue[0]) : 'Not provided';
        } else if (sanitizedValue === null) {
          sanitizedValue = 'Not provided';
        } else if ('value' in sanitizedValue && sanitizedValue.value != null) {
          sanitizedValue = String(sanitizedValue.value);
        } else if ('name' in sanitizedValue && sanitizedValue.name != null) {
          sanitizedValue = String(sanitizedValue.name);
        } else {
          // Convert object to JSON string as fallback
          // MEMORY FIX: Limit size, handle circular references
          try {
            const jsonStr = JSON.stringify(sanitizedValue, (_key, val) => {
              // SECURITY: Don't stringify functions or undefined
              if (typeof val === 'function' || val === undefined) {
                return '[Function]';
              }
              return val;
            }, 2);
            
            // Truncate if too large
            if (jsonStr.length > MAX_JSON_SIZE) {
              sanitizedValue = jsonStr.substring(0, MAX_JSON_SIZE - 3) + '...';
            } else {
              sanitizedValue = jsonStr;
            }
            
            chatLogger.warn('Data collected value was object, converted to JSON', {
              field: data.field,
              valueType: 'object',
              jsonLength: sanitizedValue.length
              // SECURITY: Don't log actual values
            });
          } catch (e) {
            // Handle circular references or other serialization errors
            chatLogger.error('Failed to serialize data collected value', {
              field: data.field,
              error: e instanceof Error ? e.message : String(e)
            });
            sanitizedValue = `[Complex object: ${sanitizedValue.constructor?.name || 'Object'}]`;
          }
        }
      } else {
        sanitizedValue = String(sanitizedValue);
      }
    } else {
      sanitizedValue = 'Not provided';
    }
    
    // Update local state with sanitized value
    this.callbacks.setCollectedData(prev => ({
      ...prev,
      [data.field]: {
        ...data,
        value: sanitizedValue  // Ensure value is always a string
      }
    }));
    
    // Notify parent component
    this.callbacks.onDataCollected?.({
      ...data,
      value: sanitizedValue
    });

    // CRITICAL FIX: If business_type collected, show confirmation card
    // This provides visual feedback similar to the manual flow
    if (data.field === 'business_type') {
      const metadata = data.metadata || {};
      
      // Defensive: Extract metadata with fallbacks
      const industry = metadata.industry_mapping || metadata.industry || null;
      const category = metadata.category || null;
      const icon = metadata.icon || '🏢';
      const confidence = metadata.confidence || undefined;
      
      chatLogger.info('Injecting business type confirmation card', {
        business_type: sanitizedValue,
        industry: industry,
        category: category,
        icon: icon,
        has_metadata: !!data.metadata,
        metadata_keys: data.metadata ? Object.keys(data.metadata) : []
      });

      // Only inject confirmation card if we have valid business type
      if (sanitizedValue && sanitizedValue !== 'Not provided') {
        this.callbacks.addMessage({
          type: 'ai',
          content: '', // Empty content, we'll render the card
          isComplete: true,
          metadata: {
            is_business_type_confirmation: true,
            business_type: sanitizedValue,
            industry: industry,
            category: category,
            icon: icon,
            confidence: confidence
          }
        });
      } else {
        chatLogger.warn('Skipping business type confirmation card - invalid value', {
          sanitizedValue: sanitizedValue
        });
      }
    }

    // CRITICAL FIX: If company_name collected with KBO verification, show confirmation card
    // This provides visual feedback similar to business type confirmation
    if (data.field === 'company_name') {
      const metadata = data.metadata || {};
      
      // CRITICAL DEBUG: Log all metadata for company_name to diagnose missing card
      console.log('🔍 [ROOT-CAUSE] Company name data_collected event received', {
        field: data.field,
        has_metadata: !!data.metadata,
        metadata: metadata,
        metadata_keys: data.metadata ? Object.keys(data.metadata) : [],
        is_company_name_confirmation: metadata.is_company_name_confirmation,
        kbo_verified: metadata.kbo_verified,
        registration_number: metadata.registration_number,
        sanitizedValue: sanitizedValue
      });
      chatLogger.error('🔍 [ROOT-CAUSE] Company name data_collected event received', {
        field: data.field,
        has_metadata: !!data.metadata,
        metadata: metadata,
        metadata_keys: data.metadata ? Object.keys(data.metadata) : [],
        is_company_name_confirmation: metadata.is_company_name_confirmation,
        kbo_verified: metadata.kbo_verified,
        registration_number: metadata.registration_number,
        sanitizedValue: sanitizedValue
      });
      
      // Check if this is a KBO-verified company (has confirmation flag)
      // CRITICAL: Check both flags and also check if we have KBO data (registration_number)
      const hasConfirmationFlag = metadata.is_company_name_confirmation === true || metadata.kbo_verified === true;
      const hasKBOData = !!metadata.registration_number;
      
      console.log('🔍 [ROOT-CAUSE] Company name card injection check', {
        field: data.field,
        hasConfirmationFlag,
        hasKBOData,
        is_company_name_confirmation: metadata.is_company_name_confirmation,
        kbo_verified: metadata.kbo_verified,
        registration_number: metadata.registration_number,
        all_metadata_keys: data.metadata ? Object.keys(data.metadata) : [],
        willInjectCard: hasConfirmationFlag && hasKBOData
      });
      chatLogger.error('🔍 [ROOT-CAUSE] Company name card injection check', {
        field: data.field,
        hasConfirmationFlag,
        hasKBOData,
        is_company_name_confirmation: metadata.is_company_name_confirmation,
        kbo_verified: metadata.kbo_verified,
        registration_number: metadata.registration_number,
        all_metadata_keys: data.metadata ? Object.keys(data.metadata) : [],
        willInjectCard: hasConfirmationFlag && hasKBOData
      });
      
      if (hasConfirmationFlag && hasKBOData) {
        // Defensive: Extract metadata with fallbacks
        const companyName = metadata.company_name || sanitizedValue || null;
        const registrationNumber = metadata.registration_number || null;
        const legalForm = metadata.legal_form || null;
        const foundingYear = metadata.founding_year || null;
        const industryDescription = metadata.industry_description || null;
        const confidence = metadata.confidence || undefined;
        
        chatLogger.info('✅ Injecting company name KBO confirmation card', {
          company_name: companyName,
          registration_number: registrationNumber,
          legal_form: legalForm,
          founding_year: foundingYear,
          has_metadata: !!data.metadata,
          metadata_keys: data.metadata ? Object.keys(data.metadata) : []
        });

        // CRITICAL DEBUG: Log condition check
        chatLogger.error('🔍 [ROOT-CAUSE] Final check before card injection', {
          companyName: companyName,
          companyNameIsValid: companyName && companyName !== 'Not provided',
          registrationNumber: registrationNumber,
          registrationNumberIsValid: !!registrationNumber,
          willShowCard: !!(companyName && companyName !== 'Not provided' && registrationNumber)
        });

        // Only inject confirmation card if we have valid company name and KBO data
        if (companyName && companyName !== 'Not provided' && registrationNumber) {
          console.log('✅✅✅ INJECTING COMPANY NAME CONFIRMATION CARD', {
            companyName,
            registrationNumber,
            legalForm
          });
          chatLogger.info('✅✅✅ INJECTING COMPANY NAME CONFIRMATION CARD', {
            companyName,
            registrationNumber,
            legalForm
          });
          
          this.callbacks.addMessage({
            type: 'ai',
            content: '', // Empty content, we'll render the card
            isComplete: true,
            metadata: {
              is_company_name_confirmation: true,
              company_name: companyName,
              registration_number: registrationNumber,
              legal_form: legalForm,
              founding_year: foundingYear,
              industry_description: industryDescription,
              confidence: confidence
            }
          });
        } else {
          chatLogger.warn('❌ Skipping company name confirmation card - missing required data', {
            companyName: companyName,
            hasRegistrationNumber: !!registrationNumber,
            reason: !companyName ? 'missing company name' : !registrationNumber ? 'missing registration number' : 'unknown'
          });
        }
      } else {
        console.warn('❌ Not injecting company name card - missing flags or data', {
          hasConfirmationFlag,
          hasKBOData,
          is_company_name_confirmation: metadata.is_company_name_confirmation,
          kbo_verified: metadata.kbo_verified,
          registration_number: metadata.registration_number
        });
        chatLogger.warn('❌ Not injecting company name card - missing flags or data', {
          hasConfirmationFlag,
          hasKBOData,
          is_company_name_confirmation: metadata.is_company_name_confirmation,
          kbo_verified: metadata.kbo_verified,
          registration_number: metadata.registration_number
        });
      }
    }
  }

  /**
   * Handle suggestion offered events
   */
  private handleSuggestionOffered(data: any): void {
    chatLogger.info('Suggestion offered event received', {
      field: data.field,
      original_value: data.original_value,
      suggestions_count: data.suggestions?.length || 0
    });

    // Ensure we have suggestions; if empty, build a local fallback from known types
    let suggestions = data.suggestions;
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = getFallbackBusinessTypeSuggestions(data.original_value || '', 5);
      chatLogger.info('Using fallback suggestions', {
        field: data.field,
        original_value: data.original_value,
        fallback_count: suggestions.length
      });
    }
    
    // Create suggestion message
    const suggestionMessage: Message = {
      id: `suggestion-${Date.now()}`,
      role: 'assistant',
      content: data.message || 'Did you mean one of these?',
      timestamp: new Date(),
      type: 'suggestion',
      metadata: {
        field: data.field,
        originalValue: data.original_value,
        suggestions
      }
    };
    
    // Add suggestion message to chat
    this.callbacks.addMessage(suggestionMessage);
  }

  /**
   * Handle valuation preview events
   */
  private handleValuationPreview(data: any): void {
    chatLogger.info('Valuation preview received', {
      range_mid: data.range_mid,
      confidence: data.confidence,
      tier: data.tier
    });
    
    // Update local state
    this.callbacks.setValuationPreview(data);
    
    // Notify parent component
    this.callbacks.onValuationPreview?.(data);
  }

  /**
   * Handle calculate option events
   */
  private handleCalculateOption(data: any): void {
    chatLogger.info('Calculate option available', {
      tier: data.tier,
      confidence: data.confidence
    });
    
    // Update local state
    this.callbacks.setCalculateOption(data);
    
    // Notify parent component
    this.callbacks.onCalculateOptionAvailable?.(data);
  }

  /**
   * Handle progress summary events
   */
  private handleProgressSummary(data: any): void {
    chatLogger.info('Progress summary received', {
      completeness: data.completeness,
      next_milestone: data.next_milestone,
      sections: data.sections
    });
    
    // Log collected fields
    console.log('Collected fields:', data.completeness.collected_count);
    console.log('Sections:', data.sections);
    
    // Notify parent component
    this.callbacks.onProgressUpdate?.(data);
  }

  /**
   * Handle clarification needed events
   */
  private handleClarificationNeeded(data: any): void {
    chatLogger.warn('Clarification needed', {
      field: data.field,
      concern: data.concern,
      value: data.value
    });
    
    // Check if this is a simple follow-up question (e.g., after "none" response)
    // These should NOT have confirmation buttons
    const message = data.message || data.content || '';
    const isSimpleFollowUp = message.includes("No problem!") || 
                             (message.includes("What's your company name?") && message.includes("No problem"));
    
    // Show clarification message with confirmation options (unless it's a simple follow-up)
    const clarificationMessage: Omit<Message, 'id' | 'timestamp'> = {
      type: 'ai',
      content: message,
      isComplete: true,
      metadata: {
        intent: 'clarification',
        collected_field: data.field,
        validation_status: 'needs_clarification',
        clarification_value: data.value,
        clarification_field: data.field,
        // For business_type and company_name we rely on suggestions, not confirm buttons
        needs_confirmation: data.field !== 'business_type' && data.field !== 'company_name' && !isSimpleFollowUp,
        // Merge any additional metadata from backend
        ...(data.metadata || {})
      }
    };

    // UX hint: emphasize euro-only for financial fields and show conversion if provided
    if (data.field === 'revenue' || data.field === 'ebitda') {
      const meta = clarificationMessage.metadata || {};
      const conversionNote = meta.converted_amount_eur && meta.original_currency && meta.original_amount
        ? `Converted ${meta.original_currency} ${meta.original_amount} → €${meta.converted_amount_eur} (ECB rate)`
        : undefined;
      clarificationMessage.metadata = {
        ...meta,
        help_text: meta.help_text || 'Please provide the amount in euros (€). Plain numbers are treated as EUR.',
        currency_hint: 'EUR_ONLY',
        conversion_note: conversionNote
      };
    }

    this.callbacks.addMessage(clarificationMessage);

    // If business_type is invalid, proactively fetch and surface suggestions
    if (data.field === 'business_type' && typeof data.value === 'string' && data.value.trim().length >= 3) {
      const query = data.value.trim();
      businessTypesApiService.searchBusinessTypes(query, 5)
        .then((suggestions) => {
          const list = (suggestions && suggestions.length > 0) ? suggestions : getFallbackBusinessTypeSuggestions(query, 5);
          if (list.length > 0) {
            this.handleSuggestionOffered({
              field: 'business_type',
              original_value: data.value,
              suggestions: list,
              message: 'Did you mean one of these business types?'
            });
          }
        })
        .catch((error) => {
          chatLogger.error('Business type suggestion lookup failed', { error: error instanceof Error ? error.message : String(error) });
          const fallback = getFallbackBusinessTypeSuggestions(query, 5);
          if (fallback.length > 0) {
            this.handleSuggestionOffered({
              field: 'business_type',
              original_value: data.value,
              suggestions: fallback,
              message: 'Did you mean one of these business types?'
            });
          }
        });
    }

    // If company_name is unclear, fetch registry suggestions
    if (data.field === 'company_name' && typeof data.value === 'string' && data.value.trim().length >= 2) {
      registryService.searchCompanies(data.value.trim(), 'BE', 5)
        .then((resp) => {
          const suggestions = (resp?.results || []).map((item: any, idx: number) => ({
            text: item?.company_name || item?.name || item?.title || data.value,
            confidence: item?.score ?? 0.7,
            reason: item?.address || item?.country || 'Similar company',
            registration_number: item?.registration_number,
            _index: idx,
          })).filter((s: any) => !!s.text);
          if (suggestions.length > 0) {
            this.handleSuggestionOffered({
              field: 'company_name',
              original_value: data.value,
              suggestions,
              message: 'Did you mean one of these companies?'
            });
          }
        })
        .catch((error: any) => {
          chatLogger.error('Company suggestion lookup failed', { error: error instanceof Error ? error.message : String(error) });
        });
    }

    // If country_code is requested, present only Belgium as the selectable option.
    if (data.field === 'country_code') {
      const beSuggestions = [
        {
          text: 'Belgium',
          code: 'BE',
          confidence: 1,
          reason: 'Currently supported country',
        }
      ];
      this.handleSuggestionOffered({
        field: 'country_code',
        original_value: 'Belgium',
        suggestions: beSuggestions,
        message: 'Select your operating country'
      });
    }
  }

  /**
   * Handle valuation ready events (CTA)
   */
  private handleValuationReady(data: any): void {
    const ctaMessage: Omit<Message, 'id' | 'timestamp'> = {
      type: 'ai',
      content: data.message || 'Ready to generate your valuation report.',
      isComplete: true,
      metadata: {
        input_type: 'cta_button',
        button_text: data.button_text || 'Create Valuation Report',
        collected_field: 'valuation_confirmed',
        valuation_summary: data.summary,
        range_mid: data.range_mid,
        valuation_id: data.valuation_id
      }
    };
    this.callbacks.addMessage(ctaMessage);
  }

  /**
   * Handle valuation confirmed events (treat similarly as ready, ensuring CTA)
   */
  private handleValuationConfirmed(data: any): void {
    const ctaMessage: Omit<Message, 'id' | 'timestamp'> = {
      type: 'ai',
      content: data.message || 'Please confirm to generate your valuation report.',
      isComplete: true,
      metadata: {
        input_type: 'cta_button',
        button_text: data.button_text || 'Create Valuation Report',
        collected_field: 'valuation_confirmed',
        valuation_summary: data.summary,
        range_mid: data.range_mid,
        valuation_id: data.valuation_id
      }
    };
    this.callbacks.addMessage(ctaMessage);
  }

  /**
   * Handle HTML preview events
   */
  private handleHtmlPreview(data: any): void {
    chatLogger.info('HTML preview event received', {
      sessionId: this.sessionId,
      preview_type: data.preview_type,
      html_length: data.html?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Call parent callback to update preview
    if (this.callbacks.onHtmlPreviewUpdate) {
      this.callbacks.onHtmlPreviewUpdate(data.html, data.preview_type);
    }
  }
}
