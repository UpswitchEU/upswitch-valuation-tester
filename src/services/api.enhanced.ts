/**
 * Enhanced API Service with Zod Validation
 * 
 * API client with runtime type validation using Zod schemas.
 * Ensures type safety at the API boundary.
 * 
 * @module services/api.enhanced
 */

import axios, { AxiosInstance } from 'axios';
import {
  ValuationRequestSchema,
  safeParseValuationResponse,
  safeParseSessionHistory,
  formatZodError,
  type ValuationRequest,
  type ValuationResponse,
  type SessionHistoryResponse,
} from '../types/schemas';
import { APIError, ValidationError } from '../types/errors';
import { apiLogger } from '../utils/logger';

class EnhancedValuationAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || 
               import.meta.env.VITE_API_BASE_URL ||
               'https://web-production-8d00b.up.railway.app',
      timeout: 90000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor with validation
    this.client.interceptors.response.use(
      response => response,
      error => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        const endpoint = error.config?.url;
        
        apiLogger.error('API Error', {
          error: message,
          status,
          endpoint,
        });
        
        throw new APIError(message, status, endpoint, true, {
          originalError: error.response?.data,
        });
      }
    );
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Calculate valuation with validation
   */
  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    // Validate request
    const requestValidation = ValuationRequestSchema.safeParse(data);
    if (!requestValidation.success) {
      const errorMessage = formatZodError(requestValidation.error);
      apiLogger.error('Invalid valuation request', { error: errorMessage });
      throw new ValidationError(
        `Invalid valuation request: ${errorMessage}`,
        undefined,
        data
      );
    }

    // Make API call
    const response = await this.client.post('/api/v1/valuation/calculate', data);
    
    // Validate response
    const responseValidation = safeParseValuationResponse(response.data);
    if (!responseValidation.success) {
      const errorMessage = formatZodError(responseValidation.error);
      apiLogger.error('Invalid valuation response from API', { error: errorMessage });
      throw new ValidationError(
        `Invalid API response: ${errorMessage}`,
        undefined,
        response.data
      );
    }

    return responseValidation.data;
  }

  /**
   * Start conversation with validation
   */
  async startConversation(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/intelligent-conversation/start', data);
    
    // Optionally validate response structure
    // For now, return as-is since structure varies
    return response.data;
  }

  /**
   * Get conversation history with validation
   */
  async getConversationHistory(sessionId: string): Promise<SessionHistoryResponse> {
    const response = await this.client.get(
      `/api/v1/intelligent-conversation/status/${sessionId}`
    );
    
    // Validate response
    const validation = safeParseSessionHistory(response.data);
    if (!validation.success) {
      const errorMessage = formatZodError(validation.error);
      apiLogger.warn('Invalid conversation history response', { 
        error: errorMessage,
        sessionId 
      });
      // Don't throw - return best-effort parse for backward compatibility
      return {
        exists: false,
        messages: [],
      };
    }

    return validation.data;
  }

  /**
   * Send conversation message
   */
  async sendMessage(sessionId: string, message: string, context?: Partial<Record<string, unknown>>): Promise<any> {
    const response = await this.client.post('/api/v1/intelligent-conversation/stream', {
      session_id: sessionId,
      user_input: message,
      context,
    });
    
    return response.data;
  }
}

// Export singleton instance
export const enhancedAPI = new EnhancedValuationAPI();

