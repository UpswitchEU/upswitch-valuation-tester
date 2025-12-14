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

      const response = await this.executeRequest<CreateValuationSessionResponse>(
        {
          method: 'POST',
          url: '/api/sessions',
          data: backendSession,
          headers: {},
        } as any,
        options
      )

      // Map response back - currentView is on session, not response
      if (response.session && (response.session.currentView as string) === 'ai-guided') {
        response.session.currentView = 'conversational'
      }
      return response
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

      const response = await this.executeRequest<UpdateValuationSessionResponse>(
        {
          method: 'PUT',
          url: `/api/sessions/${reportId}`,
          data: backendUpdates,
          headers: {},
        } as any,
        options
      )

      // Map response back - currentView is on session, not response
      if (response.session && (response.session.currentView as string) === 'ai-guided') {
        response.session.currentView = 'conversational'
      }
      return response
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

      const response = await this.executeRequest<SwitchViewResponse>(
        {
          method: 'PUT',
          url: `/api/sessions/${reportId}/switch-view`,
          data: { view: backendView },
          headers: {},
        } as any,
        options
      )

      // Map response back - currentView is directly on SwitchViewResponse
      return {
        ...response,
        currentView: (response.currentView as string) === 'ai-guided' ? 'conversational' : response.currentView,
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
