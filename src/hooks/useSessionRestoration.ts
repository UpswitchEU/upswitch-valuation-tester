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

/**
 * Check if sessionData has meaningful data (not just empty object from NEW report)
 *
 * NEW reports are created optimistically with empty sessionData: {}
 * EXISTING reports have populated sessionData with form fields, results, etc.
 *
 * @param sessionData - Session data to check
 * @returns true if sessionData has meaningful fields, false if empty (NEW report)
 */
function hasMeaningfulSessionData(sessionData: any): boolean {
  if (!sessionData || typeof sessionData !== 'object') {
    return false
  }

  const keys = Object.keys(sessionData)
  // Empty object means NEW report
  if (keys.length === 0) {
    return false
  }

  // Check if it has actual form fields (not just metadata)
  const meaningfulFields = [
    'company_name',
    'revenue',
    'ebitda',
    'business_type_id',
    'html_report',
    'info_tab_html',
    'valuation_result',
    'current_year_data',
    'historical_years_data',
  ]

  return keys.some((key) => meaningfulFields.includes(key))
}

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
 */
export function useSessionRestoration() {
  const { session, getSessionData } = useValuationSessionStore()
  const { updateFormData } = useValuationFormStore()
  const { setResult, setHtmlReport, setInfoTabHtml } = useValuationResultsStore()
  const { fetchVersions } = useVersionHistoryStore()

  // Track last restored reportId to avoid duplicate restorations
  const lastRestoredReportIdRef = useRef<string | null>(null)
  const hasRestoredFormDataRef = useRef(false)
  const hasRestoredResultsRef = useRef(false)
  const hasRestoredVersionsRef = useRef(false)

  // Reset restoration flags when reportId changes
  useEffect(() => {
    if (session?.reportId && session.reportId !== lastRestoredReportIdRef.current) {
      generalLogger.info('Report changed, resetting restoration flags', {
        previousReportId: lastRestoredReportIdRef.current,
        newReportId: session.reportId,
      })
      lastRestoredReportIdRef.current = session.reportId
      hasRestoredFormDataRef.current = false
      hasRestoredResultsRef.current = false
      hasRestoredVersionsRef.current = false
    }
  }, [session?.reportId])

  // Phase 1 & 5: Restore form data from session (complete field mapping)
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if we've already restored this report's form data
    if (lastRestoredReportIdRef.current === session.reportId && hasRestoredFormDataRef.current) {
      return
    }

    try {
      const sessionData = getSessionData()

      // CRITICAL: Skip restoration for NEW reports (empty sessionData)
      if (!sessionData || !hasMeaningfulSessionData(sessionData)) {
        generalLogger.debug('Skipping restoration - NEW report (empty sessionData)', {
          reportId: session.reportId,
        })
        return
      }

      // Convert session data to form data format - COMPLETE FIELD MAPPING
      // Includes all fields from ValuationRequest for comprehensive restoration
      // Cast sessionData to any to access fields that may not be in the type definition
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
        business_structure: sessionDataAny.business_structure || sessionData.business_type, // Fallback to business_type
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

        // Owner profiling (if collected - these may not be in ValuationRequest type)
        owner_role: sessionDataAny.owner_role,
        owner_hours: sessionDataAny.owner_hours,
        delegation_capability: sessionDataAny.delegation_capability,
        succession_plan: sessionDataAny.succession_plan,

        // Historical data flag
        provide_historical_data: sessionDataAny.provide_historical_data,

        // Other
        comparables: sessionData.comparables,
        business_context: sessionData.business_context,
      }

      // Remove undefined values (preserve existing form data when merging)
      Object.keys(formDataUpdate).forEach((key) => {
        if (formDataUpdate[key] === undefined) {
          delete formDataUpdate[key]
        }
      })

      if (Object.keys(formDataUpdate).length > 0) {
        updateFormData(formDataUpdate)
        hasRestoredFormDataRef.current = true
        generalLogger.info('Form data restored from session', {
          reportId: session.reportId,
          fieldsRestored: Object.keys(formDataUpdate).length,
          restoredFields: Object.keys(formDataUpdate),
        })
      }
    } catch (error) {
      // Phase 7: Error handling - graceful degradation
      generalLogger.error('Form data restoration failed', {
        error: error instanceof Error ? error.message : String(error),
        reportId: session.reportId,
      })
      // Continue with other restoration steps - don't block
    }
  }, [session?.reportId, session?.sessionData, getSessionData, updateFormData])

  // Phase 2 & 6: Restore valuation results from session (complete results)
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if we've already restored this report's results
    if (lastRestoredReportIdRef.current === session.reportId && hasRestoredResultsRef.current) {
      return
    }

    try {
      const sessionData = session.sessionData as any

      // CRITICAL: Skip restoration for NEW reports (empty sessionData)
      if (!hasMeaningfulSessionData(sessionData)) {
        generalLogger.debug('Skipping results restoration - NEW report (empty sessionData)', {
          reportId: session.reportId,
        })
        return
      }

      const valuationResult = sessionData?.valuation_result || (session as any).valuationResult

      // Restore complete result object (not just HTML)
      if (valuationResult) {
        const fullResult = {
          ...valuationResult,
          // Merge HTML reports if not in result object
          html_report: valuationResult.html_report || sessionData?.html_report,
          info_tab_html: valuationResult.info_tab_html || sessionData?.info_tab_html,
        }
        setResult(fullResult)
        hasRestoredResultsRef.current = true
        generalLogger.info('Valuation result restored from session', {
          reportId: session.reportId,
          valuationId: fullResult.valuation_id,
          hasHtmlReport: !!fullResult.html_report,
          hasInfoTabHtml: !!fullResult.info_tab_html,
          resultKeys: Object.keys(fullResult),
        })
      } else if (sessionData?.html_report || sessionData?.info_tab_html) {
        // Phase 6: Partial restoration - HTML exists but no result object
        // Create minimal result object with HTML reports
        if (sessionData.html_report) {
          setHtmlReport(sessionData.html_report)
          generalLogger.info('HTML report restored from session (partial)', {
            reportId: session.reportId,
            htmlLength: sessionData.html_report.length,
          })
        }
        if (sessionData.info_tab_html) {
          setInfoTabHtml(sessionData.info_tab_html)
          generalLogger.info('Info tab HTML restored from session (partial)', {
            reportId: session.reportId,
            htmlLength: sessionData.info_tab_html.length,
          })
        }
        hasRestoredResultsRef.current = true
      }
    } catch (error) {
      // Phase 7: Error handling - graceful degradation
      generalLogger.error('Results restoration failed', {
        error: error instanceof Error ? error.message : String(error),
        reportId: session.reportId,
      })
      // Continue with version restoration - don't block
    }
  }, [session?.reportId, session?.sessionData, setResult, setHtmlReport, setInfoTabHtml])

  // Phase 3: Version history auto-fetch
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if we've already fetched versions for this report
    if (lastRestoredReportIdRef.current === session.reportId && hasRestoredVersionsRef.current) {
      return
    }

    // Fetch versions asynchronously - don't block other restoration
    fetchVersions(session.reportId)
      .then(() => {
        hasRestoredVersionsRef.current = true
        generalLogger.info('Version history fetched', {
          reportId: session.reportId,
        })
      })
      .catch((error) => {
        // Phase 7: Graceful degradation - versions are optional
        generalLogger.warn('Failed to fetch versions (non-blocking)', {
          error: error instanceof Error ? error.message : String(error),
          reportId: session.reportId,
        })
        // Don't set hasRestoredVersionsRef to true on error - allow retry
      })
  }, [session?.reportId, fetchVersions])
}

