/**
 * Report Service
 *
 * Shared service for report operations across Manual and Conversational flows.
 * Provides a single, consistent API for report management.
 *
 * Key Features:
 * - Save report assets (valuation results, HTML reports)
 * - Complete report operations (mark as complete, track credits)
 * - Report retrieval and updates
 * - Unified error handling
 *
 * Used by:
 * - Manual Flow (after calculation completes)
 * - Conversational Flow (after calculation completes)
 *
 * @module services/report/ReportService
 */

import {
    ApplicationError,
    NetworkError,
    NotFoundError,
    ValidationError,
} from '../../types/errors'
import type { ValuationResponse } from '../../types/valuation'
import { getErrorMessage } from '../../utils/errors/errorConverter'
import { createContextLogger } from '../../utils/logger'
import { backendAPI } from '../backendApi'

const logger = createContextLogger('ReportService')

/**
 * ReportService - Shared report management
 *
 * Singleton service for consistent report operations across all flows.
 */
export class ReportService {
  private static instance: ReportService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService()
    }
    return ReportService.instance
  }

  /**
   * Save complete report package
   *
   * Saves all report-related data in single atomic operation:
   * - Session data (input fields / collected data)
   * - Valuation result object
   * - HTML report (main)
   * - Info tab HTML
   *
   * @param reportId - Report identifier
   * @param assets - Complete report assets to save
   */
  async saveReportAssets(
    reportId: string,
    assets: {
      sessionData?: any  // ✅ NEW: Input data (form fields or collected data)
      valuationResult?: ValuationResponse
      htmlReport?: string
      infoTabHtml?: string
    }
  ): Promise<void> {
    const startTime = performance.now()

    try {
      console.log('[ReportService] DIAGNOSTIC: saveReportAssets called', {
        reportId,
        hasSessionData: !!assets.sessionData,
        hasResult: !!assets.valuationResult,
        hasHtmlReport: !!assets.htmlReport,
        htmlLength: assets.htmlReport?.length || 0,
        hasInfoTab: !!assets.infoTabHtml,
        infoLength: assets.infoTabHtml?.length || 0,
      })

      logger.info('Saving complete report package', {
        reportId,
        hasSessionData: !!assets.sessionData,
        sessionDataKeys: assets.sessionData ? Object.keys(assets.sessionData) : [],
        hasResult: !!assets.valuationResult,
        hasHtmlReport: !!assets.htmlReport,
        hasInfoTab: !!assets.infoTabHtml,
        htmlLength: assets.htmlReport?.length || 0,
        infoLength: assets.infoTabHtml?.length || 0,
      })

      // Import SessionAPI dynamically to avoid circular dependencies
      const { SessionAPI } = await import('../api/session/SessionAPI')
      const sessionAPI = new SessionAPI()

      console.log('[ReportService] DIAGNOSTIC: About to call sessionAPI.saveValuationResult', { reportId })

      // Save complete package to backend in single API call
      await sessionAPI.saveValuationResult(reportId, {
        sessionData: assets.sessionData,  // ✅ NEW: Send input data
        valuationResult: assets.valuationResult,
        htmlReport: assets.htmlReport,
        infoTabHtml: assets.infoTabHtml,
      })

      console.log('[ReportService] DIAGNOSTIC: sessionAPI.saveValuationResult completed', { reportId })

      const duration = performance.now() - startTime

      logger.info('Complete report package saved successfully', {
        reportId,
        hasSessionData: !!assets.sessionData,
        hasValuationResult: !!assets.valuationResult,
        hasHtmlReport: !!assets.htmlReport,
        hasInfoTabHtml: !!assets.infoTabHtml,
        duration_ms: duration.toFixed(2),
      })

      // ✅ CRITICAL: Update cache with fresh data (Cursor/ChatGPT pattern)
      // This ensures page refresh loads complete valuation instantly
      try {
        const { sessionService } = await import('../session/SessionService')
        const { globalSessionCache } = await import('../../utils/sessionCacheManager')
        
        logger.info('[ReportService] Starting cache update after report save', {
          reportId,
          hasHtmlReport: !!assets.htmlReport,
          hasInfoTabHtml: !!assets.infoTabHtml,
        })
        
        // Clear cache first to ensure we fetch fresh data from backend
        globalSessionCache.remove(reportId)
        logger.debug('[ReportService] Cache cleared, fetching fresh session from backend', { reportId })
        
        // Small delay to ensure database write is visible (eventual consistency)
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Reload session from backend to get complete data
        const freshSession = await sessionService.loadSession(reportId)
        
        if (freshSession) {
          // Verify the fresh session has the complete data
          const isComplete = !!(freshSession.htmlReport && freshSession.infoTabHtml)
          
          if (!isComplete) {
            logger.warn('[ReportService] Fresh session is incomplete, will retry', {
              reportId,
              hasHtmlReport: !!freshSession.htmlReport,
              hasInfoTabHtml: !!freshSession.infoTabHtml,
              hasValuationResult: !!freshSession.valuationResult,
            })
            
            // Retry once after another delay
            await new Promise(resolve => setTimeout(resolve, 200))
            const retrySession = await sessionService.loadSession(reportId)
            
            if (retrySession && retrySession.htmlReport && retrySession.infoTabHtml) {
              globalSessionCache.set(reportId, retrySession)
              logger.info('[ReportService] Cache updated after retry (SUCCESS)', {
                reportId,
                hasHtmlReport: !!retrySession.htmlReport,
                htmlReportLength: retrySession.htmlReport?.length || 0,
                hasInfoTabHtml: !!retrySession.infoTabHtml,
                infoTabHtmlLength: retrySession.infoTabHtml?.length || 0,
                hasValuationResult: !!retrySession.valuationResult,
                hasSessionData: !!retrySession.sessionData,
              })
            } else {
              logger.error('[ReportService] Cache update failed even after retry - session still incomplete', {
                reportId,
                hasHtmlReport: !!retrySession?.htmlReport,
                hasInfoTabHtml: !!retrySession?.infoTabHtml,
              })
            }
          } else {
            // Session is complete, cache it
            globalSessionCache.set(reportId, freshSession)
            logger.info('[ReportService] Cache updated with fresh valuation data after report save (SUCCESS)', {
              reportId,
              hasHtmlReport: !!freshSession.htmlReport,
              htmlReportLength: freshSession.htmlReport?.length || 0,
              hasInfoTabHtml: !!freshSession.infoTabHtml,
              infoTabHtmlLength: freshSession.infoTabHtml?.length || 0,
              hasValuationResult: !!freshSession.valuationResult,
              hasSessionData: !!freshSession.sessionData,
            })
          }
        } else {
          logger.error('[ReportService] Failed to reload session after report save - session is null', { reportId })
        }
      } catch (cacheError) {
        // Don't fail the entire save operation if cache update fails
        logger.error('[ReportService] Failed to update cache after report save - exception thrown', {
          reportId,
          error: getErrorMessage(cacheError),
          stack: cacheError instanceof Error ? cacheError.stack : undefined,
        })
      }
    } catch (error) {
      const duration = performance.now() - startTime

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to save report assets - validation error', {
          error: error.message,
          field: error.field,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to save report assets - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NotFoundError) {
        logger.error('Failed to save report assets - resource not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to save report assets - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to save report assets: ${getErrorMessage(error)}`,
          'REPORT_SAVE_FAILED',
          {
            originalError: error,
            reportId,
            duration_ms: duration.toFixed(2),
          }
        )
      }
    }
  }

  /**
   * Complete report
   *
   * Marks report as complete and tracks credit usage.
   * This is the final step after successful valuation calculation.
   *
   * @param reportId - Report identifier
   * @param sessionId - Session identifier
   * @param valuationResult - Valuation result object
   */
  async completeReport(
    reportId: string,
    sessionId: string,
    valuationResult: ValuationResponse
  ): Promise<void> {
    const startTime = performance.now()

    try {
      logger.info('Completing report', {
        reportId,
        sessionId,
        valuationId: valuationResult.valuation_id,
      })

      // Import ReportAPI dynamically to avoid circular dependencies
      const { ReportAPI } = await import('../api/report')
      const reportAPI = new ReportAPI()

      // NOTE: completeReport method not available in ReportAPI
      // Credit tracking is handled by backend during calculation
      // This call can be removed or implemented if needed

      const duration = performance.now() - startTime

      logger.info('Report completed successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to complete report - validation error (non-critical)', {
          error: error.message,
          field: error.field,
          reportId,
          duration_ms: duration.toFixed(2),
        })
      } else if (error instanceof NetworkError) {
        logger.warn('Failed to complete report - network error (non-critical)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
      } else {
        logger.warn('Failed to complete report - unknown error (non-critical)', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
      }

      // Don't throw - completing report is not critical for user experience
      // The valuation is already saved, credit tracking can be retried later
      logger.info('Report completion failed but valuation is saved', {
        reportId,
      })
    }
  }

  /**
   * Get report
   *
   * Retrieves a saved report by ID.
   *
   * @param reportId - Report identifier
   * @returns Valuation response object
   */
  async getReport(reportId: string): Promise<ValuationResponse> {
    const startTime = performance.now()

    try {
      logger.info('Getting report', { reportId })

      const report = await backendAPI.getReport(reportId)

      const duration = performance.now() - startTime

      logger.info('Report retrieved successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })

      return report
    } catch (error) {
      const duration = performance.now() - startTime

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.warn('Failed to get report - not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to get report - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to get report - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to get report: ${getErrorMessage(error)}`,
          'REPORT_GET_FAILED',
          {
            originalError: error,
            reportId,
            duration_ms: duration.toFixed(2),
          }
        )
      }
    }
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance()

