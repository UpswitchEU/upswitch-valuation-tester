/**
 * Report Service
 * 
 * Single Responsibility: Manage report lifecycle (CRUD operations)
 * Dependency Inversion: Depends on API abstraction
 */

import type { ValuationRequest, ValuationSession } from '../../types/valuation'
import { createContextLogger } from '../../utils/logger'
import { generateReportId } from '../../utils/reportIdGenerator'
import { backendAPI } from '../backendApi'

const reportLogger = createContextLogger('ReportService')

export interface ListReportsOptions {
  userId?: string
  limit?: number
  offset?: number
  status?: 'in_progress' | 'completed' | 'all'
}

export interface ListReportsResponse {
  sessions: ValuationSession[]
  total: number
  has_more: boolean
}

export interface ReportService {
  // List recent reports
  listRecentReports(options?: ListReportsOptions): Promise<ValuationSession[]>
  
  // Get full report by ID
  getReportById(reportId: string): Promise<ValuationSession>
  
  // Create new report
  createReport(initialData?: Partial<ValuationRequest>): Promise<ValuationSession>
  
  // Update report data
  updateReport(reportId: string, data: Partial<ValuationRequest>): Promise<void>
  
  // Delete report
  deleteReport(reportId: string): Promise<void>
  
  // Duplicate report
  duplicateReport(reportId: string): Promise<ValuationSession>
}

class ReportServiceImpl implements ReportService {
  /**
   * List recent reports for the current user/guest
   * Uses existing GET /api/reports endpoint
   */
  async listRecentReports(options: ListReportsOptions = {}): Promise<ValuationSession[]> {
    const { userId, limit = 20, offset = 0, status = 'all' } = options
    
    try {
      reportLogger.info('Fetching recent reports', { 
        userId: userId ? userId.substring(0, 8) + '...' : 'guest',
        limit,
        offset,
        status,
      })
      
      // Call existing backend endpoint: GET /api/reports
      // This endpoint requires auth currently, will return empty for guests until enhanced
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reports?limit=${limit}&offset=${offset}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - return empty array for now
          reportLogger.info('Not authenticated - returning empty reports list')
          return []
        }
        throw new Error(`Failed to fetch reports: ${response.statusText}`)
      }
      
      const json = await response.json()
      
      // Backend returns: { success: true, data: [...] }
      const reports = json.data || json.sessions || []
      
      // Transform backend reports to ValuationSession format
      const sessions: ValuationSession[] = reports.map((report: any) => {
        // Get valuation data if available
        const partialData = report.partial_data || {}
        const sessionData = report.valuation_data || {}
        
        return {
          sessionId: report.id, // Use report ID as session ID for now
          reportId: report.id,
          currentView: report.flow_type === 'ai-guided' ? 'conversational' : 'manual',
          dataSource: report.flow_type === 'ai-guided' ? 'conversational' : 'manual',
          createdAt: new Date(report.created_at),
          updatedAt: new Date(report.updated_at || report.created_at),
          completedAt: report.completed_at ? new Date(report.completed_at) : undefined,
          partialData,
          sessionData,
        } as ValuationSession
      })
      
      reportLogger.info('Reports fetched successfully', { 
        count: sessions.length,
      })
      
      return sessions
    } catch (error) {
      reportLogger.error('Failed to fetch recent reports', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      })
      // Return empty array instead of throwing - graceful degradation
      return []
    }
  }
  
  /**
   * Get full report by ID
   */
  async getReportById(reportId: string): Promise<ValuationSession> {
    try {
      reportLogger.info('Fetching report by ID', { reportId })
      
      const response = await backendAPI.getValuationSession(reportId)
      
      if (!response || !response.session) {
        throw new Error('Session not found')
      }
      
      const session = response.session
      
      reportLogger.info('Report fetched successfully', { 
        reportId,
        hasPartialData: !!session.partialData,
        hasResult: !!(session.sessionData as any)?.valuation_result,
      })
      
      return session
    } catch (error) {
      reportLogger.error('Failed to fetch report', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      })
      throw error
    }
  }
  
  /**
   * Create new report
   */
  async createReport(initialData?: Partial<ValuationRequest>): Promise<ValuationSession> {
    const reportId = generateReportId()
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    try {
      reportLogger.info('Creating new report', { 
        reportId,
        hasInitialData: !!initialData && Object.keys(initialData).length > 0,
      })
      
      // Create session object matching ValuationSession interface
      const newSession: ValuationSession = {
        sessionId,
        reportId,
        currentView: 'manual',
        dataSource: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
        partialData: initialData || {},
        sessionData: initialData || {},
      }
      
      const response = await backendAPI.createValuationSession(newSession)
      
      reportLogger.info('Report created successfully', { 
        reportId,
        sessionId: response.session.sessionId,
      })
      
      return response.session
    } catch (error) {
      reportLogger.error('Failed to create report', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      })
      throw error
    }
  }
  
  /**
   * Update report data
   */
  async updateReport(reportId: string, data: Partial<ValuationRequest>): Promise<void> {
    try {
      reportLogger.info('Updating report', { 
        reportId,
        fieldCount: Object.keys(data).length,
      })
      
      await backendAPI.updateValuationSession(reportId, {
        partialData: data,
        updatedAt: new Date(),
      } as Partial<ValuationSession>)
      
      reportLogger.info('Report updated successfully', { reportId })
    } catch (error) {
      reportLogger.error('Failed to update report', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      })
      throw error
    }
  }
  
  /**
   * Delete report
   * Uses existing DELETE /api/reports/:reportId endpoint
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      reportLogger.info('Deleting report', { reportId })
      
      // Call existing backend endpoint: DELETE /api/reports/:reportId
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reports/${reportId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          reportLogger.warn('Report not found (already deleted?)', { reportId })
          return // Gracefully handle already deleted
        }
        if (response.status === 403) {
          throw new Error('Not authorized to delete this report')
        }
        throw new Error(`Failed to delete report: ${response.statusText}`)
      }
      
      const json = await response.json()
      
      if (!json.success) {
        throw new Error(json.error || 'Failed to delete report')
      }
      
      reportLogger.info('Report deleted successfully', { reportId })
    } catch (error) {
      reportLogger.error('Failed to delete report', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      })
      throw error
    }
  }
  
  /**
   * Duplicate report (create a copy)
   */
  async duplicateReport(reportId: string): Promise<ValuationSession> {
    try {
      reportLogger.info('Duplicating report', { originalReportId: reportId })
      
      // Fetch original session
      const originalSession = await this.getReportById(reportId)
      
      // Create new report with copied data
      return await this.createReport(originalSession.partialData)
    } catch (error) {
      reportLogger.error('Failed to duplicate report', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      })
      throw error
    }
  }
}

// Export singleton instance
export const reportService = new ReportServiceImpl()
