/**
 * StreamEventHandler - Handles all SSE events from the streaming conversation
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all event handling logic in a single, testable class.
 */

import { chatLogger } from '../../utils/logger';
import { Message } from '../../hooks/useStreamingChatState';

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
  setCollectedData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setValuationPreview: React.Dispatch<React.SetStateAction<any>>;
  setCalculateOption: React.Dispatch<React.SetStateAction<any>>;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => { updatedMessages: Message[], newMessage: Message };
  trackModelPerformance: (metrics: ModelPerformanceMetrics) => void;
  trackConversationCompletion: (success: boolean, hasValuation: boolean) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (html: string, progress: number) => void;
  onSectionLoading?: (section: string, html: string, phase: number) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportSectionUpdate?: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onDataCollected?: (data: any) => void;
  onValuationPreview?: (data: any) => void;
  onCalculateOptionAvailable?: (data: any) => void;
  onProgressUpdate?: (data: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
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

  constructor(
    sessionId: string,
    private callbacks: StreamEventHandlerCallbacks
  ) {
    this.sessionId = sessionId;
  }

  /**
   * Main event handler - routes events to appropriate handlers
   * 
   * @param data - Event data from SSE stream
   */
  handleEvent(data: any): void {
    chatLogger.debug('Received stream event', { 
      type: data.type, 
      hasContent: !!data.content, 
      contentLength: data.content?.length 
    });
    
    switch (data.type) {
      case 'typing':
        return this.handleTyping(data);
      case 'message_start':
        return this.handleMessageStart(data);
      case 'message_chunk':
        return this.handleMessageChunk(data);
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
      case 'clarification_needed':
        return this.handleClarificationNeeded(data);
      case 'html_preview':
        return this.handleHtmlPreview(data);
      default:
        chatLogger.warn('Unknown event type', { type: data.type });
    }
  }

  /**
   * Handle typing indicator events
   */
  private handleTyping(_data: any): void {
    chatLogger.debug('AI typing indicator received');
    // Typing indicator is handled by the typing animation hook
  }

  /**
   * Handle message start events
   */
  private handleMessageStart(_data: any): void {
    chatLogger.debug('AI message start received');
    // Message start is handled by the streaming message logic
  }

  /**
   * Handle message chunk events
   */
  private handleMessageChunk(data: any): void {
    chatLogger.debug('Message chunk received', { contentLength: data.content?.length });
    this.callbacks.updateStreamingMessage(data.content);
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
      data.section,
      data.html,
      data.phase
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
    chatLogger.debug('Message complete received', { 
      hasMetadata: !!data.metadata, 
      hasValuationResult: !!data.metadata?.valuation_result 
    });
    
    this.callbacks.updateStreamingMessage('', true);
    this.callbacks.setIsStreaming(false);
    
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
      sessionId: data.session_id 
    });
    
    this.callbacks.updateStreamingMessage('', true);
    this.callbacks.setIsStreaming(false);
    
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
   */
  private handleError(data: any): void {
    chatLogger.error('Stream error received', { 
      error: data.content,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
    
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
    
    this.callbacks.updateStreamingMessage(
      `I apologize, but ${userFriendlyError}`,
      true
    );
    this.callbacks.setIsStreaming(false);
  }

  /**
   * Handle data collected events
   */
  private handleDataCollected(data: any): void {
    chatLogger.info('Data collected event received', {
      field: data.field,
      value: data.value,
      completeness: data.completeness
    });
    
    // Enhanced logging for debugging
    console.log('Data collected:', {
      field: data.field,
      value: data.value,
      display_name: data.display_name,
      completeness: data.completeness
    });
    
    // Update local state
    this.callbacks.setCollectedData(prev => ({
      ...prev,
      [data.field]: data
    }));
    
    // Notify parent component
    this.callbacks.onDataCollected?.(data);
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
