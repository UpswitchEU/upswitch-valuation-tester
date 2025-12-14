/**
 * Valuation Handlers - Focused event handlers for valuation-related streaming events
 *
 * Single Responsibility: Handle valuation previews, options, ready states, and completion
 * Extracted from StreamEventHandler to follow SRP
 *
 * @module services/chat/handlers/valuation/ValuationHandlers
 */

import { chatLogger } from '../../../../utils/logger'
import { StreamEventHandlerCallbacks } from '../../StreamEventHandler'

export class ValuationHandlers {
  private callbacks: StreamEventHandlerCallbacks

  constructor(callbacks: StreamEventHandlerCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Handle valuation preview events
   */
  handleValuationPreview(data: any): void {
    chatLogger.info('Valuation preview received', {
      hasValue: !!data.value,
      value: data.value,
      metadataKeys: Object.keys(data),
    })

    this.callbacks.setValuationPreview(data)
    this.callbacks.onValuationPreview?.(data)
  }

  /**
   * Handle calculate option events
   */
  handleCalculateOption(data: any): void {
    chatLogger.info('Calculate option received', {
      hasParameters: !!data.parameters,
      parametersKeys: data.parameters ? Object.keys(data.parameters) : [],
      hasValue: !!data.estimatedValue,
      estimatedValue: data.estimatedValue,
    })

    this.callbacks.setCalculateOption(data)
    this.callbacks.onCalculateOptionAvailable?.(data)
  }

  /**
   * Handle valuation ready events
   */
  handleValuationReady(data: any): void {
    chatLogger.info('Valuation ready event received', {
      dataKeys: Object.keys(data),
    })

    // Valuation ready typically triggers UI updates to show calculation is ready
    // The actual CTA creation happens in message metadata
  }

  /**
   * Handle valuation confirmed events
   */
  handleValuationConfirmed(data: any): void {
    chatLogger.info('Valuation confirmed event received', {
      dataKeys: Object.keys(data),
    })

    // Valuation confirmed typically indicates user has accepted the valuation
    // This may trigger final report generation
  }

  /**
   * Handle valuation complete events
   */
  handleValuationComplete(data: any): void {
    chatLogger.info('Valuation completed', {
      hasResult: !!data.result,
      resultKeys: data.result ? Object.keys(data.result) : [],
      hasValuationId: !!data.valuation_id,
      valuationId: data.valuation_id,
    })

    // Track conversation completion with valuation
    this.callbacks.trackConversationCompletion?.(true, true)

    // Call valuation complete callback
    this.callbacks.onValuationComplete?.(data.result || data)
  }
}
