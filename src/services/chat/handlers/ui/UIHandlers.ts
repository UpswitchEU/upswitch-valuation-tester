/**
 * UI Handlers - Focused event handlers for UI-related streaming events
 *
 * Single Responsibility: Handle progress updates, data collection, suggestions, and HTML previews
 * Extracted from StreamEventHandler to follow SRP
 *
 * @module services/chat/handlers/ui/UIHandlers
 */

import { chatLogger } from '../../../../utils/logger'
import { StreamEventHandlerCallbacks } from '../../StreamEventHandler'
import { useValuationSessionStore } from '../../../../store/useValuationSessionStore'
import type { ValuationRequest } from '../../../../types/valuation'

export class UIHandlers {
  private callbacks: StreamEventHandlerCallbacks

  constructor(callbacks: StreamEventHandlerCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Map conversational field names to ValuationRequest structure
   * Handles nested fields (e.g., 'revenue' -> 'current_year_data.revenue')
   */
  private mapConversationalFieldToSessionData(
    field: string,
    value: any,
    metadata?: any
  ): Partial<ValuationRequest> {
    // Field mapping from conversational names to ValuationRequest structure
    const fieldMap: Record<string, string> = {
      'company_name': 'company_name',
      'business_type': 'business_type',
      'business_type_id': 'business_type_id',
      'country_code': 'country_code',
      'founding_year': 'founding_year',
      'revenue': 'current_year_data.revenue',
      'ebitda': 'current_year_data.ebitda',
      'number_of_employees': 'number_of_employees',
      'number_of_owners': 'number_of_owners',
      'shares_for_sale': 'shares_for_sale',
      'industry': 'industry',
      'business_model': 'business_model',
      'recurring_revenue_percentage': 'recurring_revenue_percentage',
      'total_assets': 'current_year_data.total_assets',
      'total_debt': 'current_year_data.total_debt',
      'cash': 'current_year_data.cash',
    }

    const targetPath = fieldMap[field] || field

    // Build nested update object
    if (targetPath.includes('.')) {
      const [parent, child] = targetPath.split('.')
      return {
        [parent]: {
          [child]: value,
        },
      } as any
    }

    return { [targetPath]: value } as any
  }

  /**
   * Handle progress update events
   */
  handleProgressUpdate(data: any): void {
    chatLogger.debug('Progress update received', {
      progress: data.progress,
      message: data.message,
      step: data.step,
    })

    this.callbacks.onProgressUpdate?.(data)
  }

  /**
   * Handle progress summary events
   */
  handleProgressSummary(data: any): void {
    chatLogger.info('Progress summary received', {
      summary: data.summary,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps,
      dataKeys: Object.keys(data),
    })

    // Progress summary typically contains overall progress information
    this.callbacks.onProgressUpdate?.(data)
  }

  /**
   * Handle data collected events
   */
  handleDataCollected(data: any): void {
    const collectedData = data.data || data.collected_data || data
    const field = collectedData.field || collectedData.field_name || collectedData.key
    const value = collectedData.value
    const source = collectedData.source || 'backend'

    chatLogger.info('Data collected', {
      field,
      hasValue: value !== undefined,
      source,
      dataKeys: Object.keys(collectedData),
    })

    // Update collected data state
    this.callbacks.setCollectedData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // CRITICAL: Auto-save collected data to session store
    const sessionStore = useValuationSessionStore.getState()
    
    if (field && value !== undefined) {
      // Map conversational field names to ValuationRequest structure
      const sessionDataUpdate = this.mapConversationalFieldToSessionData(
        field,
        value,
        collectedData.metadata
      )

      // Auto-save to backend (debounced via updateSessionData)
      sessionStore.updateSessionData(sessionDataUpdate).catch((error) => {
        chatLogger.error('Failed to auto-save collected data', {
          field,
          error: error instanceof Error ? error.message : String(error),
        })
      })

      chatLogger.debug('Auto-saved collected data to session', {
        field,
        sessionDataKeys: Object.keys(sessionDataUpdate),
      })
    }

    // Call data collected callback
    this.callbacks.onDataCollected?.(collectedData)
  }

  /**
   * Handle suggestion offered events
   */
  handleSuggestionOffered(data: any): void {
    const suggestions = data.suggestions || data.options || []
    const field = data.field || data.for_field

    chatLogger.info('Suggestions offered', {
      field,
      suggestionCount: suggestions.length,
      suggestions: suggestions.slice(0, 3), // Log first 3 suggestions
    })

    // Add suggestion message to chat
    this.callbacks.addMessage({
      type: 'suggestion',
      content: data.message || data.content || 'Here are some suggestions:',
      metadata: {
        suggestions,
        originalValue: data.original_value,
        field,
      },
      isComplete: true,
    })
  }

  /**
   * Handle clarification needed events
   */
  handleClarificationNeeded(data: any): void {
    const field = data.field || data.clarification_field
    const message = data.message || data.content || 'Please provide more information.'
    const options = data.options || data.suggestions || []
    const inputType = data.input_type || 'text'

    chatLogger.info('Clarification needed', {
      field,
      inputType,
      hasOptions: options.length > 0,
      optionCount: options.length,
      messageLength: message.length,
    })

    // Add clarification message to chat
    this.callbacks.addMessage({
      type: 'ai',
      content: message,
      metadata: {
        needs_confirmation: true,
        clarification_field: field,
        collected_field: field,
        input_type: inputType,
        suggestions: options, // Store as 'suggestions' for consistency with backend and MessageItem
        options, // Keep for backward compatibility
        clarification_message: message,
      },
      isComplete: true,
    })
  }

  /**
   * Handle HTML preview events
   */
  handleHtmlPreview(data: any): void {
    const html = data.html || data.content || ''
    const previewType = data.preview_type || data.type || 'progressive'

    chatLogger.info('HTML preview received', {
      previewType,
      htmlLength: html.length,
      hasHtml: !!html,
    })

    this.callbacks.onHtmlPreviewUpdate?.(html, previewType)
  }

  /**
   * Handle error events
   */
  handleError(data: any): void {
    const errorMessage =
      data.message || data.content || data.error || 'An unexpected error occurred'
    const errorType = data.error_type || data.type || 'unknown'
    const isRetryable = data.retryable !== false

    chatLogger.error('Streaming error received', {
      errorType,
      errorMessage: errorMessage.substring(0, 100),
      isRetryable,
      dataKeys: Object.keys(data),
    })

    // Add error message to chat
    this.callbacks.addMessage({
      type: 'system',
      content: `Error: ${errorMessage}${isRetryable ? ' Please try again.' : ''}`,
      isComplete: true,
    })

    // Hide streaming indicators on error
    this.callbacks.setIsStreaming(false)
    this.callbacks.setIsTyping?.(false)
    this.callbacks.setIsThinking?.(false)

    // Track error in model performance if metrics are available
    if (data.metrics) {
      this.callbacks.trackModelPerformance?.({
        ...data.metrics,
        error_occurred: true,
        error_type: errorType,
      })
    }

    // Track conversation completion as failed
    this.callbacks.trackConversationCompletion?.(false, false)
  }
}
