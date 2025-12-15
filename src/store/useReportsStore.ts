/**
 * Reports Store
 *
 * Single Responsibility: Manage report list state
 * Separation: Reports list separate from active session state (useValuationSessionStore)
 */

import { create } from 'zustand'
import { reportService } from '../services/reports'
import type { ValuationSession } from '../types/valuation'
import { createContextLogger } from '../utils/logger'

const reportsLogger = createContextLogger('ReportsStore')

export interface ReportsStore {
  // State
  reports: ValuationSession[]
  loading: boolean
  error: string | null

  // Actions
  fetchReports: (userId?: string) => Promise<void>
  addReport: (report: ValuationSession) => void
  updateReport: (reportId: string, updates: Partial<ValuationSession>) => void
  deleteReport: (reportId: string) => Promise<void>
  clearReports: () => void
}

export const useReportsStore = create<ReportsStore>((set, get) => ({
  // Initial state
  reports: [],
  loading: false,
  error: null,

  /**
   * Fetch recent reports for the current user/guest
   */
  fetchReports: async (userId?: string) => {
    set({ loading: true, error: null })

    try {
      reportsLogger.info('Fetching reports', {
        userId: userId ? userId.substring(0, 8) + '...' : 'guest',
      })

      const reports = await reportService.listRecentReports({
        userId,
        limit: 20,
        status: 'all',
      })

      set({ reports, loading: false })

      reportsLogger.info('Reports fetched successfully', {
        count: reports.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      set({ error: errorMessage, loading: false })

      reportsLogger.error('Failed to fetch reports', {
        error: errorMessage,
      })
    }
  },

  /**
   * Add new report to list (prepend - most recent first)
   */
  addReport: (report: ValuationSession) => {
    set((state) => ({
      reports: [report, ...state.reports],
    }))

    reportsLogger.info('Report added to list', {
      reportId: report.reportId,
      totalReports: get().reports.length,
    })
  },

  /**
   * Update existing report in list
   */
  updateReport: (reportId: string, updates: Partial<ValuationSession>) => {
    set((state) => ({
      reports: state.reports.map((r) => (r.reportId === reportId ? { ...r, ...updates } : r)),
    }))

    reportsLogger.info('Report updated in list', {
      reportId,
      updateFields: Object.keys(updates).length,
    })
  },

  /**
   * Delete report from backend and remove from list
   */
  deleteReport: async (reportId: string) => {
    try {
      reportsLogger.info('Deleting report', { reportId })

      // Delete from backend
      await reportService.deleteReport(reportId)

      // Remove from local state
      set((state) => ({
        reports: state.reports.filter((r) => r.reportId !== reportId),
      }))

      reportsLogger.info('Report deleted successfully', {
        reportId,
        remainingReports: get().reports.length,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      reportsLogger.error('Failed to delete report', {
        error: errorMessage,
        reportId,
      })

      throw error
    }
  },

  /**
   * Clear all reports from state
   */
  clearReports: () => {
    set({ reports: [], error: null })

    reportsLogger.info('Reports cleared from state')
  },
}))
