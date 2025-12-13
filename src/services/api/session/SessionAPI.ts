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
    CreateValuationSessionResponse,
    UpdateValuationSessionRequest,
    UpdateValuationSessionResponse
} from '../../../types/api';
import type { SwitchViewResponse, ValuationSessionResponse } from '../../../types/api-responses';
import { APIError, AuthenticationError } from '../../../types/errors';
import { apiLogger } from '../../../utils/logger';
import { APIRequestConfig, HttpClient } from '../HttpClient';

export class SessionAPI extends HttpClient {
  /**
   * Get valuation session data
   */
  async getValuationSession(
    reportId: string,
    options?: APIRequestConfig
  ): Promise<ValuationSessionResponse | null> {
    try {
      const response = await this.executeRequest<ValuationSessionResponse>({
        method: 'GET',
        url: `/api/sessions/${reportId}`
      }, options);

      // Map backend 'ai-guided' to frontend 'conversational'
      if (response && response.session && response.session.currentView === 'ai-guided') {
        response.session.currentView = 'conversational';
      }

      return response;
    } catch (error) {
      // Handle 404 gracefully - session doesn't exist yet
      if (error.response?.status === 404) {
        apiLogger.debug('Session does not exist yet', { reportId });
        return null;
      }
      this.handleSessionError(error, 'get session');
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
        currentView: session.currentView === 'conversational' ? 'ai-guided' : session.currentView
      };

      const response = await this.executeRequest<CreateValuationSessionResponse>({
        method: 'POST',
        url: '/api/sessions',
        data: backendSession
      }, options);

      // Map response back
      return {
        ...response,
        currentView: response.currentView === 'ai-guided' ? 'conversational' : response.currentView
      };
    } catch (error) {
      this.handleSessionError(error, 'create session');
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
        currentView: updates.currentView === 'conversational' ? 'ai-guided' : updates.currentView
      };

      const response = await this.executeRequest<UpdateValuationSessionResponse>({
        method: 'PUT',
        url: `/api/sessions/${reportId}`,
        data: backendUpdates
      }, options);

      // Map response back
      return {
        ...response,
        currentView: response.currentView === 'ai-guided' ? 'conversational' : response.currentView
      };
    } catch (error) {
      this.handleSessionError(error, 'update session');
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
      const backendView = view === 'conversational' ? 'ai-guided' : view;

      const response = await this.executeRequest<SwitchViewResponse>({
        method: 'PUT',
        url: `/api/sessions/${reportId}/switch-view`,
        data: { view: backendView }
      }, options);

      // Map response back
      return {
        ...response,
        currentView: response.currentView === 'ai-guided' ? 'conversational' : response.currentView
      };
    } catch (error) {
      this.handleSessionError(error, 'switch view');
    }
  }

  /**
   * Handle session-specific errors
   */
  private handleSessionError(error: unknown, operation: string): never {
    apiLogger.error(`Session ${operation} failed`, { error });

    if (error.response?.status === 404) {
      throw new APIError('Session not found', error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AuthenticationError('Authentication required for session operation');
    }

    if (error.response?.status === 409) {
      throw new APIError('Session conflict - please refresh and try again', error);
    }

    throw new APIError(`Failed to ${operation}`, error);
  }
}
