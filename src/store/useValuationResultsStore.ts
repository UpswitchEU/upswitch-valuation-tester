/**
 * Valuation Results Store
 * 
 * Manages valuation results state.
 * Used by ConversationalLayout, Results component, and manual flows.
 */

import { create } from 'zustand'
import type { ValuationResponse } from '../types/valuation'
import { storeLogger } from '../utils/logger'

interface ValuationResultsStore {
  // Results
  result: ValuationResponse | null
  
  // Actions
  setResult: (result: ValuationResponse | null) => void
  clearResult: () => void
}

export const useValuationResultsStore = create<ValuationResultsStore>((set, get) => ({
  // Initial state
  result: null,
  
  // Set result
  setResult: (result: ValuationResponse | null) => {
    set({ result })
    storeLogger.debug('Valuation result set', { 
      hasResult: !!result,
      valuationId: result?.valuation_id 
    })
  },
  
  // Clear result
  clearResult: () => {
    set({ result: null })
    storeLogger.debug('Valuation result cleared')
  },
}))

