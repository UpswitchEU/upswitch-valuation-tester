/**
 * Valuation API Store
 * 
 * Manages API call state for valuation calculations.
 * Used by ConversationalLayout and manual flows.
 */

import { create } from 'zustand'
import { backendAPI } from '../services/backendApi'
import type { ValuationRequest, ValuationResponse } from '../types/valuation'
import { storeLogger } from '../utils/logger'

interface ValuationApiStore {
  // Calculation state
  isCalculating: boolean
  error: string | null
  
  // Actions
  calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse | null>
  clearError: () => void
}

export const useValuationApiStore = create<ValuationApiStore>((set, get) => ({
  // Initial state
  isCalculating: false,
  error: null,
  
  // Calculate valuation
  calculateValuation: async (request: ValuationRequest): Promise<ValuationResponse | null> => {
    set({ isCalculating: true, error: null })
    
    try {
      storeLogger.info('Calculating valuation', {
        companyName: request.company_name,
        industry: request.industry,
      })
      
      const response = await backendAPI.calculateValuation(request)
      
      set({ isCalculating: false })
      
      storeLogger.info('Valuation calculated successfully', {
        valuationId: response?.valuation_id,
      })
      
      return response
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate valuation'
      storeLogger.error('Valuation calculation failed', { error: errorMessage })
      
      set({ 
        isCalculating: false,
        error: errorMessage,
      })
      
      return null
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))


