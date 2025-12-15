/**
 * Session API Service
 *
 * Single Responsibility: Handle all valuation session lifecycle operations
 * Extracted from BackendAPI to follow SRP
 *
 * @module services/api/session/SessionAPI
 */

import { CreateValuationSessionRequest, UpdateValuationSessionRequest } from '../../../types/api'
import type {
  CreateValuationSessionResponse,
  SwitchViewResponse,
  UpdateValuationSessionResponse,
  ValuationSessionResponse,
} from '../../../types/api-responses'
import { APIError, AuthenticationError } from '../../../types/errors'
import { convertToApplicationError } from '../../../utils/errors/errorConverter'
import {
  isNetworkError,
  isSessionConflictError,
  isValidationError,
} from '../../../utils/errors/errorGuards'
import { apiLogger } from '../../../utils/logger'
import { APIRequestConfig, HttpClient } from '../HttpClient'

export class SessionAPI extends HttpClient {
  /**
   * Get valuation session data
   */
  async getValuationSession(
    reportId: string,
    options?: APIRequestConfig
  ): Promise<ValuationSessionResponse | null> {
    try {
      // Backend returns { success: true, data: {...} }
      const response = await this.executeRequest<{ success: boolean; data: any }>(
        {
          method: 'GET',
          url: `/api/valuation-sessions/${reportId}`,
          headers: {},
        } as any,
        options
      )

      // Transform backend format { success, data } to frontend format { success, session }
      if (!response?.data) {
        apiLogger.debug('Session not found', { reportId })
        return null
      }

      const sessionData = response.data

      // Map backend 'ai-guided' to frontend 'conversational'
      if ((sessionData.currentView as string) === 'ai-guided') {
        sessionData.currentView = 'conversational'
      }
      // Map dataSource: 'ai-guided' → 'conversational'
      if (sessionData.dataSource === 'ai-guided') {
        sessionData.dataSource = 'conversational'
      }

      // Return in expected format
      return {
        success: response.success,
        session: sessionData,
      }
    } catch (error) {
      const axiosError = error as any
      // Handle 404 gracefully - session doesn't exist yet
      if (axiosError?.response?.status === 404) {
        apiLogger.debug('Session does not exist yet', { reportId })
        return null
      }
      this.handleSessionError(error, 'get session')
    }
  }

  /**
   * Create new valuation session
   *
   * Handles both CreateValuationSessionRequest and ValuationSession types.
   * Maps frontend 'conversational' to backend 'ai-guided' for both currentView and dataSource.
   */
  async createValuationSession(
    session: CreateValuationSessionRequest | any,
    options?: APIRequestConfig
  ): Promise<CreateValuationSessionResponse> {
    try {
      // Handle both CreateValuationSessionRequest and ValuationSession types
      const sessionAny = session as any

      // Map frontend 'conversational' to backend 'ai-guided'
      const mappedCurrentView =
        session.currentView === 'conversational' ? 'ai-guided' : session.currentView

      // Map dataSource: 'conversational' → 'ai-guided'
      // If dataSource exists, map it; otherwise derive from currentView
      const mappedDataSource =
        sessionAny.dataSource === 'conversational'
          ? 'ai-guided'
          : sessionAny.dataSource ||
            (session.currentView === 'conversational' ? 'ai-guided' : 'manual')

      const backendSession = {
        // Include sessionId if present (required by backend)
        ...(sessionAny.sessionId && { sessionId: sessionAny.sessionId }),
        reportId: session.reportId,
        currentView: mappedCurrentView,
        dataSource: mappedDataSource,
        // Include sessionData and partialData if present
        ...(sessionAny.sessionData && { sessionData: sessionAny.sessionData }),
        ...(sessionAny.partialData && { partialData: sessionAny.partialData }),
      }

      // Backend endpoint: /api/valuation-sessions (POST)
      const response = await this.executeRequest<{ success: boolean; data: any }>(
        {
          method: 'POST',
          url: '/api/valuation-sessions',
          data: backendSession,
          headers: {},
        } as any,
        options
      )

      // Backend returns { success: true, data: {...} }
      // Transform to { success: true, session: {...}, sessionId, reportId }
      const sessionData = response.data

      // CRITICAL: Validate sessionData exists before accessing properties
      if (!sessionData) {
        throw new Error('Backend returned empty session data')
      }

      // Map backend 'ai-guided' to frontend 'conversational'
      if ((sessionData.currentView as string) === 'ai-guided') {
        sessionData.currentView = 'conversational'
      }
      // Map dataSource: 'ai-guided' → 'conversational'
      if (sessionData.dataSource === 'ai-guided') {
        sessionData.dataSource = 'conversational'
      }

      // CRITICAL: Validate required fields exist
      if (!sessionData.sessionId || !sessionData.reportId) {
        throw new Error(
          `Backend returned incomplete session data: missing ${!sessionData.sessionId ? 'sessionId' : ''} ${!sessionData.reportId ? 'reportId' : ''}`
        )
      }

      return {
        success: response.success,
        session: sessionData,
        sessionId: sessionData.sessionId,
        reportId: sessionData.reportId,
      }
    } catch (error) {
      this.handleSessionError(error, 'create session')
    }
  }

  /**
   * Update existing valuation session
   */
  async updateValuationSession(
    reportId: string,
    updates: UpdateValuationSessionRequest,
    options?: APIRequestConfig
  ): Promise<UpdateValuationSessionResponse> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const updatesAny = updates.updates as any
      const mappedCurrentView =
        updates.updates?.currentView === 'conversational'
          ? 'ai-guided'
          : updates.updates?.currentView

      // Map dataSource: 'conversational' → 'ai-guided' (if present in updates)
      const mappedDataSource =
        updatesAny?.dataSource === 'conversational' ? 'ai-guided' : updatesAny?.dataSource

      const backendUpdates = {
        ...updates,
        updates: {
          ...updates.updates,
          currentView: mappedCurrentView,
          // Include mapped dataSource if it was provided in updates
          ...(updatesAny?.dataSource !== undefined && { dataSource: mappedDataSource }),
        },
      }

      // Backend endpoint: /api/valuation-sessions/:reportId (PATCH, not PUT)
      const response = await this.executeRequest<{ success: boolean; data: any }>(
        {
          method: 'PATCH',
          url: `/api/valuation-sessions/${reportId}`,
          data: backendUpdates.updates, // Backend expects updates directly, not wrapped
          headers: {},
        } as any,
        options
      )

      // Backend returns { success: true, data: {...} }
      // Transform to { success: true, session: {...}, updated: true }
      const sessionData = response.data

      // Map backend 'ai-guided' to frontend 'conversational'
      if (sessionData) {
        if ((sessionData.currentView as string) === 'ai-guided') {
          sessionData.currentView = 'conversational'
        }
        // Map dataSource: 'ai-guided' → 'conversational'
        if (sessionData.dataSource === 'ai-guided') {
          sessionData.dataSource = 'conversational'
        }
      }

      return {
        success: response.success,
        session: sessionData,
        updated: true,
      }
    } catch (error) {
      this.handleSessionError(error, 'update session')
    }
  }

  /**
   * Switch valuation view (manual ↔ conversational)
   */
  async switchValuationView(
    reportId: string,
    view: 'manual' | 'conversational',
    options?: APIRequestConfig
  ): Promise<SwitchViewResponse> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendView = view === 'conversational' ? 'ai-guided' : view

      // Backend endpoint: /api/valuation-sessions/:reportId/switch-view (POST, not PUT)
      const response = await this.executeRequest<{ success: boolean; data?: any }>(
        {
          method: 'POST',
          url: `/api/valuation-sessions/${reportId}/switch-view`,
          data: { view: backendView },
          headers: {},
        } as any,
        options
      )

      // Backend returns { success: true, data: {...} }
      // FIX: Add null checks to prevent "Cannot read properties of undefined" errors
      if (!response || !response.success) {
        const errorMessage = (response as any)?.error || 'Failed to switch view'
        throw new APIError(errorMessage, 400, undefined, false)
      }

      const sessionData = response.data

      // FIX: Handle missing or malformed response data
      if (!sessionData || typeof sessionData !== 'object') {
        apiLogger.warn('Invalid response data from switch-view endpoint', {
          reportId,
          response,
        })
        // Return success with the requested view if data is missing
        // The optimistic update already happened, so we just confirm it
        return {
          success: true,
          currentView: view,
        }
      }

      // Map backend 'ai-guided' to frontend 'conversational'
      const currentView =
        sessionData.currentView === 'ai-guided'
          ? 'conversational'
          : sessionData.currentView === 'conversational'
            ? 'conversational'
            : 'manual'

      // Map response back - previousView is optional and not always returned
      return {
        success: true,
        currentView: currentView as 'manual' | 'conversational',
        previousView: sessionData.previousView
          ? sessionData.previousView === 'ai-guided'
            ? 'conversational'
            : sessionData.previousView
          : undefined,
      }
    } catch (error) {
      const appError = convertToApplicationError(error, { reportId, view })

      // Handle rate limiting gracefully (429)
      if ((appError as any).code === 'RATE_LIMIT_ERROR' || (appError as any).code === 'TOO_MANY_REQUESTS_ERROR') {
        apiLogger.warn('Rate limited on switch view - keeping optimistic update', {
          reportId,
          view,
          code: (appError as any).code,
        })
        // Return success with requested view - optimistic update already happened
        // Don't throw error, just log it
        return {
          success: true,
          currentView: view,
        }
      }

      this.handleSessionError(error, 'switch view')
    }
  }

  /**
   * Handle session-specific errors
   */
  private handleSessionError(error: unknown, operation: string): never {
    const appError = convertToApplicationError(error, { operation })

    // Log with specific error type
    if (isNetworkError(appError)) {
      apiLogger.error(`Session ${operation} failed - network error`, {
        error: (appError as any).message,
        code: (appError as any).code,
        operation,
        context: (appError as any).context,
      })
    } else if (isSessionConflictError(appError)) {
      apiLogger.warn(`Session ${operation} failed - conflict`, {
        error: (appError as any).message,
        code: (appError as any).code,
        operation,
        context: (appError as any).context,
      })
    } else if (isValidationError(appError)) {
      apiLogger.error(`Session ${operation} failed - validation error`, {
        error: (appError as any).message,
        code: (appError as any).code,
        operation,
        context: (appError as any).context,
      })
    } else {
      apiLogger.error(`Session ${operation} failed`, {
        error: (appError as any).message,
        code: (appError as any).code,
        operation,
        context: (appError as any).context,
      })
    }

    // Re-throw as appropriate error type
    if ((appError as any).code === 'NOT_FOUND_ERROR') {
      throw new APIError('Session not found', 404, undefined, true)
    }

    if ((appError as any).code === 'AUTH_ERROR' || (appError as any).code === 'PERMISSION_ERROR') {
      throw new AuthenticationError('Authentication required for session operation')
    }

    if ((appError as any).code === 'SESSION_CONFLICT') {
      throw new APIError('Session conflict - please refresh and try again', 409, undefined, true)
    }

    // Re-throw the converted error
    throw appError
  }

  /**
   * Save valuation result to session
   * Persists valuation result, HTML report, and info tab HTML for restoration
   */
  async saveValuationResult(
    reportId: string,
    data: {
      valuationResult: any
      htmlReport?: string
      infoTabHtml?: string
    },
    options?: APIRequestConfig
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.executeRequest<{ success: boolean; message: string }>(
        {
          method: 'PUT',
          url: `/api/valuation-sessions/${reportId}/result`,
          data,
          headers: {},
        } as any,
        options
      )

      apiLogger.info('Valuation result saved to session', {
        reportId,
        hasHtmlReport: !!data.htmlReport,
        hasInfoTabHtml: !!data.infoTabHtml,
      })

      return response
    } catch (error) {
      apiLogger.error('Failed to save valuation result to session', {
        reportId,
        error: error instanceof Error ? error.message : String(error),
      })
      this.handleSessionError(error, 'save valuation result')
    }
  }
}
