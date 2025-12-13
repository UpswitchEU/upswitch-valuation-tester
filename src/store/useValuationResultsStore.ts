/**
 * Valuation Results Store - Focused Store for Results Management
 *
 * Single Responsibility: Manage valuation results, input data, and result operations
 * SOLID Principles: SRP - Only handles result-related state and actions
 *
 * @module store/useValuationResultsStore
 */

import { create } from 'zustand'
import type { ValuationResponse } from '../types/valuation'
import { storeLogger } from '../utils/logger'

// Import correlation context - this should be defined elsewhere
// For now, we'll use a placeholder
const correlationContext = {
  setCorrelationId: (id: string | null) => {
    storeLogger.debug('Correlation ID set', { correlationId: id })
  },
  setValuationId: (id: string) => {
    storeLogger.debug('Valuation ID set', { valuationId: id })
  }
}

interface ValuationResultsStore {
  // Results
  result: ValuationResponse | null
  setResult: (result: ValuationResponse | null) => void
  clearResult: () => void

  // Input data storage
  inputData: ValuationInputData | null
  setInputData: (inputData: ValuationInputData | null) => void

  // Saved valuation ID
  savedValuationId: string | null
  setSavedValuationId: (savedValuationId: string | null) => void

  // Correlation ID for logging
  correlationId: string | null
  setCorrelationId: (correlationId: string | null) => void
}

/**
 * Valuation Results Store
 *
 * Focused store handling only result data management following SRP.
 * No form data, no API calls, no UI state - just results and related data.
 */
export const useValuationResultsStore = create<ValuationResultsStore>((set, get) => ({
  // Results
  result: null,
  setResult: (result) => {
    if (!result) {
      storeLogger.debug('Results store: Result cleared')
      set({ result: null })
      return
    }

    // CRITICAL: Preserve html_report from existing result if new result doesn't have it
    // This ensures streaming HTML report is never lost when regular endpoint overwrites
    const currentResult = get().result
    const currentHasHtmlReport = currentResult?.html_report && currentResult.html_report.length > 0
    const newHasHtmlReport = result?.html_report && result.html_report.length > 0

    if (result && currentHasHtmlReport && !newHasHtmlReport) {
      storeLogger.info('Results store: Preserving html_report from existing result', {
        preservedFrom: 'existing_result',
        htmlReportLength: currentResult?.html_report?.length || 0,
        valuationId: result.valuation_id,
        newResultHadHtmlReport: !!result.html_report,
        newResultHtmlReportLength: result.html_report?.length || 0,
      })
      set({ result: { ...result, html_report: currentResult?.html_report } })
    } else {
      storeLogger.debug('Results store: Result updated', {
        valuationId: result.valuation_id,
        hasHtmlReport: !!result.html_report,
        htmlReportLength: result.html_report?.length || 0
      })
      set({ result })
    }
  },
  clearResult: () => {
    storeLogger.info('Results store: Result cleared')
    set({ result: null })
  },

  // Input data storage
  inputData: null,
  setInputData: (inputData) => {
    storeLogger.debug('Results store: Input data updated', {
      hasData: !!inputData,
      revenue: inputData?.revenue,
      ebitda: inputData?.ebitda
    })
    set({ inputData })
  },

  // Saved valuation ID
  savedValuationId: null,
  setSavedValuationId: (savedValuationId) => {
    storeLogger.info('Results store: Saved valuation ID updated', {
      valuationId: savedValuationId
    })
    set({ savedValuationId })
  },

  // Correlation ID for logging
  correlationId: null,
  setCorrelationId: (correlationId) => {
    storeLogger.info('Results store: Correlation ID set', { correlationId })
    set({ correlationId })
    // Also update global correlation context
    correlationContext.setCorrelationId(correlationId)
    if (correlationId) {
      correlationContext.setValuationId(correlationId)
    }
  },
}))

// Type definitions for the results store
interface ValuationInputData {
  revenue: number
  ebitda: number
  industry: string
  country_code: string
  founding_year: number
  employees?: number
  business_model: string
  historical_years_data?: Array<{
    year: number
    revenue: number
    ebitda: number
  }>
  total_debt?: number
  cash?: number
  metrics?: any // Backend metrics may have different fields
}