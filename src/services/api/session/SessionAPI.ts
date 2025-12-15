/**
 * Session API Service
 *
 * Single Responsibility: Handle all valuation session lifecycle operations
 * Extracted from BackendAPI to follow SRP
 *
 * @module services/api/session/SessionAPI
 */

import {
    CreateValuationSessionRequest,
    UpdateValuationSessionRequest,
} from '../../../types/api'
import type {
    CreateValuationSessionResponse,
    SwitchViewResponse,
    UpdateValuationSessionResponse,
    ValuationSessionResponse,
} from '../../../types/api-responses'
import { APIError, AuthenticationError } from '../../../types/errors'
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
      const response = await this.executeRequest<ValuationSessionResponse>(
        {
          method: 'GET',
          url: `/api/sessions/${reportId}`,
          headers: {},
        } as any,
        options
      )

      // Map backend 'ai-guided' to frontend 'conversational'
      if (response && response.session) {
        if ((response.session.currentView as string) === 'ai-guided') {
          response.session.currentView = 'conversational'
        }
        // Map dataSource: 'ai-guided' → 'conversational'
        if ((response.session as any).dataSource === 'ai-guided') {
          (response.session as any).dataSource = 'conversational'
        }
      }

      return response
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
      const mappedCurrentView = session.currentView === 'conversational' ? 'ai-guided' : session.currentView
      
      // Map dataSource: 'conversational' → 'ai-guided'
      // If dataSource exists, map it; otherwise derive from currentView
      const mappedDataSource = sessionAny.dataSource === 'conversational' 
        ? 'ai-guided' 
        : (sessionAny.dataSource || (session.currentView === 'conversational' ? 'ai-guided' : 'manual'))
      
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
      const mappedCurrentView = updates.updates?.currentView === 'conversational' ? 'ai-guided' : updates.updates?.currentView
      
      // Map dataSource: 'conversational' → 'ai-guided' (if present in updates)
      const mappedDataSource = updatesAny?.dataSource === 'conversational'
        ? 'ai-guided'
        : updatesAny?.dataSource
      
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
        throw new APIError(
          errorMessage,
          400,
          undefined,
          false
        )
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
          ? (sessionData.previousView === 'ai-guided'
              ? 'conversational'
              : sessionData.previousView)
          : undefined,
      }
    } catch (error: any) {
      // FIX: Handle 429 rate limiting gracefully
      const axiosError = error as any
      const status = axiosError?.response?.status || axiosError?.status
      
      if (status === 429) {
        apiLogger.warn('Rate limited on switch view - keeping optimistic update', {
          reportId,
          view,
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
    apiLogger.error(`Session ${operation} failed`, { error })

    const axiosError = error as any
    const status = axiosError?.response?.status

    if (status === 404) {
      throw new APIError('Session not found', status, undefined, true)
    }

    if (status === 401 || status === 403) {
      throw new AuthenticationError('Authentication required for session operation')
    }

    if (status === 409) {
      throw new APIError('Session conflict - please refresh and try again', status, undefined, true)
    }

    throw new APIError(`Failed to ${operation}`, status, undefined, true, { originalError: error })
  }
}
