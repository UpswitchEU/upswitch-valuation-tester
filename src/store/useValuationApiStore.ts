/**
 * Valuation API Store - Focused Store for API Operations
 *
 * Single Responsibility: Handle all valuation API calls and backend communication
 * SOLID Principles: SRP - Only handles API-related state and actions
 *
 * @module store/useValuationApiStore
 */

import { create } from 'zustand'
import { backendAPI } from '../services/backendApi'
import type { ValuationResponse } from '../types/valuation'
import { storeLogger } from '../utils/logger'
import { validateBusinessRules, validateRequiredFields } from '../utils/valuationValidation'
import { useValuationFormStore } from './useValuationFormStore'
import { useValuationResultsStore } from './useValuationResultsStore'
import { useValuationSessionStore } from './useValuationSessionStore'

interface ValuationApiStore {
  // UI state related to API operations
  isCalculating: boolean
  setIsCalculating: (isCalculating: boolean) => void

  isCalculatingLive: boolean
  setIsCalculatingLive: (isCalculatingLive: boolean) => void

  error: string | null
  setError: (error: string | null) => void

  // Real-time preview
  liveEstimate: any
  setLiveEstimate: (liveEstimate: any) => void

  // Actions
  calculateValuation: () => Promise<void>
  calculateValuationStreaming: (onProgress?: (progress: number) => void) => Promise<void>
  quickValuation: () => Promise<void>
  saveToBackend: (businessId?: string) => Promise<{ id: string } | null>
}

/**
 * Valuation API Store
 *
 * Focused store handling only API operations following SRP.
 * No form data, no results storage, no UI state beyond API loading - just API calls.
 */
export const useValuationApiStore = create<ValuationApiStore>((set, get) => ({
  // UI state related to API operations
  isCalculating: false,
  setIsCalculating: (isCalculating) => set({ isCalculating }),

  isCalculatingLive: false,
  setIsCalculatingLive: (isCalculatingLive) => set({ isCalculatingLive }),

  error: null,
  setError: (error) => set({ error }),

  // Real-time preview
  liveEstimate: null,
  setLiveEstimate: (liveEstimate) => set({ liveEstimate }),

  // Actions
  calculateValuation: async () => {
    const { setIsCalculating, setError, setLiveEstimate } = get()
    const formStore = useValuationFormStore.getState()
    const resultsStore = useValuationResultsStore.getState()

    // Get session data from session store
    const sessionStore = useValuationSessionStore.getState()
    const sessionData = sessionStore.getSessionData()
    const session = sessionStore.session

    // Clear previous errors
    setError(null)

    setIsCalculating(true)

    try {
      // Use session data (unified source) or fall back to formData
      const dataSource = session?.currentView || 'manual'

      // Merge sessionData and formData, with formData taking precedence for required fields
      // This ensures formData values are used when sessionData is empty or missing fields
      const sourceData = {
        ...formStore.formData,
        ...(sessionData || {}),
        // Ensure formData values take precedence for critical fields if they exist
        company_name: formStore.formData.company_name || sessionData?.company_name,
        revenue: formStore.formData.revenue || sessionData?.revenue,
        current_year_data: formStore.formData.current_year_data || sessionData?.current_year_data,
      }

      // Validate required fields
      const requiredErrors = validateRequiredFields(sourceData as any)
      if (requiredErrors.length > 0) {
        const errorMessage = requiredErrors
          .filter((e) => e.severity === 'error')
          .map((e) => e.message)
          .join('; ')
        throw new Error(errorMessage || 'Validation failed')
      }

      // Validate business rules
      const businessRuleErrors = validateBusinessRules(sourceData as any)
      const criticalErrors = businessRuleErrors.filter((e) => e.severity === 'error')
      if (criticalErrors.length > 0) {
        const errorMessage = criticalErrors.map((e) => e.message).join('; ')
        throw new Error(errorMessage)
      }

      // Log warnings (non-blocking)
      const warnings = businessRuleErrors.filter((e) => e.severity === 'warning')
      if (warnings.length > 0) {
        storeLogger.warn('API store: Data quality warnings', {
          warnings: warnings.map((w) => `${w.field}: ${w.message}`),
        })
      }

      const revenue = (sourceData as any).revenue || sourceData.current_year_data?.revenue
      const ebitda =
        (sourceData as any).ebitda !== undefined && (sourceData as any).ebitda !== null
          ? (sourceData as any).ebitda
          : sourceData.current_year_data?.ebitda

      // Capture input data for Info tab
      const inputData = {
        revenue: revenue as number,
        ebitda: ebitda as number,
        industry: sourceData.industry as string,
        country_code: (sourceData.country_code as string) || 'BE',
        founding_year: (sourceData.founding_year as number) || new Date().getFullYear() - 5,
        employees: sourceData.number_of_employees,
        business_model: (sourceData.business_model as string) || 'services',
        historical_years_data: sourceData.historical_years_data,
        total_debt: sourceData.current_year_data?.total_debt,
        cash: sourceData.current_year_data?.cash,
        // Metrics will be populated from response after valuation
      }

      resultsStore.setInputData(inputData)

      // Log session/formData for debugging (structured logging)
      storeLogger.debug('API store: Data source before building request', {
        dataSource,
        usingSessionData: !!sessionData,
        business_type_id: sourceData.business_type_id,
        _internal_dcf_preference: (sourceData as any)._internal_dcf_preference,
        _internal_multiples_preference: (sourceData as any)._internal_multiples_preference,
        _internal_owner_dependency_impact: (sourceData as any)._internal_owner_dependency_impact,
        number_of_employees: sourceData.number_of_employees,
        number_of_owners: sourceData.number_of_owners,
        business_type: sourceData.business_type,
      })

      const request = buildValuationRequest(sourceData)

      storeLogger.info('API store: Sending unified valuation request', {
        dataSource,
        companyName: request.company_name,
        revenue: request.current_year_data.revenue,
        ebitda: request.current_year_data.ebitda,
        business_type_id: request.business_type_id,
        business_context: request.business_context,
      })

      // Use unified calculation endpoint
      const response = await backendAPI.calculateValuationUnified(request)

      // Extract and store correlation ID from response
      if (response?.valuation_id) {
        resultsStore.setCorrelationId(response.valuation_id)
        storeLogger.info('API store: Valuation response received', {
          valuationId: response.valuation_id,
          hasTransparency: !!response.transparency,
          hasModularSystem: !!response.modular_system,
          modularSystemStepsCount: response.modular_system?.step_details?.length || 0,
          hasHtmlReport: !!response?.html_report,
          htmlReportLength: response?.html_report?.length || 0,
          hasInfoTabHtml: !!response?.info_tab_html,
          infoTabHtmlLength: response?.info_tab_html?.length || 0,
        })
      }

      // Preserve html_report and info_tab_html from streaming if regular endpoint doesn't have it
      const completeResult = preserveStreamingResults(response, resultsStore.result)

      resultsStore.setResult(completeResult)

      // Update inputData with metrics from response
      if (response.financial_metrics && inputData) {
        resultsStore.setInputData({
          ...inputData,
          metrics: response.financial_metrics as any,
        })
      }

      // Mark session as completed
      if (session) {
        try {
          await backendAPI.updateValuationSession(session.reportId, {
            completedAt: new Date(),
          })
          storeLogger.info('API store: Session marked as completed', { reportId: session.reportId })
        } catch (error) {
          storeLogger.warn('API store: Failed to mark session as completed', { error })
        }
      }

      // Auto-save to database
      try {
        const saveResult = await get().saveToBackend()
        if (saveResult) {
          storeLogger.info('API store: Valuation auto-saved', { valuationId: saveResult.id })
        }
      } catch (saveError) {
        storeLogger.warn('API store: Failed to auto-save', { error: saveError })
      }
    } catch (error) {
      storeLogger.error('API store: Valuation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Extract detailed error message
      const errorMessage = extractErrorMessage(error)
      setError(errorMessage)

      // Clear isCalculating on error
      setIsCalculating(false)
    }
  },

  calculateValuationStreaming: async (onProgress?: (progress: number) => void) => {
    // Streaming is handled by ManualValuationFlow component
    // This method exists for interface compatibility but streaming is initiated
    // directly from the component using manualValuationStreamService
    if (onProgress) {
      onProgress(0)
    }
    // The actual streaming is handled in ManualValuationFlow.tsx
    return Promise.resolve()
  },

  quickValuation: async () => {
    const { setIsCalculatingLive, setLiveEstimate } = get()
    const { formData } = useValuationFormStore.getState()

    if (!formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code) {
      return
    }

    setIsCalculatingLive(true)

    try {
      const quickRequest = {
        company_name: formData.company_name || 'Quick Valuation',
        country_code: formData.country_code || 'BE',
        industry: formData.industry || 'services',
        business_model: formData.business_model || 'services',
        founding_year: formData.founding_year || new Date().getFullYear() - 5,
        current_year_data: {
          year: new Date().getFullYear(),
          revenue: formData.revenue || formData.current_year_data?.revenue || 0,
          ebitda: formData.ebitda || formData.current_year_data?.ebitda || 0,
        },
      }

      const response = await backendAPI.calculateInstantValuation(quickRequest)
      setLiveEstimate(response)
    } catch (error) {
      // Silently fail for live preview
      storeLogger.error('API store: Quick valuation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsCalculatingLive(false)
    }
  },

  saveToBackend: async (businessId?: string) => {
    const { setError } = get()
    const { formData } = useValuationFormStore.getState()
    const resultsStore = useValuationResultsStore.getState()
    const result = resultsStore.result

    if (!result) {
      storeLogger.warn('API store: No valuation result to save')
      return null
    }

    try {
      storeLogger.info('API store: Saving valuation to backend')

      const BACKEND_URL = 'https://web-production-8d00b.up.railway.app'

      const response = await fetch(`${BACKEND_URL}/api/valuations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessId,
          valuation: {
            ...result,
            company_name: formData.company_name,
            country_code: formData.country_code,
            industry: formData.industry,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save valuation')
      }

      const data = await response.json()

      if (data.success && data.data?.id) {
        resultsStore.setSavedValuationId(data.data.id)
        storeLogger.info('API store: Valuation saved successfully', { valuationId: data.data.id })

        // Notify parent window via PostMessage
        notifyParentWindow(data.data.id, formData.company_name || 'Unknown Company')

        return { id: data.data.id }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save valuation to backend'
      storeLogger.error('API store: Failed to save valuation', {
        error: errorMessage,
      })
      setError(errorMessage)
      return null
    }
  },
}))

// Helper functions
function buildValuationRequest(sourceData: any) {
  // Ensure year values are within valid range (2000-2100)
  const currentYear = Math.min(
    Math.max(sourceData.current_year_data?.year || new Date().getFullYear(), 2000),
    2100
  )
  const foundingYear = Math.min(
    Math.max(sourceData.founding_year || currentYear - 5, 1900),
    2100
  )

  // Ensure recurring revenue percentage is between 0 and 1
  const recurringRevenue = Math.min(
    Math.max(sourceData.recurring_revenue_percentage || 0.0, 0.0),
    1.0
  )

  return {
    company_name: (sourceData.company_name as string)?.trim() || 'Unknown Company',
    country_code: ((sourceData.country_code as string) || 'BE').toUpperCase().substring(0, 2),
    industry: (sourceData.industry as string) || 'services',
    business_model: (sourceData.business_model as string) || 'services',
    founding_year: foundingYear,
    current_year_data: {
      year: currentYear,
      revenue: Math.max(Number(sourceData.revenue) || sourceData.current_year_data?.revenue || 100000, 1),
      ebitda: sourceData.ebitda !== undefined && sourceData.ebitda !== null
        ? Number(sourceData.ebitda)
        : (sourceData.current_year_data?.ebitda || 20000),
      ...(sourceData.current_year_data?.total_assets && { total_assets: Number(sourceData.current_year_data.total_assets) }),
      ...(sourceData.current_year_data?.total_debt && { total_debt: Number(sourceData.current_year_data.total_debt) }),
      ...(sourceData.current_year_data?.cash && { cash: Number(sourceData.current_year_data.cash) }),
    },
    historical_years_data: sourceData.historical_years_data?.filter((year: any) =>
      year.ebitda !== undefined && year.ebitda !== null
    ).map((year: any) => ({
      ...year,
      year: Math.min(Math.max(Number(year.year), 2000), 2100),
      revenue: Math.max(Number(year.revenue) || 0, 1),
      ebitda: Number(year.ebitda),
    })) || [],
    number_of_employees: sourceData.business_type === 'sole-trader'
      ? undefined
      : (sourceData.number_of_employees !== undefined && sourceData.number_of_employees !== null && sourceData.number_of_employees >= 0)
        ? sourceData.number_of_employees
        : undefined,
    number_of_owners: sourceData.business_type === 'sole-trader'
      ? undefined
      : (sourceData.number_of_owners !== undefined && sourceData.number_of_owners !== null && sourceData.number_of_owners >= 1)
        ? sourceData.number_of_owners
        : 1,
    recurring_revenue_percentage: recurringRevenue,
    use_dcf: true,
    use_multiples: true,
    projection_years: 10,
    comparables: sourceData.comparables || [],
    business_type_id: sourceData.business_type_id,
    business_type: sourceData.business_type,
    shares_for_sale: (sourceData.shares_for_sale !== undefined && sourceData.shares_for_sale !== null)
      ? Math.max(0, Math.min(100, Number(sourceData.shares_for_sale)))
      : 100,
    business_context: sourceData.business_type_id ? {
      dcfPreference: validatePreference((sourceData as any)._internal_dcf_preference),
      multiplesPreference: validatePreference((sourceData as any)._internal_multiples_preference),
      ownerDependencyImpact: validatePreference((sourceData as any)._internal_owner_dependency_impact),
      keyMetrics: (sourceData as any)._internal_key_metrics,
      typicalEmployeeRange: (sourceData as any)._internal_typical_employee_range,
      typicalRevenueRange: (sourceData as any)._internal_typical_revenue_range,
    } : undefined,
  }
}

function preserveStreamingResults(newResult: ValuationResponse, currentResult: ValuationResponse | null) {
  const currentHasHtmlReport = currentResult?.html_report && currentResult.html_report.length > 0
  const newHasHtmlReport = newResult?.html_report && newResult.html_report.length > 0
  const currentHasInfoTabHtml = currentResult?.info_tab_html && currentResult.info_tab_html.length > 0
  const newHasInfoTabHtml = newResult?.info_tab_html && newResult.info_tab_html.length > 0

  const htmlReportToPreserve = newHasHtmlReport
    ? newResult.html_report
    : currentHasHtmlReport
      ? currentResult.html_report
      : newResult.html_report

  const infoTabHtmlToPreserve = newHasInfoTabHtml
    ? newResult.info_tab_html
    : currentHasInfoTabHtml
      ? currentResult.info_tab_html
      : newResult.info_tab_html

  return {
    ...newResult,
    html_report: htmlReportToPreserve,
    info_tab_html: infoTabHtmlToPreserve,
  }
}

function extractErrorMessage(error: unknown): string {
  const axiosError = error as any
  
  if (axiosError?.response?.data?.error) {
    const errorData = axiosError.response.data.error
    if (typeof errorData === 'string') {
      return errorData
    } else if (errorData?.message) {
      return errorData.message
    } else if (errorData?.error) {
      return errorData.error
    }
  }
  
  if (axiosError?.response?.data?.detail) {
    const detail = axiosError.response.data.detail
    if (typeof detail === 'string') {
      return detail
    } else if (Array.isArray(detail)) {
      return detail.map((err: any) => {
        const field = err.loc?.join('.') || 'unknown field'
        return `${field}: ${err.msg || 'Validation error'}`
      }).join('; ')
    } else if (typeof detail === 'object' && detail !== null) {
      const detailObj = detail as any
      if (Array.isArray(detailObj.errors)) {
        return detailObj.errors.map((err: any) => {
          return err.field && err.message
            ? `${err.field}: ${err.message}`
            : err.message || err.field || 'Validation error'
        }).join('; ')
      } else if (detail.error) {
        return typeof detail.error === 'string' ? detail.error : detail.hint || 'Validation failed'
      } else if (detail.hint) {
        return detail.hint
      } else if (detail.message) {
        return detail.message
      }
    }
  }
  
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to calculate valuation'
}

function validatePreference(value: number | undefined): number | undefined {
  if (value === undefined) return undefined
  if (value < 0 || value > 1) return undefined
  return value
}

function notifyParentWindow(valuationId: string, companyName: string) {
  if (window.opener || window.parent !== window) {
    const targetOrigin = 'https://upswitch.biz'
    const message = {
      type: 'VALUATION_SAVED',
      valuationId,
      companyName,
      timestamp: new Date().toISOString(),
    }

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, targetOrigin)
      storeLogger.debug('API store: PostMessage sent to opener window')
    }

    if (window.parent !== window) {
      window.parent.postMessage(message, targetOrigin)
      storeLogger.debug('API store: PostMessage sent to parent window')
    }
  }
}