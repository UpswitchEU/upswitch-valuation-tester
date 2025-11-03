/**
 * StreamEventHandler - Handles all SSE events from the streaming conversation
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all event handling logic in a single, testable class.
 */

import { Message } from '../../hooks/useStreamingChatState';
import { chatLogger } from '../../utils/logger';

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
  updateStreamingMessage: (content: string, isComplete?: boolean) => void;
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
      bufferedChunks: this.chunkBuffer.length
    });
    this.hasStartedMessage = false;
    this.messageCreationLock = false;
    this.chunkBuffer = []; // CRITICAL FIX: Clear chunk buffer on reset
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
    // Mark that we've started a message
    this.hasStartedMessage = true;
    // Hide thinking state and typing indicator when message starts streaming
    this.callbacks.setIsThinking?.(false);
    this.callbacks.setIsTyping?.(false);
    this.callbacks.setTypingContext?.(undefined);
    // FIX: Explicitly set isStreaming to true when message starts
    // This ensures input field is properly disabled during streaming
    // and re-enabled after message_complete
    this.callbacks.setIsStreaming(true);
    
    // CRITICAL FIX: Ensure message exists if message_start comes before chunks
    // Some backends might send message_start but frontend hasn't created message yet
    this.ensureMessageExists().catch(err => {
      chatLogger.error('Failed to ensure message exists on message_start', { error: err });
    });
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
      this.chunkBuffer.push(content);
      return;
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
    chatLogger.info('Message complete', { 
      hasMetadata: !!data.metadata, 
      hasValuationResult: !!data.metadata?.valuation_result 
    });
    
    // CRITICAL FIX: Ensure message exists before completing
    if (!this.hasStartedMessage) {
      chatLogger.warn('Message complete received but no message was started - creating final message');
      this.callbacks.addMessage({
        type: 'ai',  // FIX: Use correct type from Message type definition
        content: data.content || data.message || '',
        isComplete: true
      });
    } else {
      this.callbacks.updateStreamingMessage('', true);
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
      this.callbacks.updateStreamingMessage(completionMessage, true);
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
    // CRITICAL FIX: Reset state and release lock on error
    this.hasStartedMessage = false;
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
    
    // If no AI message was started yet, add a compact system message
    // This preserves the user's message bubble
    if (!this.hasStartedMessage) {
      this.callbacks.addMessage({
        type: 'system',
        content: `Error: ${userFriendlyError}`,
        isComplete: true
      });
    } else {
      // If we were already streaming, append the error to the current message
      this.callbacks.updateStreamingMessage(
        `\n\nI apologize, but ${userFriendlyError}`,
        true
      );
    }
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
      completeness: data.completeness
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
        suggestions: data.suggestions
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
    
    // Show clarification message with confirmation options
    const clarificationMessage: Omit<Message, 'id' | 'timestamp'> = {
      type: 'ai',
      content: data.message,
      isComplete: true,
      metadata: {
        intent: 'clarification',
        collected_field: data.field,
        validation_status: 'needs_clarification',
        clarification_value: data.value,
        clarification_field: data.field,
        needs_confirmation: true,
        // Merge any additional metadata from backend
        ...(data.metadata || {})
      }
    };
    this.callbacks.addMessage(clarificationMessage);
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
