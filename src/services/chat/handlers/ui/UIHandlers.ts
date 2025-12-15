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
   * Failproof: Validates inputs and handles edge cases
   */
  private mapConversationalFieldToSessionData(
    field: string,
    value: any,
    metadata?: any
  ): Partial<ValuationRequest> {
    // Failproof: Validate inputs
    if (!field || typeof field !== 'string') {
      chatLogger.warn('Invalid field name in mapConversationalFieldToSessionData', {
        field,
        fieldType: typeof field,
      })
      return {}
    }

    if (value === undefined || value === null) {
      chatLogger.debug('Skipping null/undefined value in field mapping', { field })
      return {}
    }

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

    // Failproof: Validate targetPath
    if (!targetPath || typeof targetPath !== 'string') {
      chatLogger.warn('Invalid targetPath in field mapping', {
        field,
        targetPath,
      })
      return {}
    }

    // Build nested update object
    const sessionUpdate: Partial<ValuationRequest> = {}
    
    if (targetPath.includes('.')) {
      const parts = targetPath.split('.')
      if (parts.length !== 2) {
        chatLogger.warn('Unexpected nested path format', {
          field,
          targetPath,
          partsCount: parts.length,
        })
        return {}
      }

      const [parent, child] = parts
      sessionUpdate[parent as keyof ValuationRequest] = {
        [child]: value,
      } as any
    } else {
      sessionUpdate[targetPath as keyof ValuationRequest] = value as any
    }

    // CRITICAL FIX: Handle business_type metadata to save business_type_id and industry
    // When backend confirms business type, it sends metadata with id, industry, etc.
    // We need to save ALL of this data to ensure valuation request is complete
    if (field === 'business_type' && metadata) {
      chatLogger.info('Saving business_type with metadata', {
        business_type: value,
        metadata: metadata,
        has_id: !!metadata.id,
        has_industry: !!metadata.industry,
      })

      // Save business_type_id if present (CRITICAL for backend validation)
      if (metadata.id) {
        sessionUpdate.business_type_id = metadata.id
        chatLogger.info('✅ Saved business_type_id from metadata', {
          business_type_id: metadata.id,
        })
      }

      // Save industry if present (auto-derived from business_type_id)
      if (metadata.industry || metadata.industry_mapping) {
        sessionUpdate.industry = metadata.industry || metadata.industry_mapping
        chatLogger.info('✅ Saved industry from metadata', {
          industry: sessionUpdate.industry,
        })
      }

      // Save category for reference (optional but helpful)
      if (metadata.category) {
        // Store in business_type field for backend compatibility
        sessionUpdate.business_type = value // Keep the display name
      }
    }

    return sessionUpdate
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
    // Failproof: Handle all edge cases gracefully
    try {
      const sessionStore = useValuationSessionStore.getState()
      const session = sessionStore.session
      
      // Validate session exists and has reportId
      if (!session?.reportId) {
        chatLogger.warn('Cannot auto-save: session or reportId missing', {
          field,
          hasSession: !!session,
          reportId: session?.reportId,
        })
        return
      }
      
      if (field && value !== undefined && value !== null) {
        // Map conversational field names to ValuationRequest structure
        const sessionDataUpdate = this.mapConversationalFieldToSessionData(
          field,
          value,
          collectedData.metadata
        )

        // Validate update object is not empty
        if (!sessionDataUpdate || Object.keys(sessionDataUpdate).length === 0) {
          chatLogger.warn('Skipping auto-save: empty sessionDataUpdate', {
            field,
            value,
          })
          return
        }

        // Auto-save to backend (debounced via updateSessionData)
        sessionStore.updateSessionData(sessionDataUpdate).catch((error) => {
          chatLogger.error('Failed to auto-save collected data', {
            field,
            reportId: session.reportId,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          })
          // Don't throw - non-blocking persistence
        })

        chatLogger.debug('Auto-saved collected data to session', {
          field,
          reportId: session.reportId,
          sessionDataKeys: Object.keys(sessionDataUpdate),
        })
      } else {
        chatLogger.debug('Skipping auto-save: invalid field or value', {
          field,
          hasValue: value !== undefined,
          valueType: typeof value,
        })
      }
    } catch (error) {
      // Failproof: Never let auto-save break the conversation flow
      chatLogger.error('Unexpected error in auto-save', {
        field,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      // Continue conversation flow - don't throw
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
