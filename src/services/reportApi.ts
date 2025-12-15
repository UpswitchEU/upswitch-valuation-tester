/**
 * Report API Service - Frontend client for report persistence
 *
 * Single Responsibility: Provide simplified interface for report persistence operations
 * Connects to Node.js backend via backendAPI
 *
 * @module services/reportApi
 */

import type { ValuationRequest, ValuationResponse } from '../types/valuation'
import { generalLogger } from '../utils/logger'
import { backendAPI } from './backendApi'

export interface ReportApiResponse {
  success: boolean
  data: unknown
}

/**
 * Report API Service
 *
 * Provides simplified interface for report persistence operations.
 * All operations are proxied through Node.js backend which handles:
 * - Authentication
 * - CORS
 * - Rate limiting
 * - Error handling
 * - Proxying to Python engine when needed
 */
export const reportApiService = {
  /**
   * Save partial data for a report (in-progress data)
   * Uses backendAPI.updateReport() to save partial data
   */
  async savePartialData(reportId: string, data: Partial<ValuationRequest>): Promise<void> {
    try {
      generalLogger.debug('Saving partial report data', { reportId, dataKeys: Object.keys(data) })
      await backendAPI.updateReport(reportId, data)
      generalLogger.debug('Partial data saved successfully', { reportId })
    } catch (error) {
      generalLogger.error('Failed to save partial data', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      // Don't throw - partial data save failures shouldn't block user
    }
  },

  /**
   * Get report by ID
   * Uses backendAPI.getReport() to fetch report from Node.js backend
   */
  async getReport(reportId: string): Promise<ReportApiResponse> {
    try {
      generalLogger.debug('Fetching report', { reportId })
      const report = await backendAPI.getReport(reportId)
      return { success: true, data: report }
    } catch (error) {
      generalLogger.error('Failed to get report', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return { success: false, data: null }
    }
  },

  /**
   * Update report data
   * Uses backendAPI.updateReport() to update report via Node.js backend
   */
  async updateReport(
    reportId: string,
    data: Partial<ValuationRequest>
  ): Promise<ReportApiResponse> {
    try {
      generalLogger.debug('Updating report', { reportId, dataKeys: Object.keys(data) })
      const updatedReport = await backendAPI.updateReport(reportId, data)
      return { success: true, data: updatedReport }
    } catch (error) {
      generalLogger.error('Failed to update report', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return { success: false, data: null }
    }
  },

  /**
   * Complete report - marks report as completed with final valuation result
   * Uses backendAPI.saveValuation() to save completed valuation to Node.js backend
   * This properly tracks credits and persists the final valuation result
   */
  async completeReport(reportId: string, valuationResult: ValuationResponse): Promise<void> {
    try {
      generalLogger.info('Completing report with valuation result', {
        reportId,
        valuationId: valuationResult.valuation_id,
      })

      // Use saveValuation which properly handles:
      // - Credit tracking
      // - Report persistence
      // - Session updates
      await backendAPI.saveValuation(valuationResult, reportId)

      generalLogger.info('Report completed successfully', { reportId })
    } catch (error) {
      generalLogger.error('Failed to complete report', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      // Don't throw - completion failure shouldn't block user from seeing results
      // Results are already displayed locally
    }
  },
}
