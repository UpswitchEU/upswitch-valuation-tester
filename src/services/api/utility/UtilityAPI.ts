/**
 * Utility API Service
 *
 * Single Responsibility: Handle utility operations like health checks and data migration
 * Extracted from BackendAPI to follow SRP
 *
 * @module services/api/utility/UtilityAPI
 */

import { APIError } from '../../../types/errors';
import type { Message } from '../../../types/message';
import { apiLogger } from '../../../utils/logger';
import { APIRequestConfig, HttpClient } from '../HttpClient';

export class UtilityAPI extends HttpClient {
  /**
   * Health check endpoint
   */
  async health(
    options?: APIRequestConfig
  ): Promise<{ status: string }> {
    try {
      return await this.executeRequest<{ status: string }>({
        method: 'GET',
        url: '/api/health'
      }, options);
    } catch (error) {
      apiLogger.error('Health check failed', { error });
      throw new APIError('Health check failed', error);
    }
  }

  /**
   * Migrate guest data to authenticated account
   */
  async migrateGuestData(
    guestSessionId: string,
    options?: APIRequestConfig
  ): Promise<{
    success: boolean;
    migratedReports?: number;
    message?: string;
  }> {
    try {
      return await this.executeRequest<{
        success: boolean;
        migratedReports?: number;
        message?: string;
      }>({
        method: 'POST',
        url: '/api/migrate-guest-data',
        data: { guestSessionId }
      }, options);
    } catch (error) {
      apiLogger.error('Guest data migration failed', { error, guestSessionId });
      throw new APIError('Failed to migrate guest data', error);
    }
  }

  /**
   * Get conversation status (for resuming conversations)
   */
  async getConversationStatus(
    sessionId: string,
    options?: APIRequestConfig
  ): Promise<{
    exists: boolean;
    messages?: Message[];
    metadata?: Record<string, unknown>;
  }> {
    try {
      // Call the valuation engine directly for conversation status
      // CRITICAL FIX: Use correct endpoint path - intelligent-conversation, not conversation
      const response = await this.client.request({
        method: 'GET',
        url: `/api/conversation/status/${sessionId}`,
        signal: options?.signal,
        timeout: options?.timeout || 10000 // 10 second timeout for status checks
      });

      // CRITICAL FIX: Handle both response formats (status object or direct data)
      const data = response.data?.data || response.data;

      // CRITICAL FIX: Check if status indicates exists: false (from graceful error handling)
      if (data?.exists === false) {
        apiLogger.debug('Conversation status check returned exists: false', { sessionId });
        return { exists: false };
      }

      if (data && typeof data === 'object') {
        return {
          exists: true,
          messages: data.messages || [],
          metadata: data.metadata || {}
        };
      }

      // Fallback for unexpected response format
      apiLogger.warn('Unexpected conversation status response format', {
        sessionId,
        responseKeys: Object.keys(data || {})
      });

      return { exists: false };
    } catch (error) {
      // CRITICAL FIX: Handle abort signal cancellation gracefully
      if (error.name === 'AbortError') {
        apiLogger.debug('Conversation status check was cancelled', { sessionId });
        // Return a special marker to indicate abort (caller should check for this)
        throw error; // Re-throw abort errors so caller can handle them
      }

      // If conversation doesn't exist or network error, return empty state
      if (error.response?.status === 404) {
        apiLogger.debug('Conversation does not exist (404)', { sessionId });
        return { exists: false };
      }

      // CRITICAL FIX: Handle 500 errors gracefully (backend may return exists: false in response body)
      if (error.response?.status === 500) {
        apiLogger.warn('Conversation status check failed with 500 error', { sessionId });

        // Check if response body contains a status object with exists: false
        if (error.response.data?.exists === false) {
          apiLogger.debug('Conversation status check returned exists: false in 500 response', { sessionId });
          return { exists: false };
        }
      }

      // Otherwise, log the error but still return empty state
      apiLogger.warn('Conversation status check failed, returning empty state', {
        sessionId,
        error: error.message,
        status: error.response?.status
      });

      // Don't throw error - just return empty state to allow new conversation
      return { exists: false };
    }
  }

  async getConversationHistory(conversationId: string, signal?: AbortSignal): Promise<{ messages: Message[]; exists: boolean }> {
    try {
      const response = await this.client.request({
        method: 'GET',
        url: `/api/conversation/history/${conversationId}`,
        signal,
        timeout: 30000 // 30 second timeout for history
      });

      const data = response.data?.data || response.data;
      if (data && Array.isArray(data.messages)) {
        return {
          messages: data.messages as Message[],
          exists: true
        };
      }

      return { messages: [], exists: false };
    } catch (error) {
      if (error.name === 'AbortError') {
        apiLogger.debug('Conversation history request was cancelled', { conversationId });
        throw error;
      }

      if (error.response?.status === 404) {
        apiLogger.debug('Conversation history does not exist', { conversationId });
        return { messages: [], exists: false };
      }

      apiLogger.error('Failed to get conversation history', {
        conversationId,
        error: error.message
      });

      return { messages: [], exists: false };
    }
  }
}
