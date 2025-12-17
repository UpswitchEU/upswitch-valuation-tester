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

import {
  ApplicationError,
  CalculationError,
  NetworkError,
  NotFoundError,
  ValidationError,
} from '../../types/errors'
import type { ValuationRequest, ValuationResponse } from '../../types/valuation'
import { getErrorMessage } from '../../utils/errors/errorConverter'
import { createContextLogger } from '../../utils/logger'
import { backendAPI } from '../backendApi'

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
   * @param progressCallback - Optional callback for progress updates (0-100)
   * @returns Valuation response with results and HTML reports
   * @throws ApplicationError on failure
   */
  async calculateValuation(
    request: ValuationRequest,
    progressCallback?: (progress: number, message?: string) => void
  ): Promise<ValuationResponse> {
    const startTime = performance.now()

    try {
      logger.info('Calculating valuation', {
        companyName: request.company_name,
        industry: request.industry,
        businessModel: request.business_model,
      })

      // Progress: Starting calculation
      progressCallback?.(10, 'Starting calculation...')

      // Call backend API
      const response = await backendAPI.calculateValuation(request)

      // Progress: Calculation complete
      progressCallback?.(90, 'Processing results...')

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

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Valuation calculation failed - validation error', {
          error: error.message,
          field: error.field,
          code: error.code,
          duration_ms: duration.toFixed(2),
          context: error.context,
        })
        throw error // Re-throw with context
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Valuation calculation failed - network error (retryable)', {
          error: error.message,
          code: error.code,
          duration_ms: duration.toFixed(2),
          context: error.context,
        })
        // TODO: Implement retry logic with exponential backoff
        throw error
      } else if (error instanceof CalculationError) {
        logger.error('Valuation calculation failed - calculation error', {
          error: error.message,
          reportId: error.reportId,
          code: error.code,
          duration_ms: duration.toFixed(2),
          context: error.context,
          companyName: request.company_name,
        })
        throw error
      } else if (error instanceof NotFoundError) {
        logger.error('Valuation calculation failed - resource not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          code: error.code,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        // Handle unknown errors
        logger.error('Valuation calculation failed - unknown error', {
          error: getErrorMessage(error),
          duration_ms: duration.toFixed(2),
          companyName: request.company_name,
        })
        throw new ApplicationError(
          `Valuation calculation failed: ${getErrorMessage(error)}`,
          'VALUATION_CALCULATION_FAILED',
          {
            originalError: error,
            companyName: request.company_name,
            duration_ms: duration.toFixed(2),
          }
        )
      }
    }
  }
}

// Export singleton instance
export const valuationService = ValuationService.getInstance()
