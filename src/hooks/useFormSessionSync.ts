/**
 * useFormSessionSync Hook
 *
 * Single Responsibility: Synchronize form data with session store
 * Extracted from ValuationForm to follow SRP
 *
 * @module hooks/useFormSessionSync
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ValuationSessionStore } from '../store/useValuationSessionStore'
import { debounce } from '../utils/debounce'
import { generalLogger } from '../utils/logger'

interface UseFormSessionSyncOptions {
  session: any
  formData: any
  updateSessionData: ValuationSessionStore['updateSessionData']
  getSessionData: ValuationSessionStore['getSessionData']
  updateFormData: (data: Partial<any>) => void
  businessTypes: any[]
  matchBusinessType: (query: string, businessTypes: any[]) => string | null
}

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
 * Hook for synchronizing form data with session store
 *
 * Handles:
 * - Loading session data into form when switching to manual view
 * - Debounced syncing of form changes to session store
 * - Prefilling from homepage query
 *
 * NOTE: For NEW reports (empty sessionData), only handles prefilledQuery matching.
 * For EXISTING reports, loads full session data.
 */
export const useFormSessionSync = ({
  session,
  formData,
  updateSessionData,
  getSessionData,
  updateFormData,
  businessTypes,
  matchBusinessType,
}: UseFormSessionSyncOptions) => {
  const [hasLoadedSessionData, setHasLoadedSessionData] = useState(false)
  const [lastLoadedReportId, setLastLoadedReportId] = useState<string | null>(null)
  // Use ref to track form data check without causing re-renders
  const hasCheckedFormDataRef = useRef(false)

  // CRITICAL FIX: Reset hasLoadedSessionData when reportId changes
  useEffect(() => {
    if (session?.reportId && session.reportId !== lastLoadedReportId) {
      generalLogger.info('Report changed, resetting form load state', {
        previousReportId: lastLoadedReportId,
        newReportId: session.reportId,
      })
      setHasLoadedSessionData(false)
      setLastLoadedReportId(session.reportId)
      hasCheckedFormDataRef.current = false // Reset check flag
    }
  }, [session?.reportId, lastLoadedReportId])

  // Load session data into form when switching to manual view OR when report loads
  // NOTE: useSessionRestoration hook (in layouts) handles comprehensive restoration
  // This hook focuses on manual flow specific needs (prefilledQuery matching) and syncing changes TO session
  useEffect(() => {
    // CRITICAL: Load data if:
    // 1. Session exists
    // 2. Current view is manual (or we're loading from home page)
    // 3. Haven't loaded this report's data yet
    // 4. Skip if useSessionRestoration has already loaded data (check if form has data)
    if (session && !hasLoadedSessionData && !hasCheckedFormDataRef.current) {
      const sessionData = getSessionData()
      const prefilledQuery = (session.partialData as any)?._prefilledQuery as string | undefined

      // CRITICAL: Skip loading for NEW reports (empty sessionData)
      // Only handle prefilledQuery matching for NEW reports
      if (!hasMeaningfulSessionData(sessionData)) {
        // NEW report - only handle prefilledQuery if present
        if (prefilledQuery && businessTypes.length > 0) {
          const matchedBusinessTypeId = matchBusinessType(prefilledQuery, businessTypes)
          if (matchedBusinessTypeId) {
            const matchedBusinessType = businessTypes.find((bt) => bt.id === matchedBusinessTypeId)
            if (matchedBusinessType) {
              const formDataUpdate: Partial<any> = {
                business_type_id: matchedBusinessTypeId,
                business_model: matchedBusinessTypeId,
                industry: matchedBusinessType.industry || matchedBusinessType.industryMapping,
              }
              updateFormData(formDataUpdate)
              generalLogger.info('Prefilled business type from homepage query (NEW report)', {
                query: prefilledQuery,
                businessTypeId: matchedBusinessTypeId,
                businessTypeTitle: matchedBusinessType.title || matchedBusinessType.id,
              })
            }
          }
        }
        setHasLoadedSessionData(true)
        hasCheckedFormDataRef.current = true
        return
      }

      // EXISTING report - proceed with full restoration
      // Check if form already has data (indicating useSessionRestoration already ran)
      // If form has significant data, skip this load to avoid conflicts
      // Only check once per reportId to prevent infinite loops
      const hasExistingFormData = formData?.company_name || formData?.revenue || formData?.business_type_id
      if (hasExistingFormData && !prefilledQuery) {
        generalLogger.debug('Skipping form load - useSessionRestoration already loaded data', {
          reportId: session.reportId,
        })
        setHasLoadedSessionData(true) // Mark as loaded to prevent future loads
        hasCheckedFormDataRef.current = true // Mark as checked
        return
      }
      hasCheckedFormDataRef.current = true // Mark as checked even if we proceed

      generalLogger.info('Attempting to load session data into form', {
        reportId: session.reportId,
        currentView: session.currentView,
        hasSessionData: !!sessionData,
        hasPrefilledQuery: !!prefilledQuery,
        hasExistingFormData,
      })

      // Convert ValuationRequest to ValuationFormData format
      const formDataUpdate: Partial<any> = {
        company_name: sessionData?.company_name,
        country_code: sessionData?.country_code,
        industry: sessionData?.industry,
        business_model: sessionData?.business_model,
        founding_year: sessionData?.founding_year,
        revenue: sessionData?.current_year_data?.revenue || (sessionData as any)?.revenue,
        ebitda: sessionData?.current_year_data?.ebitda || (sessionData as any)?.ebitda,
        current_year_data: sessionData?.current_year_data,
        historical_years_data: sessionData?.historical_years_data,
        number_of_employees: sessionData?.number_of_employees,
        number_of_owners: sessionData?.number_of_owners,
        recurring_revenue_percentage: sessionData?.recurring_revenue_percentage,
        comparables: sessionData?.comparables,
        business_type_id: sessionData?.business_type_id,
        business_type: sessionData?.business_type,
        shares_for_sale: sessionData?.shares_for_sale,
      }

      // If we have a prefilledQuery from homepage and no business_type_id yet, try to match it
      if (prefilledQuery && !formDataUpdate.business_type_id && businessTypes.length > 0) {
        const matchedBusinessTypeId = matchBusinessType(prefilledQuery, businessTypes)
        if (matchedBusinessTypeId) {
          const matchedBusinessType = businessTypes.find((bt) => bt.id === matchedBusinessTypeId)
          if (matchedBusinessType) {
            formDataUpdate.business_type_id = matchedBusinessTypeId
            formDataUpdate.business_model = matchedBusinessTypeId
            formDataUpdate.industry =
              matchedBusinessType.industry || matchedBusinessType.industryMapping
            generalLogger.info('Prefilled business type from homepage query', {
              query: prefilledQuery,
              businessTypeId: matchedBusinessTypeId,
              businessTypeTitle: matchedBusinessType.title || matchedBusinessType.id,
            })
          }
        }
      }

      // Remove undefined values
      Object.keys(formDataUpdate).forEach((key) => {
        if (formDataUpdate[key] === undefined) {
          delete formDataUpdate[key]
        }
      })

      if (Object.keys(formDataUpdate).length > 0) {
        updateFormData(formDataUpdate)
        setHasLoadedSessionData(true)

        generalLogger.info('Loaded session data into form', {
          reportId: session.reportId,
          hasCompanyName: !!formDataUpdate.company_name,
          hasRevenue: !!formDataUpdate.revenue,
          hasBusinessType: !!formDataUpdate.business_type_id,
          fieldsLoaded: Object.keys(formDataUpdate).length,
          fields: Object.keys(formDataUpdate),
        })
      } else {
        generalLogger.warn('No form data to load from session', {
          reportId: session.reportId,
          hasSessionData: !!sessionData,
          sessionDataKeys: sessionData ? Object.keys(sessionData) : [],
        })
      }
    }
    // CRITICAL: Do NOT include formData in dependencies to prevent infinite loops
    // formData is checked once via ref, not on every change
  }, [
    session?.reportId, // CRITICAL: Add reportId to trigger on report change
    session?.currentView,
    session?.sessionId,
    session?.partialData,
    session?.sessionData, // CRITICAL: Add sessionData to trigger when data loads
    getSessionData,
    updateFormData,
    hasLoadedSessionData,
    businessTypes,
    matchBusinessType,
    session,
    // formData intentionally excluded to prevent infinite loops
  ])

  // Debounced sync form data to session store (500ms delay)
  // CRITICAL FIX: Include all dependencies to prevent stale closures
  const debouncedSyncToSession = useCallback(
    debounce(async (data: typeof formData) => {
      if (!session || !data || Object.keys(data).length === 0) {
        return
      }

      try {
        // Convert ValuationFormData to Partial<ValuationRequest> for session
        const sessionUpdate: Partial<any> = {
          company_name: data.company_name,
          country_code: data.country_code,
          industry: data.industry,
          business_model: data.business_model,
          founding_year: data.founding_year,
          current_year_data: {
            year: data.current_year_data?.year || new Date().getFullYear(),
            revenue: data.revenue || data.current_year_data?.revenue || 0,
            ebitda: data.ebitda || data.current_year_data?.ebitda || 0,
            ...(data.current_year_data?.total_assets && {
              total_assets: data.current_year_data.total_assets,
            }),
            ...(data.current_year_data?.total_debt && {
              total_debt: data.current_year_data.total_debt,
            }),
            ...(data.current_year_data?.cash && { cash: data.current_year_data.cash }),
          },
          historical_years_data: data.historical_years_data,
          number_of_employees: data.number_of_employees,
          number_of_owners: data.number_of_owners,
          recurring_revenue_percentage: data.recurring_revenue_percentage,
          comparables: data.comparables,
          business_type_id: data.business_type_id,
          business_type: data.business_type,
          shares_for_sale: data.shares_for_sale,
          business_context: data.business_context,
        }

        // Remove undefined values
        Object.keys(sessionUpdate).forEach((key) => {
          if (sessionUpdate[key] === undefined) {
            delete sessionUpdate[key]
          }
        })

        await updateSessionData(sessionUpdate)
        generalLogger.debug('Synced form data to session', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(sessionUpdate).length,
        })
      } catch (err) {
        generalLogger.warn('Failed to sync form data to session', { error: err })
      }
    }, 500),
    [session, updateSessionData]
  )

  // Sync form data to session store whenever it changes (debounced)
  useEffect(() => {
    if (hasLoadedSessionData && formData && Object.keys(formData).length > 0) {
      debouncedSyncToSession(formData)
    }
  }, [formData, debouncedSyncToSession, hasLoadedSessionData])

  return { hasLoadedSessionData }
}
