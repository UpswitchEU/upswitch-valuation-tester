/**
 * Instant Valuation Service
 * 
 * Handles the instant (AI-guided) valuation flow through the backend
 * to ensure proper credit management and flow differentiation
 */

import { backendAPI } from './backendApi';
import { api } from './api';
import { serviceLogger } from '../utils/logger';
import type { ValuationRequest, ValuationResponse } from '../types/valuation';

class InstantValuationService {
  /**
   * Process instant valuation through backend (with credit checks)
   * This replaces the direct valuation engine call for the instant flow
   */
  async processInstantValuation(data: ValuationRequest): Promise<ValuationResponse> {
    try {
      serviceLogger.info('Processing instant valuation through backend', {
        companyName: data.company_name,
        flowType: 'instant'
      });

      // Use backend API which handles credit checks
      const response = await backendAPI.calculateInstantValuation(data);
      
      serviceLogger.info('Instant valuation completed', {
        valuationId: response.valuation_id,
        flowType: 'instant'
      });

      return response;
    } catch (error) {
      serviceLogger.error('Instant valuation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        flowType: 'instant'
      });
      throw error;
    }
  }

  /**
   * Process manual valuation through backend (no credit checks)
   * This is used by the manual flow
   */
  async processManualValuation(data: ValuationRequest): Promise<ValuationResponse> {
    try {
      serviceLogger.info('Processing manual valuation through backend', {
        companyName: data.company_name,
        flowType: 'manual'
      });

      // Use backend API which doesn't require credits
      const response = await backendAPI.calculateManualValuation(data);
      
      serviceLogger.info('Manual valuation completed', {
        valuationId: response.valuation_id,
        flowType: 'manual'
      });

      return response;
    } catch (error) {
      serviceLogger.error('Manual valuation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        flowType: 'manual'
      });
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   * Routes to appropriate flow based on context
   */
  async calculateValuation(data: ValuationRequest, flowType: 'manual' | 'instant' = 'instant'): Promise<ValuationResponse> {
    if (flowType === 'manual') {
      return this.processManualValuation(data);
    } else {
      return this.processInstantValuation(data);
    }
  }
}

export const instantValuationService = new InstantValuationService();
