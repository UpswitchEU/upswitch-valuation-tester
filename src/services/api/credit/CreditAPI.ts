/**
 * Credit API Service
 *
 * Single Responsibility: Handle credit status, usage, and account management
 * Extracted from BackendAPI to follow SRP
 *
 * @module services/api/credit/CreditAPI
 */

import { SaveValuationRequest, SaveValuationResponse } from '../../../types/api';
import { APIError, AuthenticationError, CreditError } from '../../../types/errors';
import { apiLogger } from '../../../utils/logger';
import { APIRequestConfig, HttpClient } from '../HttpClient';

export class CreditAPI extends HttpClient {
  /**
   * Get current credit status
   */
  async getCreditStatus(
    options?: APIRequestConfig
  ): Promise<{ creditsRemaining: number; isPremium: boolean }> {
    try {
      return await this.executeRequest<{ creditsRemaining: number; isPremium: boolean }>(
        {
          method: 'GET',
          url: '/api/credits/status',
        },
        options
      )
    } catch (error) {
      this.handleCreditError(error, 'get credit status')
    }
  }

  /**
   * Save valuation (deducts credits)
   */
  async saveValuation(
    data: SaveValuationRequest,
    options?: APIRequestConfig
  ): Promise<SaveValuationResponse> {
    try {
      return await this.executeRequest<SaveValuationResponse>(
        {
          method: 'POST',
          url: '/api/valuation/save',
          data,
        },
        options
      )
    } catch (error) {
      this.handleCreditError(error, 'save valuation')
    }
  }

  /**
   * Handle credit-specific errors
   */
  private handleCreditError(error: unknown, operation: string): never {
    apiLogger.error(`Credit ${operation} failed`, { error })

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AuthenticationError('Authentication required for credit operations')
    }

    if (error.response?.status === 402) {
      throw new CreditError('Insufficient credits for this operation')
    }

    if (error.response?.status === 429) {
      throw new CreditError('Too many credit operations. Please wait before trying again.')
    }

    throw new APIError(`Failed to ${operation}`, error)
  }
}
