/**
 * ValuationForm Component
 *
 * Main form for entering business valuation data.
 * Single Responsibility: Form orchestration and state management.
 *
 * Uses refactored stores:
 * - useValuationFormStore for form data state
 * - useValuationSessionStore for session sync
 * - useValuationApiStore for calculation
 * - useFormSessionSync hook for syncing with session
 *
 * @module components/ValuationForm/ValuationForm
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useBusinessTypes } from '../../hooks/useBusinessTypes'
import { useFormSessionSync } from '../../hooks/useFormSessionSync'
import type { BusinessType } from '../../services/businessTypesApi'
import { useValuationApiStore } from '../../store/useValuationApiStore'
import { useValuationFormStore } from '../../store/useValuationFormStore'
import { useValuationSessionStore } from '../../store/useValuationSessionStore'
import { debounce } from '../../utils/debounce'
import { generalLogger } from '../../utils/logger'
import { useValuationFormSubmission } from './hooks/useValuationFormSubmission'
import { BasicInformationSection } from './sections/BasicInformationSection'
import { FinancialDataSection } from './sections/FinancialDataSection'
import { FormSubmitSection } from './sections/FormSubmitSection'
import { HistoricalDataSection } from './sections/HistoricalDataSection'
import { OwnershipStructureSection } from './sections/OwnershipStructureSection'
import { convertFormDataToDataResponses } from './utils/convertFormDataToDataResponses'

/**
 * ValuationForm Component
 *
 * Main form for entering business valuation data.
 * Orchestrates all form sections and manages form-level state.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, prefillFromBusinessCard, setCollectedData } = useValuationFormStore()
  const { session, updateSessionData, getSessionData } = useValuationSessionStore()
  const { error, clearError } = useValuationApiStore()
  const { businessTypes } = useBusinessTypes()
  const { businessCard, isAuthenticated } = useAuth()

  // Local state for historical data inputs
  const [historicalInputs, setHistoricalInputs] = useState<{ [key: string]: string }>({})
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false)
  const [employeeCountError, setEmployeeCountError] = useState<string | null>(null)

  // Match business type string to business_type_id
  const matchBusinessType = useCallback(
    (query: string, businessTypes: BusinessType[]): string | null => {
      if (!query || !businessTypes || businessTypes.length === 0) return null

      const queryLower = query.toLowerCase().trim()

      // 1. Exact match on title (case-insensitive)
      const exactMatch = businessTypes.find((bt) => bt.title.toLowerCase() === queryLower)
      if (exactMatch) {
        generalLogger.info('Matched business type (exact)', {
          query,
          matched: exactMatch.title,
          id: exactMatch.id,
        })
        return exactMatch.id
      }

      // 2. Match on keywords
      const keywordMatch = businessTypes.find((bt) =>
        bt.keywords &&
        bt.keywords.some(
          (keyword: string) =>
            keyword.toLowerCase() === queryLower ||
            queryLower.includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(queryLower)
        )
      )
      if (keywordMatch) {
        generalLogger.info('Matched business type (keyword)', {
          query,
          matched: keywordMatch.title,
          id: keywordMatch.id,
        })
        return keywordMatch.id
      }

      // 3. Partial match on title (contains)
      const partialMatch = businessTypes.find(
        (bt) =>
          bt.title.toLowerCase().includes(queryLower) ||
          queryLower.includes(bt.title.toLowerCase())
      )
      if (partialMatch) {
        generalLogger.info('Matched business type (partial)', {
          query,
          matched: partialMatch.title,
          id: partialMatch.id,
        })
        return partialMatch.id
      }

      // 4. Common variations mapping
      const variations: Record<string, string[]> = {
        saas: ['saas', 'software as a service', 'software service'],
        restaurant: ['restaurant', 'cafe', 'bistro', 'dining'],
        'e-commerce': ['e-commerce', 'ecommerce', 'online store', 'online shop'],
        manufacturing: ['manufacturing', 'manufacturer', 'production'],
        consulting: ['consulting', 'consultant', 'advisory'],
        'tech startup': ['tech startup', 'startup', 'tech company'],
      }

      for (const [key, variants] of Object.entries(variations)) {
        if (variants.some((v) => queryLower.includes(v))) {
          const variationMatch = businessTypes.find(
            (bt) =>
              bt.title.toLowerCase().includes(key) ||
              bt.keywords?.some((k: string) => k.toLowerCase().includes(key))
          )
          if (variationMatch) {
            generalLogger.info('Matched business type (variation)', {
              query,
              matched: variationMatch.title,
              id: variationMatch.id,
            })
            return variationMatch.id
          }
        }
      }

      generalLogger.warn('No business type match found', { query })
      return null
    },
    []
  )

  // Use form session sync hook for loading session data and syncing changes
  useFormSessionSync({
    session,
    formData,
    updateSessionData,
    getSessionData,
    updateFormData,
    businessTypes,
    matchBusinessType,
  })

  // Sync formData to DataResponse[] format (unified pipeline)
  // Debounced to avoid excessive updates during typing
  const debouncedSyncToDataCollection = useCallback(
    debounce(async (data: typeof formData) => {
      if (!data || Object.keys(data).length === 0) {
        return
      }

      try {
        const dataResponses = convertFormDataToDataResponses(data)
        setCollectedData(dataResponses)
        generalLogger.debug('Synced formData to DataResponse[]', {
          responseCount: dataResponses.length,
        })
      } catch (err) {
        generalLogger.warn('Failed to sync formData to DataResponse[]', { error: err })
      }
    }, 500),
    [setCollectedData]
  )

  // Sync formData to DataResponse[] whenever it changes (debounced)
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      debouncedSyncToDataCollection(formData)
    }
  }, [formData, debouncedSyncToDataCollection])

  // Convert historicalInputs to formData.historical_years_data
  // Backend requires chronological order (oldest first), but UI shows most recent first
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const historicalYears: { year: number; revenue: number; ebitda: number }[] = []

    // Extract all years from historicalInputs
    const yearSet = new Set<number>()
    Object.keys(historicalInputs).forEach((key) => {
      const match = key.match(/^(\d{4})_(revenue|ebitda)$/)
      if (match) {
        const year = parseInt(match[1])
        if (year >= 2000 && year <= currentYear) {
          yearSet.add(year)
        }
      }
    })

    // Build historical_years_data array
    yearSet.forEach((year) => {
      const revenueKey = `${year}_revenue`
      const ebitdaKey = `${year}_ebitda`
      const revenue = historicalInputs[revenueKey]
      const ebitda = historicalInputs[ebitdaKey]

      // Only include if at least one field has a value
      if (revenue || ebitda) {
        historicalYears.push({
          year,
          revenue: revenue ? parseFloat(revenue.replace(/,/g, '')) || 0 : 0,
          ebitda: ebitda ? parseFloat(ebitda.replace(/,/g, '')) || 0 : 0,
        })
      }
    })

    // Sort chronologically (oldest first) for backend compatibility
    historicalYears.sort((a, b) => a.year - b.year)

    // Update formData with sorted historical data
    if (historicalYears.length > 0) {
      updateFormData({
        historical_years_data: historicalYears,
      })
    } else {
      updateFormData({
        historical_years_data: undefined,
      })
    }
  }, [historicalInputs, updateFormData])

  // Clear owner concentration fields when switching to sole-trader
  // Set defaults when switching to company
  useEffect(() => {
    if (formData.business_type === 'sole-trader') {
      // Clear owner concentration fields (not applicable for sole traders)
      if (formData.number_of_employees !== undefined || formData.number_of_owners !== undefined) {
        updateFormData({
          number_of_employees: undefined,
          number_of_owners: undefined,
        })
      }
    } else if (formData.business_type === 'company') {
      // Set default number_of_owners if not already set (minimum 1 for companies)
      if (!formData.number_of_owners || formData.number_of_owners < 1) {
        updateFormData({ number_of_owners: 1 })
      }
    }
  }, [formData.business_type, updateFormData])

  // Pre-fill form with business card data when authenticated
  useEffect(() => {
    generalLogger.debug('Pre-fill check', {
      isAuthenticated,
      hasBusinessCard: !!businessCard,
      hasPrefilledOnce,
      businessCard,
    })

    if (isAuthenticated && businessCard && !hasPrefilledOnce && businessTypes.length > 0) {
      generalLogger.info('Pre-filling form with business card data', {
        ...businessCard,
        employee_count: businessCard.employee_count
          ? `${businessCard.employee_count} employees`
          : 'not available',
      })

      // First, use standard prefill
      prefillFromBusinessCard(businessCard)

      // Then, try to match business_type_id if available
      if ((businessCard as any).business_type_id) {
        const matchingType = businessTypes.find(
          (bt) => bt.id === (businessCard as any).business_type_id
        )

        if (matchingType) {
          generalLogger.info('Found matching business type from profile', {
            id: matchingType.id,
            title: matchingType.title,
          })

          updateFormData({
            business_type_id: matchingType.id,
            business_model: matchingType.id,
            industry: matchingType.industry || matchingType.industryMapping || businessCard.industry,
            subIndustry: matchingType.category,
          })
        }
      } else if (businessCard.industry) {
        // Fallback: Try to find matching business type by industry
        const matchingType = businessTypes.find(
          (bt) => bt.industry === businessCard.industry || bt.industryMapping === businessCard.industry
        )

        if (matchingType) {
          generalLogger.info('Found matching business type by industry', {
            id: matchingType.id,
            title: matchingType.title,
            industry: businessCard.industry,
          })

          updateFormData({
            business_type_id: matchingType.id,
            business_model: matchingType.id,
          })
        }
      }

      setHasPrefilledOnce(true)
    }
  }, [
    isAuthenticated,
    businessCard,
    hasPrefilledOnce,
    prefillFromBusinessCard,
    businessTypes,
    updateFormData,
  ])

  // Use form submission hook
  const { handleSubmit, isSubmitting } = useValuationFormSubmission(setEmployeeCountError)

  // Get business types loading/error state
  const { loading: businessTypesLoading, error: businessTypesError } = useBusinessTypes()

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-12 @container">
      <BasicInformationSection
        formData={formData}
        updateFormData={updateFormData}
        businessTypes={businessTypes}
        businessTypesLoading={businessTypesLoading}
        businessTypesError={businessTypesError}
      />

      <OwnershipStructureSection
        formData={formData}
        updateFormData={updateFormData}
        employeeCountError={employeeCountError}
        setEmployeeCountError={setEmployeeCountError}
      />

      <FinancialDataSection formData={formData} updateFormData={updateFormData} />

      <HistoricalDataSection
        historicalInputs={historicalInputs}
        setHistoricalInputs={setHistoricalInputs}
        foundingYear={formData.founding_year}
      />

      <FormSubmitSection
        isSubmitting={isSubmitting}
        error={error}
        clearError={clearError}
        formData={formData}
      />
    </form>
  )
}
