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
import { debounce } from '../utils/debounce'
import { generalLogger } from '../utils/logger'

interface UseFormSessionSyncOptions {
  session: any
  formData: any
  updateSessionData: (data: Partial<any>) => Promise<void>
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

  // Helper to check if form data matches session data (prevent unnecessary syncs)
  const isDataEqual = useCallback((formData: any, sessionData: any): boolean => {
    if (!sessionData || !formData) return false
    
    // Compare key fields that indicate meaningful changes
    const keyFields = ['company_name', 'revenue', 'ebitda', 'industry', 'business_model', 'founding_year']
    
    for (const field of keyFields) {
      if (formData[field] !== sessionData[field]) {
        return false
      }
    }
    
    // Compare current_year_data
    if (formData.current_year_data?.revenue !== sessionData.current_year_data?.revenue ||
        formData.current_year_data?.ebitda !== sessionData.current_year_data?.ebitda) {
      return false
    }
    
    return true
  }, [])

  // Debounced sync: form data → session store (500ms delay)
  const debouncedSyncToSession = useCallback(
    debounce(async (data: typeof formData) => {
      if (!session || !data || Object.keys(data).length === 0) {
        return
      }

      // Skip sync if data matches what's already in session (prevents loops during restoration)
      if (session.sessionData && isDataEqual(data, session.sessionData)) {
        generalLogger.debug('Skipping sync - form data matches session data', {
          reportId: session.reportId,
        })
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
    [session, updateSessionData, isDataEqual]
  )

  // Sync form data to session store whenever it changes (debounced)
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      debouncedSyncToSession(formData)
    }
  }, [formData, debouncedSyncToSession])
}
