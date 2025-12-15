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
  setValuationResult: (result: ValuationResponse) => void
  setHtmlReport: (html: string) => void
  setInfoTabHtml: (html: string) => void
  clearResult: () => void
}

export const useValuationResultsStore = create<ValuationResultsStore>((set, get) => ({
  // Initial state
  result: null,

  // Set result
  setResult: (result: ValuationResponse | null) => {
    // CRITICAL: Log html_report presence for debugging
    if (result) {
      storeLogger.info('Valuation result set in store', {
        hasResult: !!result,
        valuationId: result.valuation_id,
        hasHtmlReport: !!result.html_report,
        htmlReportLength: result.html_report?.length || 0,
        hasInfoTabHtml: !!result.info_tab_html,
        infoTabHtmlLength: result.info_tab_html?.length || 0,
        htmlReportPreview: result.html_report?.substring(0, 200) || 'N/A',
        resultKeys: Object.keys(result),
        htmlReportInKeys: 'html_report' in result,
        infoTabHtmlInKeys: 'info_tab_html' in result,
      })
      
      // Warn if html_report is missing
      if (!result.html_report || result.html_report.trim().length === 0) {
        storeLogger.error('CRITICAL: html_report missing or empty when setting result', {
          valuationId: result.valuation_id,
          hasHtmlReport: !!result.html_report,
          htmlReportLength: result.html_report?.length || 0,
          resultKeys: Object.keys(result),
        })
      }
      
      // CRITICAL: Warn if info_tab_html is missing
      if (!result.info_tab_html || result.info_tab_html.trim().length === 0) {
        storeLogger.error('CRITICAL: info_tab_html missing or empty when setting result', {
          valuationId: result.valuation_id,
          hasInfoTabHtml: !!result.info_tab_html,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
          resultKeys: Object.keys(result),
          hasHtmlReport: !!result.html_report,
          htmlReportLength: result.html_report?.length || 0,
        })
        storeLogger.error('CRITICAL: info_tab_html MISSING when setting result in store', {
          valuationId: result.valuation_id,
          hasInfoTabHtml: !!result.info_tab_html,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
          resultKeys: Object.keys(result),
          infoTabHtmlInKeys: 'info_tab_html' in result,
        })
      } else {
        storeLogger.debug('info_tab_html set in store', {
          infoTabHtmlLength: result.info_tab_html.length,
        })
      }
    } else {
      storeLogger.debug('Valuation result cleared', {
        hasResult: false,
      })
    }
    
    set({ result })
  },

  // Clear result
  clearResult: () => {
    set({ result: null })
    storeLogger.debug('Valuation result cleared')
  },
}))

