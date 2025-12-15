/**
 * useFormSessionSync Hook
 *
 * SIMPLIFIED: Single Responsibility - Sync form changes TO session (one direction only)
 * 
 * Restoration is handled by useSessionRestoration hook.
 * This hook ONLY syncs form changes to session store (debounced).
 *
 * @module hooks/useFormSessionSync
 */

import { useCallback, useEffect } from 'react'
import type { ValuationSessionStore } from '../store/useValuationSessionStore'
import { debounce } from '../utils/debounce'
import { generalLogger } from '../utils/logger'

interface UseFormSessionSyncOptions {
  session: any
  formData: any
  updateSessionData: ValuationSessionStore['updateSessionData']
}

/**
 * Hook for synchronizing form data changes TO session store
 *
 * SIMPLIFIED: Only handles form → session sync (debounced)
 * Restoration (session → form) is handled by useSessionRestoration hook
 */
export const useFormSessionSync = ({
  session,
  formData,
  updateSessionData,
}: UseFormSessionSyncOptions) => {

  // Debounced sync: form data → session store (500ms delay)
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
    if (formData && Object.keys(formData).length > 0) {
      debouncedSyncToSession(formData)
    }
  }, [formData, debouncedSyncToSession])
}
