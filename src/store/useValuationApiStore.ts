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
    } catch (error) {
      const appError = convertToApplicationError(error, {
        companyName: request.company_name,
        industry: request.industry,
      })

      // Log with specific error type
      if (isValidationError(appError)) {
        storeLogger.error('Valuation calculation failed - validation error', {
          error: appError.message,
          code: appError.code,
          context: appError.context,
        })
      } else if (isNetworkError(appError)) {
        storeLogger.error('Valuation calculation failed - network error', {
          error: appError.message,
          code: appError.code,
          context: appError.context,
        })
      } else if (isRetryableError(appError)) {
        storeLogger.warn('Valuation calculation failed - retryable error', {
          error: appError.message,
          code: appError.code,
          context: appError.context,
        })
      } else {
        storeLogger.error('Valuation calculation failed', {
          error: appError.message,
          code: appError.code,
          context: appError.context,
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

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
