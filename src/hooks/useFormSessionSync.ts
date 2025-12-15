/**
 * useFormSessionSync Hook
 *
 * Single Responsibility: Synchronize form data with session store
 * Extracted from ValuationForm to follow SRP
 *
 * @module hooks/useFormSessionSync
 */

import { useCallback, useEffect, useState } from 'react'
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
 * Hook for synchronizing form data with session store
 *
 * Handles:
 * - Loading session data into form when switching to manual view
 * - Debounced syncing of form changes to session store
 * - Prefilling from homepage query
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

  // Load session data into form when switching to manual view (one-time)
  useEffect(() => {
    if (session && session.currentView === 'manual' && !hasLoadedSessionData) {
      const sessionData = getSessionData()
      const prefilledQuery = (session.partialData as any)?._prefilledQuery as string | undefined

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
          hasCompanyName: !!formDataUpdate.company_name,
          hasRevenue: !!formDataUpdate.revenue,
          hasBusinessType: !!formDataUpdate.business_type_id,
          fieldsLoaded: Object.keys(formDataUpdate).length,
        })
      }
    }
  }, [
    session?.currentView,
    session?.sessionId,
    session?.partialData,
    getSessionData,
    updateFormData,
    hasLoadedSessionData,
    businessTypes,
    matchBusinessType,
    session,
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
