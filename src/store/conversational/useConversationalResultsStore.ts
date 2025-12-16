/**
 * Conversational Flow - Results Store
 *
 * Manages valuation results state for the conversational flow.
 * Isolated from manual flow to prevent race conditions.
 *
 * Key Features:
 * - Atomic functional updates (no race conditions)
 * - trySetCalculating pattern (prevents double submissions)
 * - Calculation state management (isCalculating, error)
 * - Results storage (valuation result, HTML reports)
 *
 * @module store/conversational/useConversationalResultsStore
 */

import { create } from 'zustand'
import type { ValuationResponse } from '../../types/valuation'
import { storeLogger } from '../../utils/logger'

interface ConversationalResultsStore {
  // Results state
  result: ValuationResponse | null
  htmlReport: string | null
  infoTabHtml: string | null

  // Calculation state
  isCalculating: boolean
  error: string | null
  
  // Progress tracking (for long calculations, streaming responses)
  calculationProgress: number

  // Actions (all atomic with functional updates)
  setResult: (result: ValuationResponse | null) => void
  setHtmlReport: (html: string) => void
  setInfoTabHtml: (html: string) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearResults: () => void
  setCalculationProgress: (progress: number) => void

  // Atomic check-and-set for calculation state
  // Returns true if state was set, false if already calculating
  // Use this for immediate UI feedback (< 16ms)
  trySetCalculating: () => boolean
  setCalculating: (isCalculating: boolean) => void
}

export const useConversationalResultsStore = create<ConversationalResultsStore>((set, get) => ({
  // Initial state
  result: null,
  htmlReport: null,
  infoTabHtml: null,
  isCalculating: false,
  error: null,
  calculationProgress: 0,

  // Set result (atomic)
  setResult: (result: ValuationResponse | null) => {
    set((state) => {
      if (result) {
        storeLogger.info('[Conversational] Valuation result set', {
          valuationId: result.valuation_id,
          hasHtmlReport: !!result.html_report,
          hasInfoTabHtml: !!result.info_tab_html,
          htmlReportLength: result.html_report?.length || 0,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
        })

        // Warn if html_report is missing
        if (!result.html_report || result.html_report.trim().length === 0) {
          storeLogger.error('[Conversational] CRITICAL: html_report missing or empty', {
            valuationId: result.valuation_id,
            resultKeys: Object.keys(result),
          })
        }

        // Warn if info_tab_html is missing
        if (!result.info_tab_html || result.info_tab_html.trim().length === 0) {
          storeLogger.error('[Conversational] CRITICAL: info_tab_html missing or empty', {
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
        storeLogger.debug('[Conversational] Valuation result cleared')

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
        
        storeLogger.info('[Conversational] HTML report updated in existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          result: updatedResult,
          htmlReport: html,
        }
      } else {
        // Store HTML report even without result object
        storeLogger.info('[Conversational] HTML report set without existing result', {
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
        
        storeLogger.info('[Conversational] Info tab HTML updated in existing result', {
          htmlLength: html.length,
        })

        return {
          ...state,
          result: updatedResult,
          infoTabHtml: html,
        }
      } else {
        // Store info tab HTML even without result object
        storeLogger.info('[Conversational] Info tab HTML set without existing result', {
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
        storeLogger.error('[Conversational] Calculation error', {
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
      calculationProgress: 0,
    }))

    storeLogger.debug('[Conversational] Results cleared')
  },

  // Set calculation progress (for UI feedback during streaming/long operations)
  setCalculationProgress: (progress: number) => {
    set((state) => ({
      ...state,
      calculationProgress: Math.min(Math.max(progress, 0), 100),
    }))
  },

  // Atomic check-and-set for calculation state
  // Returns true if state was set to calculating, false if already calculating
  // Use this before calling ValuationService.calculateValuation to ensure immediate UI feedback
  // CRITICAL: This provides < 16ms UI response time (instant button disable)
  trySetCalculating: () => {
    let wasSet = false
    
    set((state) => {
      if (state.isCalculating) {
        storeLogger.debug('[Conversational] Already calculating, preventing duplicate submission')
        return state // Already calculating, don't change
      }

      wasSet = true
      storeLogger.info('[Conversational] Loading state set to true immediately (< 16ms)')

      return {
        ...state,
        isCalculating: true,
        error: null,
        calculationProgress: 0, // Reset progress for new calculation
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
        storeLogger.debug('[Conversational] Already calculating, skipping duplicate setCalculating(true)')
        return state
      }

      storeLogger.debug('[Conversational] Calculating state changed', {
        isCalculating,
      })

      return {
        ...state,
        isCalculating,
      }
    })
  },
}))

