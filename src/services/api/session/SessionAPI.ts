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
      if (response && response.session && (response.session.currentView as string) === 'ai-guided') {
        response.session.currentView = 'conversational'
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
   */
  async createValuationSession(
    session: CreateValuationSessionRequest,
    options?: APIRequestConfig
  ): Promise<CreateValuationSessionResponse> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendSession = {
        ...session,
        currentView: session.currentView === 'conversational' ? 'ai-guided' : session.currentView,
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
      if (sessionData && (sessionData.currentView as string) === 'ai-guided') {
        sessionData.currentView = 'conversational'
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
      const backendUpdates = {
        ...updates,
        updates: {
          ...updates.updates,
          currentView: updates.updates?.currentView === 'conversational' ? 'ai-guided' : updates.updates?.currentView,
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
      if (sessionData && (sessionData.currentView as string) === 'ai-guided') {
        sessionData.currentView = 'conversational'
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
    } catch (error) {
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
