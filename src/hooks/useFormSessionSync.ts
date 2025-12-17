/**
 * useFormSessionSync Hook
 *
 * ROOT CAUSE FIX: Removed session object dependency to prevent render loops
 * 
 * Single Responsibility - Sync form changes TO session (one direction only)
 * Restoration is handled by useSessionRestoration hook.
 * This hook ONLY syncs form changes to session store (debounced).
 *
 * Key Changes:
 * - No longer subscribes to session object (prevents re-renders)
 * - Reads session state internally via getState() when needed
 * - Only subscribes to formData changes
 *
 * @module hooks/useFormSessionSync
 */

import { useCallback, useEffect } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import { debounce } from '../utils/debounce'
import { generalLogger } from '../utils/logger'

interface UseFormSessionSyncOptions {
  reportId: string | null | undefined
  formData: any
}

/**
 * Hook for synchronizing form data changes TO session store
 *
 * ROOT CAUSE FIX: Reads session state internally to prevent component re-renders
 * Only subscribes to formData changes, not session changes
 * Restoration (session → form) is handled by useSessionRestoration hook
 */
export const useFormSessionSync = ({
  reportId,
  formData,
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
  // CRITICAL: Read session state inside the debounced function, not as a dependency
  // This prevents the component from re-rendering when session updates
  const debouncedSyncToSession = useCallback(
    debounce(async (data: typeof formData) => {
      // Read session state inside the debounced function (not subscribed)
      const currentSession = useSessionStore.getState().session
      const updateSessionData = useSessionStore.getState().updateSessionData
      
      if (!currentSession || !reportId || currentSession.reportId !== reportId) {
        return
      }

      if (!data || Object.keys(data).length === 0) {
        return
      }

      // Skip sync if data matches what's already in session (prevents loops during restoration)
      if (currentSession.sessionData && isDataEqual(data, currentSession.sessionData)) {
        generalLogger.debug('Skipping sync - form data matches session data', {
          reportId: currentSession.reportId,
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
          reportId: currentSession.reportId,
          fieldsUpdated: Object.keys(sessionUpdate).length,
        })
      } catch (err) {
        generalLogger.warn('Failed to sync form data to session', { error: err })
      }
    }, 500),
    [reportId, isDataEqual] // Only depend on reportId and isDataEqual, not session
  )

  // Sync form data to session store whenever it changes (debounced)
  // CRITICAL: Only subscribes to formData, not session
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0 && reportId) {
      debouncedSyncToSession(formData)
    }
  }, [formData, debouncedSyncToSession, reportId])
}
