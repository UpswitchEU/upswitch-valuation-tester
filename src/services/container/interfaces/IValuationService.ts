/**
 * IValuationService Interface - Valuation Service Abstraction
 *
 * Defines the contract for valuation business logic.
 * Components depend on this interface, not concrete implementations.
 */

import type { ValuationRequest, ValuationResponse } from '../../../types/valuation';

export interface IValuationService {
  calculateValuation(request: ValuationRequest): Promise<ValuationResponse>;
  getValuationStatus(valuationId: string): Promise<{ status: string; progress: number }>;
  cancelValuation(valuationId: string): Promise<void>;
}