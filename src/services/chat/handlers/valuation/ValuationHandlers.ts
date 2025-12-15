/**
 * Valuation Handlers - Focused event handlers for valuation-related streaming events
 *
 * Single Responsibility: Handle valuation previews, options, ready states, and completion
 * Extracted from StreamEventHandler to follow SRP
 *
 * @module services/chat/handlers/valuation/ValuationHandlers
 */

import { chatLogger } from '../../../../utils/logger'
import { useValuationResultsStore } from '../../../../store/useValuationResultsStore'
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
    const result = data.result || data
    const valuationId = data.valuation_id || result?.valuation_id
    
    chatLogger.info('Valuation completed', {
      hasResult: !!result,
      resultKeys: result ? Object.keys(result) : [],
      hasValuationId: !!valuationId,
      valuationId,
      hasHtmlReport: !!(result?.html_report || data.html_report),
      htmlReportLength: (result?.html_report || data.html_report)?.length || 0,
      hasInfoTabHtml: !!(result?.info_tab_html || data.info_tab_html),
      infoTabHtmlLength: (result?.info_tab_html || data.info_tab_html)?.length || 0,
    })

    // CRITICAL: Update valuation results store with complete result including HTML reports
    if (result || valuationId) {
      const resultsStore = useValuationResultsStore.getState()
      
      // Merge html_report and info_tab_html from data if they exist separately
      const completeResult = {
        ...result,
        ...(data.html_report && { html_report: data.html_report }),
        ...(data.info_tab_html && { info_tab_html: data.info_tab_html }),
        ...(valuationId && { valuation_id: valuationId }),
      }
      
      resultsStore.setResult(completeResult)
      
      chatLogger.info('Valuation result stored in results store', {
        valuationId,
        hasHtmlReport: !!completeResult.html_report,
        htmlReportLength: completeResult.html_report?.length || 0,
        hasInfoTabHtml: !!completeResult.info_tab_html,
        infoTabHtmlLength: completeResult.info_tab_html?.length || 0,
      })
    }

    // Track conversation completion with valuation
    this.callbacks.trackConversationCompletion?.(true, true)

    // Call valuation complete callback
    this.callbacks.onValuationComplete?.(result || data)
  }
}
