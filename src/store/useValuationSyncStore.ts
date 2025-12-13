/**
 * Valuation Sync Store - Focused Store for Cross-Flow Data Synchronization
 *
 * Single Responsibility: Handle synchronization between manual form and conversational flow
 * SOLID Principles: SRP - Only handles sync operations and state
 *
 * @module store/useValuationSyncStore
 */

import { create } from 'zustand'
import type { ValuationFormData, ValuationRequest } from '../types/valuation'
import { storeLogger } from '../utils/logger'
import { useValuationFormStore } from './useValuationFormStore'
import { useValuationSessionStore } from './useValuationSessionStore'

interface ValuationSyncStore {
  // Sync state
  isSyncing: boolean
  syncError: string | null

  // Sync methods for cross-flow data sharing
  syncFromManualForm: () => Promise<void>
  syncToManualForm: () => void
  getCompleteness: () => number
}

/**
 * Valuation Sync Store
 *
 * Focused store handling only synchronization operations following SRP.
 * No session management, no validation - just sync logic.
 */
export const useValuationSyncStore = create<ValuationSyncStore>((set, get) => ({
  // Initial state
  isSyncing: false,
  syncError: null,

  /**
   * Sync data from manual form to session
   * Reads current form data from useValuationFormStore and updates session
   */
  syncFromManualForm: async () => {
    const sessionStore = useValuationSessionStore.getState()
    const session = sessionStore.session

    if (!session) {
      storeLogger.warn('Sync store: Cannot sync from manual form: no active session')
      return
    }

    try {
      set({ isSyncing: true, syncError: null })

      const formStore = useValuationFormStore.getState()
      const manualFormData = formStore.formData

      storeLogger.debug('Sync store: Syncing from manual form to session', {
        reportId: session.reportId,
        fieldsPresent: Object.keys(manualFormData).length,
      })

      // Convert form data to ValuationRequest format
      const sessionUpdate: Partial<ValuationRequest> = {
        company_name: manualFormData.company_name,
        country_code: manualFormData.country_code,
        industry: manualFormData.industry,
        business_model: manualFormData.business_model,
        founding_year: manualFormData.founding_year,
        current_year_data: manualFormData.current_year_data,
        historical_years_data: manualFormData.historical_years_data,
        number_of_employees: manualFormData.number_of_employees,
        number_of_owners: manualFormData.number_of_owners,
        recurring_revenue_percentage: manualFormData.recurring_revenue_percentage,
        shares_for_sale: manualFormData.shares_for_sale,
        business_type_id: manualFormData.business_type_id,
        business_context: manualFormData.business_context,
        comparables: manualFormData.comparables,
      }

      // Remove undefined values
      Object.keys(sessionUpdate).forEach((key) => {
        if (sessionUpdate[key as keyof typeof sessionUpdate] === undefined) {
          delete sessionUpdate[key as keyof typeof sessionUpdate]
        }
      })

      // Update session with merged data
      await sessionStore.updateSessionData(sessionUpdate)

      // Update lastSyncedAt
      sessionStore.session &&
        sessionStore.session.reportId === session.reportId &&
        set({
          session: {
            ...sessionStore.session,
            lastSyncedAt: new Date(),
          },
        })

      storeLogger.info('Sync store: Synced from manual form to session', {
        reportId: session.reportId,
        fieldsUpdated: Object.keys(sessionUpdate).length,
      })

      set({ isSyncing: false, syncError: null })
    } catch (error) {
      storeLogger.error('Sync store: Failed to sync from manual form', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Failed to sync from manual form',
      })
    }
  },

  /**
   * Sync data from session to manual form
   * Writes session data to useValuationFormStore for manual form display
   */
  syncToManualForm: () => {
    const sessionStore = useValuationSessionStore.getState()
    const session = sessionStore.session

    if (!session || !session.sessionData) {
      storeLogger.warn('Sync store: Cannot sync to manual form: no session data')
      return
    }

    try {
      const formStore = useValuationFormStore.getState()
      const sessionData = session.sessionData

      storeLogger.debug('Sync store: Syncing from session to manual form', {
        reportId: session.reportId,
        fieldsPresent: Object.keys(sessionData).length,
      })

      // Convert session data to form data format
      const formUpdate: Partial<ValuationFormData> = {
        company_name: sessionData.company_name,
        country_code: sessionData.country_code,
        industry: sessionData.industry,
        business_model: sessionData.business_model,
        founding_year: sessionData.founding_year,
        current_year_data: sessionData.current_year_data,
        historical_years_data: sessionData.historical_years_data,
        number_of_employees: sessionData.number_of_employees,
        number_of_owners: sessionData.number_of_owners,
        recurring_revenue_percentage: sessionData.recurring_revenue_percentage,
        shares_for_sale: sessionData.shares_for_sale,
        business_type_id: sessionData.business_type_id,
        business_context: sessionData.business_context,
        comparables: sessionData.comparables,
      }

      // Remove undefined values
      Object.keys(formUpdate).forEach((key) => {
        if (formUpdate[key as keyof typeof formUpdate] === undefined) {
          delete formUpdate[key as keyof typeof formUpdate]
        }
      })

      // Update manual form store
      formStore.updateFormData(formUpdate)

      storeLogger.info('Sync store: Synced from session to manual form', {
        reportId: session.reportId,
        fieldsUpdated: Object.keys(formUpdate).length,
      })
    } catch (error) {
      storeLogger.error('Sync store: Failed to sync to manual form', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Calculate data completeness percentage (0-100)
   * Based on required fields for valuation
   */
  getCompleteness: () => {
    const sessionStore = useValuationSessionStore.getState()
    const session = sessionStore.session

    if (!session || !session.sessionData) {
      return 0
    }

    const data = session.sessionData

    // Define required fields with weights
    const requiredFields = [
      { key: 'company_name', weight: 1 },
      { key: 'country_code', weight: 1 },
      { key: 'industry', weight: 1 },
      { key: 'business_model', weight: 1 },
      { key: 'founding_year', weight: 1 },
      { key: 'current_year_data.revenue', weight: 2 },
      { key: 'current_year_data.ebitda', weight: 2 },
    ]

    let completedWeight = 0
    let totalWeight = 0

    requiredFields.forEach(({ key, weight }) => {
      totalWeight += weight

      // Handle nested keys
      if (key.includes('.')) {
        const [parent, child] = key.split('.')
        if (
          data[parent as keyof typeof data] &&
          (data[parent as keyof typeof data] as any)[child] !== undefined &&
          (data[parent as keyof typeof data] as any)[child] !== null &&
          (data[parent as keyof typeof data] as any)[child] !== ''
        ) {
          completedWeight += weight
        }
      } else {
        if (
          data[key as keyof typeof data] !== undefined &&
          data[key as keyof typeof data] !== null &&
          data[key as keyof typeof data] !== ''
        ) {
          completedWeight += weight
        }
      }
    })

    const completeness = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0

    return completeness
  },
}))
