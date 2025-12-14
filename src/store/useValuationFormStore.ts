/**
 * Valuation Form Store - Focused Store for Form Data Management
 *
 * Single Responsibility: Manage form data, collected data, and form operations
 * SOLID Principles: SRP - Only handles form-related state and actions
 *
 * @module store/useValuationFormStore
 */

import { create } from 'zustand'
import type { DataResponse } from '../types/data-collection'
import type { ValuationFormData } from '../types/valuation'
import { storeLogger } from '../utils/logger'

// Helper to get safe current year (allow up to current year, max 2100 per backend validation)
const getSafeCurrentYear = () => Math.min(new Date().getFullYear(), 2100)

const defaultFormData: Partial<ValuationFormData> = {
  company_name: '', // Empty by default - user must enter company name
  country_code: 'BE',
  industry: 'services', // Default to valid industry code
  business_model: 'services', // Default business model (matches Python enum)
  founding_year: getSafeCurrentYear() - 5, // Default to 5 years ago
  business_type: 'company',
  shares_for_sale: 100,
  number_of_owners: 1, // Default to 1 owner
  revenue: undefined,
  ebitda: undefined,
  current_year_data: {
    year: getSafeCurrentYear(),
    revenue: 0,
    ebitda: 0,
  },
}

interface ValuationFormStore {
  // Collected data from data collection components
  collectedData: DataResponse[]
  setCollectedData: (data: DataResponse[]) => void

  // Form data
  formData: Partial<ValuationFormData>
  updateFormData: (data: Partial<ValuationFormData>) => void
  resetFormData: () => void

  // Pre-fill form data with business card data
  prefillFromBusinessCard: (businessCard: {
    company_name: string
    industry: string
    business_model: string
    founding_year: number
    country_code: string
    employee_count?: number
  }) => void
}

/**
 * Valuation Form Store
 *
 * Focused store handling only form data management following SRP.
 * No API calls, no results management, no UI state - just form data.
 */
export const useValuationFormStore = create<ValuationFormStore>((set, get) => ({
  // Collected data from data collection components (for ValuationFlow compatibility)
  collectedData: [],
  setCollectedData: (data: DataResponse[]) => {
    storeLogger.debug('Form store: Collected data updated', {
      dataPoints: data.length,
      fields: data.map(d => d.fieldId)
    })
    set({ collectedData: data })
  },

  // Form data
  formData: defaultFormData,
  updateFormData: (data) => {
    storeLogger.debug('Form store: Form data updated', {
      updatedFields: Object.keys(data)
    })
    set((state) => ({
      formData: { ...state.formData, ...data },
    }))
  },
  resetFormData: () => {
    storeLogger.info('Form store: Form data reset to defaults')
    set({ formData: defaultFormData, collectedData: [] })
  },

  // Pre-fill form data with business card data
  prefillFromBusinessCard: (businessCard) => {
    storeLogger.info('Form store: Pre-filling form from business card', {
      companyName: businessCard.company_name,
      industry: businessCard.industry
    })
    set((state) => ({
      formData: {
        ...state.formData,
        company_name: businessCard.company_name,
        industry: businessCard.industry,
        business_model: businessCard.business_model,
        founding_year: businessCard.founding_year,
        country_code: businessCard.country_code,
        number_of_employees: businessCard.employee_count,
      },
    }))
  },
}))