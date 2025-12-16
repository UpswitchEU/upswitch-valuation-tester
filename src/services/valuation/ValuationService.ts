/**
 * Valuation Service
 *
 * Shared service for valuation calculations across Manual and Conversational flows.
 * Provides a single, consistent API for valuation operations.
 *
 * Key Features:
 * - Calculate valuations via backend API
 * - Unified error handling
 * - Logging and diagnostics
 * - Type-safe request/response handling
 *
 * Used by:
 * - Manual Flow (useManualResultsStore)
 * - Conversational Flow (useConversationalResultsStore)
 *
 * @module services/valuation/ValuationService
 */

import { backendAPI } from '../backendApi'
import type { ValuationRequest, ValuationResponse } from '../../types/valuation'
import { createContextLogger } from '../../utils/logger'
import { convertToApplicationError, getErrorMessage } from '../../utils/errors/errorConverter'
import {
  isNetworkError,
  isValidationError,
  isRetryable as isRetryableError,
} from '../../utils/errors/errorGuards'

const logger = createContextLogger('ValuationService')

/**
 * ValuationService - Shared valuation calculation
 *
 * Singleton service for consistent valuation operations across all flows.
 */
export class ValuationService {
  private static instance: ValuationService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ValuationService {
    if (!ValuationService.instance) {
      ValuationService.instance = new ValuationService()
    }
    return ValuationService.instance
  }

  /**
   * Calculate valuation
   *
   * Calls backend API to calculate valuation based on provided data.
   * Handles errors and provides detailed logging.
   *
   * @param request - Valuation request data
   * @returns Valuation response with results and HTML reports
   * @throws ApplicationError on failure
   */
  async calculateValuation(request: ValuationRequest): Promise<ValuationResponse> {
    const startTime = performance.now()

    try {
      logger.info('Calculating valuation', {
        companyName: request.company_name,
        industry: request.industry,
        businessModel: request.business_model,
      })

      // Call backend API
      const response = await backendAPI.calculateValuation(request)

      const duration = performance.now() - startTime

      logger.info('Valuation calculated successfully', {
        valuationId: response.valuation_id,
        duration_ms: duration.toFixed(2),
        hasHtmlReport: !!response.html_report,
        hasInfoTabHtml: !!response.info_tab_html,
      })

      // Validate response has required fields
      if (!response.html_report) {
        logger.warn('Valuation response missing html_report', {
          valuationId: response.valuation_id,
          responseKeys: Object.keys(response),
        })
      }

      if (!response.info_tab_html) {
        logger.warn('Valuation response missing info_tab_html', {
          valuationId: response.valuation_id,
          responseKeys: Object.keys(response),
        })
      }

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, {
        companyName: request.company_name,
        industry: request.industry,
      })

      // Log with specific error type
      if (isValidationError(appError)) {
        logger.error('Valuation calculation failed - validation error', {
          error: getErrorMessage(appError),
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          context: (appError as any).context,
        })
      } else if (isNetworkError(appError)) {
        logger.error('Valuation calculation failed - network error', {
          error: getErrorMessage(appError),
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          context: (appError as any).context,
        })
      } else if (isRetryableError(appError)) {
        logger.warn('Valuation calculation failed - retryable error', {
          error: getErrorMessage(appError),
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          context: (appError as any).context,
        })
      } else {
        logger.error('Valuation calculation failed', {
          error: getErrorMessage(appError),
          code: (appError as any).code,
          duration_ms: duration.toFixed(2),
          context: (appError as any).context,
        })
      }

      throw appError
    }
  }
}

// Export singleton instance
export const valuationService = ValuationService.getInstance()

