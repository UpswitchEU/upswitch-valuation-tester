/**
 * useSessionRestoration Hook
 *
 * Single Responsibility: Automatically restore form data, results, and versions from session
 * Uses Zustand stores for simple and robust state management
 *
 * This hook watches the session store and automatically:
 * 1. Restores form data to form store when session loads
 * 2. Restores valuation results to results store when session loads
 * 3. Fetches version history when session loads
 * 4. Handles report changes smoothly
 *
 * Restoration Order: session -> form -> results -> versions
 *
 * @module hooks/useSessionRestoration
 */

import { useEffect, useRef } from 'react'
import { useValuationFormStore } from '../store/useValuationFormStore'
import { useValuationResultsStore } from '../store/useValuationResultsStore'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import { useVersionHistoryStore } from '../store/useVersionHistoryStore'
import { generalLogger } from '../utils/logger'
import { hasMeaningfulSessionData } from '../utils/sessionDataUtils'

/**
 * Hook to automatically restore form data, results, and versions from session
 *
 * This ensures smooth repopulation when:
 * - Page reloads
 * - User revisits a report
 * - Session data loads from backend
 *
 * Uses Zustand stores for simple, robust state management
 *
 * NOTE: Only restores for EXISTING reports (with meaningful sessionData).
 * NEW reports (empty sessionData) skip restoration entirely.
 * 
 * SIMPLIFIED: Single restoration per reportId - no complex flag management.
 */
export function useSessionRestoration() {
  const { session, getSessionData } = useValuationSessionStore()
  const { updateFormData } = useValuationFormStore()
  const { setResult, setHtmlReport, setInfoTabHtml } = useValuationResultsStore()
  const { fetchVersions } = useVersionHistoryStore()

  // Track restored reports using a Set (simple and efficient)
  const restoredReports = useRef<Set<string>>(new Set())

  // Single restoration effect - runs once per reportId
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if already restored this report
    if (restoredReports.current.has(session.reportId)) {
      return
    }

    const sessionData = getSessionData()

    // CRITICAL: Skip restoration for NEW reports (empty sessionData)
    if (!sessionData || !hasMeaningfulSessionData(sessionData)) {
      generalLogger.debug('Skipping restoration - NEW report (empty sessionData)', {
        reportId: session.reportId,
      })
      // Mark as restored to prevent re-checking
      restoredReports.current.add(session.reportId)
      return
    }

    // Mark as restoring immediately to prevent duplicates
    restoredReports.current.add(session.reportId)

    generalLogger.info('Starting session restoration', {
      reportId: session.reportId,
      hasSessionData: !!sessionData,
      sessionDataKeys: Object.keys(sessionData || {}),
    })

    try {
      // STEP 1: Restore form data
      restoreFormData(session.reportId, sessionData, updateFormData)

      // STEP 2: Restore valuation results
      restoreResults(session.reportId, sessionData, setResult, setHtmlReport, setInfoTabHtml)

      // STEP 3: Fetch version history (async, non-blocking)
      fetchVersions(session.reportId)
        .then(() => {
          generalLogger.info('Version history fetched', {
            reportId: session.reportId,
          })
        })
        .catch((error) => {
          generalLogger.warn('Failed to fetch versions (non-blocking)', {
            error: error instanceof Error ? error.message : String(error),
            reportId: session.reportId,
          })
        })

      generalLogger.info('Session restoration completed', {
        reportId: session.reportId,
      })
    } catch (error) {
      generalLogger.error('Session restoration failed', {
        error: error instanceof Error ? error.message : String(error),
        reportId: session.reportId,
      })
      // Remove from restored set to allow retry on next mount
      restoredReports.current.delete(session.reportId)
    }
  }, [session?.reportId, session?.sessionData, getSessionData, updateFormData, setResult, setHtmlReport, setInfoTabHtml, fetchVersions])
}

/**
 * Helper: Restore form data from session to form store
 */
function restoreFormData(
  reportId: string,
  sessionData: any,
  updateFormData: (data: Partial<any>) => void
) {
  try {
    // Convert session data to form data format - COMPLETE FIELD MAPPING
    const sessionDataAny = sessionData as any
    const formDataUpdate: Partial<any> = {
      // Basic company information
      company_name: sessionData.company_name,
      country_code: sessionData.country_code,
      industry: sessionData.industry,
      business_model: sessionData.business_model,
      founding_year: sessionData.founding_year,

      // Business details
      business_type: sessionData.business_type,
      business_type_id: sessionData.business_type_id,
      business_structure: sessionDataAny.business_structure || sessionData.business_type,
      business_description: sessionData.business_description,
      business_highlights: sessionData.business_highlights,
      reason_for_selling: sessionData.reason_for_selling,

      // Location
      city: sessionData.city,

      // Financials (handle both nested and flat structures)
      revenue: sessionData.current_year_data?.revenue || sessionDataAny.revenue,
      ebitda: sessionData.current_year_data?.ebitda || sessionDataAny.ebitda,
      current_year_data: sessionData.current_year_data,
      historical_years_data: sessionData.historical_years_data,
      recurring_revenue_percentage: sessionData.recurring_revenue_percentage,

      // Ownership
      number_of_employees: sessionData.number_of_employees,
      number_of_owners: sessionData.number_of_owners,
      shares_for_sale: sessionData.shares_for_sale,

      // Owner profiling
      owner_role: sessionDataAny.owner_role,
      owner_hours: sessionDataAny.owner_hours,
      delegation_capability: sessionDataAny.delegation_capability,
      succession_plan: sessionDataAny.succession_plan,
      provide_historical_data: sessionDataAny.provide_historical_data,

      // Other
      comparables: sessionData.comparables,
      business_context: sessionData.business_context,
    }

    // Remove undefined values
    Object.keys(formDataUpdate).forEach((key) => {
      if (formDataUpdate[key] === undefined) {
        delete formDataUpdate[key]
      }
    })

    if (Object.keys(formDataUpdate).length > 0) {
      updateFormData(formDataUpdate)
      generalLogger.info('Form data restored from session', {
        reportId,
        fieldsRestored: Object.keys(formDataUpdate).length,
        companyName: formDataUpdate.company_name,
        hasRevenue: !!formDataUpdate.revenue,
      })
    }
  } catch (error) {
    generalLogger.error('Form data restoration failed', {
      error: error instanceof Error ? error.message : String(error),
      reportId,
    })
  }
}

/**
 * Helper: Restore valuation results from session to results store
 */
function restoreResults(
  reportId: string,
  sessionData: any,
  setResult: (result: any) => void,
  setHtmlReport: (html: string) => void,
  setInfoTabHtml: (html: string) => void
) {
  try {
    const valuationResult = sessionData?.valuation_result || (sessionData as any).valuationResult

    // Restore complete result object (not just HTML)
    if (valuationResult) {
      const fullResult = {
        ...valuationResult,
        // Merge HTML reports if not in result object
        html_report: valuationResult.html_report || sessionData?.html_report,
        info_tab_html: valuationResult.info_tab_html || sessionData?.info_tab_html,
      }
      setResult(fullResult)
      generalLogger.info('Valuation result restored from session', {
        reportId,
        valuationId: fullResult.valuation_id,
        hasHtmlReport: !!fullResult.html_report,
        htmlLength: fullResult.html_report?.length || 0,
        hasInfoTabHtml: !!fullResult.info_tab_html,
        infoLength: fullResult.info_tab_html?.length || 0,
      })
    } else if (sessionData?.html_report || sessionData?.info_tab_html) {
      // Partial restoration - HTML exists but no result object
      if (sessionData.html_report) {
        setHtmlReport(sessionData.html_report)
        generalLogger.info('HTML report restored from session (partial)', {
          reportId,
          htmlLength: sessionData.html_report.length,
        })
      }
      if (sessionData.info_tab_html) {
        setInfoTabHtml(sessionData.info_tab_html)
        generalLogger.info('Info tab HTML restored from session (partial)', {
          reportId,
          infoLength: sessionData.info_tab_html.length,
        })
      }
    }
  } catch (error) {
    generalLogger.error('Results restoration failed', {
      error: error instanceof Error ? error.message : String(error),
      reportId,
    })
  }
}

