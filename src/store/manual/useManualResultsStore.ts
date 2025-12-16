/**
 * Manual Flow - Results Store
 *
 * Manages valuation results state for the manual flow.
 * Isolated from conversational flow to prevent race conditions.
 *
 * Key Features:
 * - Atomic functional updates (no race conditions)
 * - trySetCalculating pattern (prevents double submissions)
 * - Calculation state management (isCalculating, error)
 * - Results storage (valuation result, HTML reports)
 *
 * @module store/manual/useManualResultsStore
 */

import { create } from 'zustand'
import type { ValuationResponse } from '../../types/valuation'
import { storeLogger } from '../../utils/logger'

interface ManualResultsStore {
  // Results state
  result: ValuationResponse | null
  htmlReport: string | null
  infoTabHtml: string | null

  // Calculation state
  isCalculating: boolean
  error: string | null

  // Actions (all atomic with functional updates)
  setResult: (result: ValuationResponse | null) => void
  setHtmlReport: (html: string) => void
  setInfoTabHtml: (html: string) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearResults: () => void

  // Atomic check-and-set for calculation state
  // Returns true if state was set, false if already calculating
  trySetCalculating: () => boolean
  setCalculating: (isCalculating: boolean) => void
}

export const useManualResultsStore = create<ManualResultsStore>((set, get) => ({
  // Initial state
  result: null,
  htmlReport: null,
  infoTabHtml: null,
  isCalculating: false,
  error: null,

  // Set result (atomic)
  setResult: (result: ValuationResponse | null) => {
    set((state) => {
      if (result) {
        storeLogger.info('[Manual] Valuation result set', {
          valuationId: result.valuation_id,
          hasHtmlReport: !!result.html_report,
          hasInfoTabHtml: !!result.info_tab_html,
          htmlReportLength: result.html_report?.length || 0,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
        })

        // Warn if html_report is missing
        if (!result.html_report || result.html_report.trim().length === 0) {
          storeLogger.error('[Manual] CRITICAL: html_report missing or empty', {
            valuationId: result.valuation_id,
            resultKeys: Object.keys(result),
          })
        }

        // Warn if info_tab_html is missing
        if (!result.info_tab_html || result.info_tab_html.trim().length === 0) {
          storeLogger.error('[Manual] CRITICAL: info_tab_html missing or empty', {
            valuationId: result.valuation_id,
            resultKeys: Object.keys(result),
          })
        }

        return {
          ...state,
          result,
          htmlReport: result.html_report || state.htmlReport,
          infoTabHtml: result.info_tab_html || state.infoTabHtml,
        }
      } else {
        storeLogger.debug('[Manual] Valuation result cleared')

        return {
          ...state,
          result: null,
        }
      }
    })
  },

  // Set HTML report separately (atomic)
  setHtmlReport: (html: string) => {
    set((state) => {
      const currentResult = state.result

      if (currentResult) {
        const updatedResult = { ...currentResult, html_report: html }
        
        storeLogger.info('[Manual] HTML report updated in existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          result: updatedResult,
          htmlReport: html,
        }
      } else {
        // Store HTML report even without result object
        storeLogger.info('[Manual] HTML report set without existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          htmlReport: html,
        }
      }
    })
  },

  // Set info tab HTML separately (atomic)
  setInfoTabHtml: (html: string) => {
    set((state) => {
      const currentResult = state.result

      if (currentResult) {
        const updatedResult = { ...currentResult, info_tab_html: html }
        
        storeLogger.info('[Manual] Info tab HTML updated in existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          result: updatedResult,
          infoTabHtml: html,
        }
      } else {
        // Store info tab HTML even without result object
        storeLogger.info('[Manual] Info tab HTML set without existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          infoTabHtml: html,
        }
      }
    })
  },

  // Set error (atomic)
  setError: (error: string | null) => {
    set((state) => {
      if (error) {
        storeLogger.error('[Manual] Calculation error', {
          error,
        })
      }

      return {
        ...state,
        error,
        isCalculating: false, // Always clear calculating state on error
      }
    })
  },

  // Clear error (atomic)
  clearError: () => {
    set((state) => ({
      ...state,
      error: null,
    }))
  },

  // Clear results (atomic)
  clearResults: () => {
    set((state) => ({
      ...state,
      result: null,
      htmlReport: null,
      infoTabHtml: null,
      error: null,
    }))

    storeLogger.debug('[Manual] Results cleared')
  },

  // Atomic check-and-set for calculation state
  // Returns true if state was set to calculating, false if already calculating
  // Use this before calling ValuationService.calculateValuation to ensure immediate UI feedback
  trySetCalculating: () => {
    let wasSet = false
    
    set((state) => {
      if (state.isCalculating) {
        storeLogger.debug('[Manual] Already calculating, preventing duplicate submission')
        return state // Already calculating, don't change
      }

      wasSet = true
      storeLogger.info('[Manual] Loading state set to true immediately')

      return {
        ...state,
        isCalculating: true,
        error: null,
      }
    })

    return wasSet
  },

  // Set calculating state (atomic)
  // Use trySetCalculating instead for double-submission prevention
  setCalculating: (isCalculating: boolean) => {
    set((state) => {
      // If trying to set to true but already calculating, don't change state
      if (isCalculating && state.isCalculating) {
        storeLogger.debug('[Manual] Already calculating, skipping duplicate setCalculating(true)')
        return state
      }

      storeLogger.debug('[Manual] Calculating state changed', {
        isCalculating,
      })

      return {
        ...state,
        isCalculating,
      }
    })
  },
}))

