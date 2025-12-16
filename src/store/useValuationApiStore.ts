/**
 * Valuation API Store
 * 
 * Manages API call state for valuation calculations.
 * Used by ConversationalLayout and manual flows.
 */

import { create } from 'zustand'
import { backendAPI } from '../services/backendApi'
import type { ValuationRequest, ValuationResponse } from '../types/valuation'
import { convertToApplicationError, getErrorMessage } from '../utils/errors/errorConverter'
import {
  isNetworkError,
  isRetryable as isRetryableError,
  isValidationError,
} from '../utils/errors/errorGuards'
import { storeLogger } from '../utils/logger'

interface ValuationApiStore {
  // Calculation state
  isCalculating: boolean
  error: string | null
  
  // Actions
  calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse | null>
  setCalculating: (isCalculating: boolean) => void
  clearError: () => void
}

export const useValuationApiStore = create<ValuationApiStore>((set, get) => ({
  // Initial state
  isCalculating: false,
  error: null,
  
  // Calculate valuation
  calculateValuation: async (request: ValuationRequest): Promise<ValuationResponse | null> => {
    // CRITICAL: Use functional update to atomically check and set isCalculating
    // This prevents race conditions if multiple calculations are triggered simultaneously
    let shouldProceed = false
    set((state) => {
      if (state.isCalculating) {
        storeLogger.warn('Calculation already in progress, skipping duplicate call', {
          companyName: request.company_name,
        })
        return state // No change - calculation already in progress
      }
      shouldProceed = true
      return { ...state, isCalculating: true, error: null }
    })
    
    // If calculation was already in progress, return null
    if (!shouldProceed) {
      return null
    }
    
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
    } catch (error) {
      const appError = convertToApplicationError(error, {
        companyName: request.company_name,
        industry: request.industry,
      })
      
      // Log with specific error type
      if (isValidationError(appError)) {
        storeLogger.error('Valuation calculation failed - validation error', {
          error: (appError as any).message,
          code: (appError as any).code,
          context: (appError as any).context,
        })
      } else if (isNetworkError(appError)) {
        storeLogger.error('Valuation calculation failed - network error', {
          error: (appError as any).message,
          code: (appError as any).code,
          context: (appError as any).context,
        })
      } else if (isRetryableError(appError)) {
        storeLogger.warn('Valuation calculation failed - retryable error', {
          error: (appError as any).message,
          code: (appError as any).code,
          context: (appError as any).context,
        })
      } else {
        storeLogger.error('Valuation calculation failed', {
          error: (appError as any).message,
          code: (appError as any).code,
          context: (appError as any).context,
        })
      }
      
      const errorMessage = getErrorMessage(appError)
      
      set({ 
        isCalculating: false,
        error: errorMessage,
      })
      
      return null
    }
  },
  
  // Set calculating state (for immediate UI feedback)
  // Uses functional update to ensure atomic state changes
  setCalculating: (isCalculating: boolean) => {
    set((state) => {
      // If trying to set to true but already calculating, don't change state
      if (isCalculating && state.isCalculating) {
        storeLogger.debug('Already calculating, skipping duplicate setCalculating(true)')
        return state
      }
      return { ...state, isCalculating }
    })
  },
  
  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
