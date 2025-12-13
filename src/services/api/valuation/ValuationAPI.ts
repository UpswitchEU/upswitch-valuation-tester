/**
 * Valuation API Service
 *
 * Single Responsibility: Handle all valuation calculation operations
 * Extracted from BackendAPI to follow SRP
 *
 * @module services/api/valuation/ValuationAPI
 */

import { APIError, AuthenticationError, CreditError, NetworkError, RateLimitError, ValidationError } from '../../../types/errors';
import { ValuationRequest, ValuationResponse } from '../../../types/valuation';
import { apiLogger } from '../../../utils/logger';
import { APIRequestConfig, HttpClient } from '../HttpClient';

export class ValuationAPI extends HttpClient {
  /**
   * Calculate manual valuation (traditional form-based)
   */
  async calculateManualValuation(
    data: ValuationRequest,
    options?: APIRequestConfig
  ): Promise<ValuationResponse> {
    try {
      return await this.executeRequest<ValuationResponse>({
        method: 'POST',
        url: '/api/valuation/calculate-manual',
        data: {
          ...data,
          dataSource: 'manual'
        }
      }, options);
    } catch (error) {
      this.handleValuationError(error, 'manual valuation');
    }
  }

  /**
   * Calculate AI-guided valuation (conversational flow)
   */
  async calculateAIGuidedValuation(
    data: ValuationRequest,
    options?: APIRequestConfig
  ): Promise<ValuationResponse> {
    try {
      return await this.executeRequest<ValuationResponse>({
        method: 'POST',
        url: '/api/valuation/calculate-ai-guided',
        data: {
          ...data,
          dataSource: 'ai-guided'
        }
      }, options);
    } catch (error) {
      this.handleValuationError(error, 'AI-guided valuation');
    }
  }

  /**
   * Calculate instant valuation (quick preview)
   */
  async calculateInstantValuation(
    data: ValuationRequest,
    options?: APIRequestConfig
  ): Promise<ValuationResponse> {
    try {
      return await this.executeRequest<ValuationResponse>({
        method: 'POST',
        url: '/api/valuation/calculate-instant',
        data: {
          ...data,
          dataSource: 'instant'
        }
      }, options);
    } catch (error) {
      this.handleValuationError(error, 'instant valuation');
    }
  }

  /**
   * Unified valuation calculation (determines type automatically)
   */
  async calculateValuationUnified(
    data: ValuationRequest,
    options?: APIRequestConfig
  ): Promise<ValuationResponse> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendData = {
        ...data,
        dataSource: data.dataSource === 'conversational' ? 'ai-guided' : data.dataSource
      };

      // Use unified endpoint - backend determines credit cost based on dataSource
      return await this.executeRequest<ValuationResponse>({
        method: 'POST',
        url: '/api/valuation/calculate-unified',
        data: backendData
      }, options);
    } catch (error) {
      this.handleValuationError(error, 'unified valuation');
    }
  }

  /**
   * Generate HTML preview for valuation
   */
  async generatePreviewHtml(
    data: ValuationRequest,
    options?: APIRequestConfig
  ): Promise<{ html: string; completeness_percent: number }> {
    try {
      return await this.executeRequest<{ html: string; completeness_percent: number }>({
        method: 'POST',
        url: '/api/valuation/preview-html',
        data
      }, options);
    } catch (error) {
      apiLogger.error('Failed to generate preview HTML', { error });
      throw new APIError('Failed to generate valuation preview', error);
    }
  }

  /**
   * Handle valuation-specific errors with appropriate error types
   */
  private handleValuationError(error: unknown, operation: string): never {
    apiLogger.error(`Valuation ${operation} failed`, { error });

    if (error.response?.status === 429) {
      throw new RateLimitError('Too many valuation requests. Please wait before trying again.');
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AuthenticationError('Authentication required for valuation calculation.');
    }

    if (error.response?.status === 402) {
      throw new CreditError('Insufficient credits for valuation calculation.');
    }

    if (error.response?.status === 400) {
      const message = error.response?.data?.message || 'Invalid valuation data provided.';
      throw new ValidationError(message);
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      throw new NetworkError('Network error during valuation calculation. Please check your connection.');
    }

    throw new APIError(`Failed to complete ${operation}`, error);
  }
}
