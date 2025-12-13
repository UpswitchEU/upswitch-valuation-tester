/**
 * UI Handlers - Focused event handlers for UI-related streaming events
 *
 * Single Responsibility: Handle progress updates, data collection, suggestions, and HTML previews
 * Extracted from StreamEventHandler to follow SRP
 *
 * @module services/chat/handlers/ui/UIHandlers
 */

import { chatLogger } from '../../../../utils/logger';
import { StreamEventHandlerCallbacks } from '../../StreamEventHandler';

export class UIHandlers {
  private callbacks: StreamEventHandlerCallbacks;

  constructor(callbacks: StreamEventHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Handle progress update events
   */
  handleProgressUpdate(data: any): void {
    chatLogger.debug('Progress update received', {
      progress: data.progress,
      message: data.message,
      step: data.step
    });

    this.callbacks.onProgressUpdate?.(data);
  }

  /**
   * Handle progress summary events
   */
  handleProgressSummary(data: any): void {
    chatLogger.info('Progress summary received', {
      summary: data.summary,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps,
      dataKeys: Object.keys(data)
    });

    // Progress summary typically contains overall progress information
    this.callbacks.onProgressUpdate?.(data);
  }

  /**
   * Handle data collected events
   */
  handleDataCollected(data: any): void {
    const collectedData = data.data || data.collected_data || data;
    const field = collectedData.field || collectedData.key;
    const value = collectedData.value;
    const source = collectedData.source || 'backend';

    chatLogger.info('Data collected', {
      field,
      hasValue: value !== undefined,
      source,
      dataKeys: Object.keys(collectedData)
    });

    // Update collected data state
    this.callbacks.setCollectedData(prev => ({
      ...prev,
      [field]: value
    }));

    // Call data collected callback
    this.callbacks.onDataCollected?.(collectedData);
  }

  /**
   * Handle suggestion offered events
   */
  handleSuggestionOffered(data: any): void {
    const suggestions = data.suggestions || data.options || [];
    const field = data.field || data.for_field;

    chatLogger.info('Suggestions offered', {
      field,
      suggestionCount: suggestions.length,
      suggestions: suggestions.slice(0, 3) // Log first 3 suggestions
    });

    // Add suggestion message to chat
    this.callbacks.addMessage({
      type: 'suggestion',
      content: data.message || data.content || 'Here are some suggestions:',
      metadata: {
        suggestions,
        originalValue: data.original_value,
        field
      },
      isComplete: true
    });
  }

  /**
   * Handle clarification needed events
   */
  handleClarificationNeeded(data: any): void {
    const field = data.field || data.clarification_field;
    const message = data.message || data.content || 'Please provide more information.';
    const options = data.options || data.suggestions || [];
    const inputType = data.input_type || 'text';

    chatLogger.info('Clarification needed', {
      field,
      inputType,
      hasOptions: options.length > 0,
      optionCount: options.length,
      messageLength: message.length
    });

    // Add clarification message to chat
    this.callbacks.addMessage({
      type: 'ai',
      content: message,
      metadata: {
        needs_confirmation: true,
        clarification_field: field,
        collected_field: field,
        input_type: inputType,
        options,
        clarification_message: message
      },
      isComplete: true
    });
  }

  /**
   * Handle HTML preview events
   */
  handleHtmlPreview(data: any): void {
    const html = data.html || data.content || '';
    const previewType = data.preview_type || data.type || 'progressive';

    chatLogger.info('HTML preview received', {
      previewType,
      htmlLength: html.length,
      hasHtml: !!html
    });

    this.callbacks.onHtmlPreviewUpdate?.(html, previewType);
  }

  /**
   * Handle error events
   */
  handleError(data: any): void {
    const errorMessage = data.message || data.content || data.error || 'An unexpected error occurred';
    const errorType = data.error_type || data.type || 'unknown';
    const isRetryable = data.retryable !== false;

    chatLogger.error('Streaming error received', {
      errorType,
      errorMessage: errorMessage.substring(0, 100),
      isRetryable,
      dataKeys: Object.keys(data)
    });

    // Add error message to chat
    this.callbacks.addMessage({
      type: 'system',
      content: `Error: ${errorMessage}${isRetryable ? ' Please try again.' : ''}`,
      isComplete: true
    });

    // Hide streaming indicators on error
    this.callbacks.setIsStreaming(false);
    this.callbacks.setIsTyping?.(false);
    this.callbacks.setIsThinking?.(false);

    // Track error in model performance if metrics are available
    if (data.metrics) {
      this.callbacks.trackModelPerformance?.({
        ...data.metrics,
        error_occurred: true,
        error_type: errorType
      });
    }

    // Track conversation completion as failed
    this.callbacks.trackConversationCompletion?.(false, false);
  }
}
