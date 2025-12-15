/**
 * useSessionRestoration Hook
 *
 * Single Responsibility: Automatically restore form data and results from session
 * Uses Zustand stores for simple and robust state management
 *
 * This hook watches the session store and automatically:
 * 1. Restores form data to form store when session loads
 * 2. Restores valuation results to results store when session loads
 * 3. Handles report changes smoothly
 *
 * @module hooks/useSessionRestoration
 */

import { useEffect, useRef } from 'react'
import { useValuationFormStore } from '../store/useValuationFormStore'
import { useValuationResultsStore } from '../store/useValuationResultsStore'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import { generalLogger } from '../utils/logger'

/**
 * Hook to automatically restore form data and results from session
 *
 * This ensures smooth repopulation when:
 * - Page reloads
 * - User revisits a report
 * - Session data loads from backend
 *
 * Uses Zustand stores for simple, robust state management
 */
export function useSessionRestoration() {
  const { session, getSessionData } = useValuationSessionStore()
  const { updateFormData } = useValuationFormStore()
  const { setResult, setHtmlReport, setInfoTabHtml } = useValuationResultsStore()

  // Track last restored reportId to avoid duplicate restorations
  const lastRestoredReportIdRef = useRef<string | null>(null)
  const hasRestoredFormDataRef = useRef(false)
  const hasRestoredResultsRef = useRef(false)

  // Restore form data from session
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if we've already restored this report's form data
    if (lastRestoredReportIdRef.current === session.reportId && hasRestoredFormDataRef.current) {
      return
    }

    const sessionData = getSessionData()
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return
    }

    // Convert session data to form data format
    const formDataUpdate: Partial<any> = {
      company_name: sessionData.company_name,
      country_code: sessionData.country_code,
      industry: sessionData.industry,
      business_model: sessionData.business_model,
      founding_year: sessionData.founding_year,
      revenue: sessionData.current_year_data?.revenue || (sessionData as any)?.revenue,
      ebitda: sessionData.current_year_data?.ebitda || (sessionData as any)?.ebitda,
      current_year_data: sessionData.current_year_data,
      historical_years_data: sessionData.historical_years_data,
      number_of_employees: sessionData.number_of_employees,
      number_of_owners: sessionData.number_of_owners,
      recurring_revenue_percentage: sessionData.recurring_revenue_percentage,
      comparables: sessionData.comparables,
      business_type_id: sessionData.business_type_id,
      business_type: sessionData.business_type,
      shares_for_sale: sessionData.shares_for_sale,
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
      hasRestoredFormDataRef.current = true
      generalLogger.info('Form data restored from session', {
        reportId: session.reportId,
        fieldsRestored: Object.keys(formDataUpdate).length,
      })
    }
  }, [session?.reportId, session?.sessionData, getSessionData, updateFormData])

  // Restore valuation results from session
  useEffect(() => {
    if (!session?.reportId) {
      return
    }

    // Skip if we've already restored this report's results
    if (lastRestoredReportIdRef.current === session.reportId && hasRestoredResultsRef.current) {
      return
    }

    const sessionData = session.sessionData as any
    const valuationResult = sessionData?.valuation_result || (session as any).valuationResult

    // Restore HTML reports if available
    if (sessionData?.html_report) {
      setHtmlReport(sessionData.html_report)
      generalLogger.info('HTML report restored from session', {
        reportId: session.reportId,
        htmlLength: sessionData.html_report.length,
      })
    }

    if (sessionData?.info_tab_html) {
      setInfoTabHtml(sessionData.info_tab_html)
      generalLogger.info('Info tab HTML restored from session', {
        reportId: session.reportId,
        htmlLength: sessionData.info_tab_html.length,
      })
    }

    // Restore valuation result
    if (valuationResult) {
      const fullResult = {
        ...valuationResult,
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
      })
    }
  }, [session?.reportId, session?.sessionData, setResult, setHtmlReport, setInfoTabHtml])

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
    }
  }, [session?.reportId])
}

