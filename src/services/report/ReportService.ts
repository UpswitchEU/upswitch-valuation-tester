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

import { backendAPI } from '../backendApi'
import type { ValuationResponse } from '../../types/valuation'
import { createContextLogger } from '../../utils/logger'
import { convertToApplicationError, getErrorMessage } from '../../utils/errors/errorConverter'

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
   * Save report assets
   *
   * Saves all report-related data:
   * - Valuation result object
   * - HTML report (main)
   * - Info tab HTML
   *
   * @param reportId - Report identifier
   * @param assets - Report assets to save
   */
  async saveReportAssets(
    reportId: string,
    assets: {
      valuationResult?: ValuationResponse
      htmlReport?: string
      infoTabHtml?: string
    }
  ): Promise<void> {
    const startTime = performance.now()

    try {
      logger.info('Saving report assets', {
        reportId,
        hasResult: !!assets.valuationResult,
        hasHtmlReport: !!assets.htmlReport,
        hasInfoTab: !!assets.infoTabHtml,
        htmlLength: assets.htmlReport?.length || 0,
        infoLength: assets.infoTabHtml?.length || 0,
      })

      // Import SessionAPI dynamically to avoid circular dependencies
      const { SessionAPI } = await import('../api/session/SessionAPI')
      const sessionAPI = new SessionAPI()

      // Save to backend
      await sessionAPI.saveValuationResult(reportId, {
        valuationResult: assets.valuationResult,
        htmlReport: assets.htmlReport,
        infoTabHtml: assets.infoTabHtml,
      })

      const duration = performance.now() - startTime

      logger.info('Report assets saved successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to save report assets', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      throw appError
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

      // Mark report as complete (tracks credit usage)
      await reportAPI.completeReport(reportId)

      const duration = performance.now() - startTime

      logger.info('Report completed successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, sessionId })

      logger.error('Failed to complete report', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      // Don't throw - completing report is not critical for user experience
      // The valuation is already saved, credit tracking can be retried later
      logger.warn('Report completion failed but valuation is saved', {
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
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to get report', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }
}

// Export singleton instance
export const reportService = ReportService.getInstance()

