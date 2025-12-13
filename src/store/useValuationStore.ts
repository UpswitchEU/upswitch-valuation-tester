import { create } from 'zustand'
import { ValuationAPI } from '../services/api/valuation/ValuationAPI'
import type { DataResponse, ValuationResponse } from '../types/data-collection'
import { storeLogger } from '../utils/logger'

interface ValuationStore {
  // Collected data from data collection components
  collectedData: DataResponse[]

  // Results from backend
  result: ValuationResponse | null

  // UI state
  isCalculating: boolean
  error: string | null

  // Actions
  setCollectedData: (data: DataResponse[]) => void
  calculateValuation: () => Promise<void>
  setResult: (result: ValuationResponse | null) => void
  setIsCalculating: (calculating: boolean) => void
  setError: (error: string | null) => void
  clearData: () => void
}

export const useValuationStore = create<ValuationStore>((set, get) => ({
  // Collected data from data collection components
  collectedData: [],

  // Results from backend
  result: null,

  // UI state
  isCalculating: false,
  error: null,

  // Actions
  setCollectedData: (data) => set({ collectedData: data }),

  calculateValuation: async () => {
    const { collectedData, setIsCalculating, setResult, setError } = get()

    if (collectedData.length === 0) {
      setError('No data collected')
      return
    }

    setError(null)
    setIsCalculating(true)

    try {
      // Convert collected data to valuation request format
      const valuationData: Record<string, any> = {}
      collectedData.forEach((response) => {
        valuationData[response.fieldId] = response.value
      })

      // Create valuation request
      const request = {
        company_name: valuationData.company_name || 'Unknown Company',
        country_code: valuationData.country_code || 'BE',
        industry: valuationData.industry || 'services',
        business_model: valuationData.business_model || 'services',
        founding_year: valuationData.founding_year || new Date().getFullYear() - 5,
        current_year_data: {
          year: valuationData.current_year_data?.year || new Date().getFullYear(),
          revenue: valuationData.revenue || valuationData.current_year_data?.revenue || 100000,
          ebitda: valuationData.ebitda || valuationData.current_year_data?.ebitda || 25000,
        },
      }

      storeLogger.info('Starting valuation calculation', {
        companyName: request.company_name,
        revenue: request.current_year_data.revenue,
        ebitda: request.current_year_data.ebitda,
      })

      // Call backend API
      const valuationAPI = new ValuationAPI()
      const result = await valuationAPI.calculateValuationUnified(request)

      setResult(result)

      storeLogger.info('Valuation calculation completed', {
        valuationId: result.valuation_id,
        equityValue: result.equity_value_mid,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Valuation calculation failed'
      storeLogger.error('Valuation calculation failed', { error: errorMessage })
      setError(errorMessage)
    } finally {
      setIsCalculating(false)
    }
  },

  setResult: (result) => set({ result }),
  setIsCalculating: (calculating) => set({ isCalculating: calculating }),
  setError: (error) => set({ error }),

  clearData: () =>
    set({
      collectedData: [],
      result: null,
      error: null,
    }),
}))

// Helper to get safe current year (allow up to current year, max 2100 per backend validation)
const getSafeCurrentYear = () => Math.min(new Date().getFullYear(), 2100)

const defaultFormData: ValuationFormData = {
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

export const useValuationStore = create<ValuationStore>((set, get) => ({
  // Form data
  formData: defaultFormData,
  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetFormData: () => set({ formData: defaultFormData }),

  // Pre-fill form data with business card data
  prefillFromBusinessCard: (businessCard: {
    company_name: string
    industry: string
    business_model: string
    founding_year: number
    country_code: string
    employee_count?: number
  }) =>
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
    })),

  // Results
  result: null,
  setResult: (result) => {
    // CRITICAL: Preserve html_report from existing result if new result doesn't have it
    // This ensures streaming HTML report is never lost when regular endpoint overwrites
    const currentResult = get().result
    const currentHasHtmlReport = currentResult?.html_report && currentResult.html_report.length > 0
    const newHasHtmlReport = result?.html_report && result.html_report.length > 0

    if (result && currentHasHtmlReport && !newHasHtmlReport) {
      storeLogger.info('DIAGNOSTIC: Preserving html_report in setResult', {
        preservedFrom: 'existing_result',
        htmlReportLength: currentResult?.html_report?.length || 0,
        valuationId: result.valuation_id,
        newResultHadHtmlReport: !!result.html_report,
        newResultHtmlReportLength: result.html_report?.length || 0,
      })
      set({ result: { ...result, html_report: currentResult?.html_report } })
    } else {
      set({ result })
    }
  },
  clearResult: () => set({ result: null }),

  // Input data storage
  inputData: null,
  setInputData: (inputData) => set({ inputData }),

  // UI state
  isCalculating: false,
  setIsCalculating: (isCalculating) => set({ isCalculating }),

  isCalculatingLive: false,
  setIsCalculatingLive: (isCalculatingLive) => set({ isCalculatingLive }),

  error: null,
  setError: (error) => set({ error }),

  // Real-time preview
  liveEstimate: null,
  setLiveEstimate: (liveEstimate) => set({ liveEstimate }),

  // Saved valuation ID
  savedValuationId: null,
  setSavedValuationId: (savedValuationId) => set({ savedValuationId }),

  // Correlation ID for logging
  correlationId: null,
  setCorrelationId: (correlationId) => {
    set({ correlationId })
    // Also update global correlation context
    correlationContext.setCorrelationId(correlationId)
    if (correlationId) {
      storeLogger.info('Correlation ID set', { correlationId })
    }
  },

  // Actions
  calculateValuation: async () => {
    const { formData, setIsCalculating, setResult, setError, setInputData } = get()

    // Get session data from session store
    const sessionStore = useValuationSessionStore.getState()
    const sessionData = sessionStore.getSessionData()
    const session = sessionStore.session

    // Clear previous errors
    setError(null)

    setIsCalculating(true)

    try {
      // Use session data (unified source) or fall back to formData
      const dataSource = session?.dataSource || 'manual'

      // Merge sessionData and formData, with formData taking precedence for required fields
      // This ensures formData values are used when sessionData is empty or missing fields
      const sourceData = {
        ...formData,
        ...(sessionData || {}),
        // Ensure formData values take precedence for critical fields if they exist
        company_name: formData.company_name || sessionData?.company_name,
        revenue: formData.revenue || sessionData?.revenue,
        current_year_data: formData.current_year_data || sessionData?.current_year_data,
      }

      // Validate and construct proper request
      if (!sourceData.company_name || (sourceData.company_name as string).trim() === '') {
        throw new Error('Company name is required')
      }
      if (!sourceData.industry) {
        throw new Error('Industry is required')
      }
      const revenue = (sourceData as any).revenue || sourceData.current_year_data?.revenue
      if (!revenue || revenue <= 0) {
        throw new Error('Revenue must be greater than 0')
      }
      const ebitda =
        (sourceData as any).ebitda !== undefined && (sourceData as any).ebitda !== null
          ? (sourceData as any).ebitda
          : sourceData.current_year_data?.ebitda
      if (ebitda === undefined || ebitda === null) {
        throw new Error('EBITDA is required')
      }

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

      // Validate required fields and ensure proper data types
      const companyName = (sourceData.company_name as string)?.trim() || 'Unknown Company'
      const countryCode = ((sourceData.country_code as string) || 'BE')
        .toUpperCase()
        .substring(0, 2)
      const industry = (sourceData.industry as string) || 'services'
      const businessModel = (sourceData.business_model as string) || 'services'
      const revenueValue = Math.max(Number(revenue) || 100000, 1) // Ensure positive revenue
      const ebitdaValue = ebitda !== undefined && ebitda !== null ? Number(ebitda) : 20000 // Preserve negative values

      // Capture input data for Info tab
      const inputData: ValuationInputData = {
        revenue: revenueValue,
        ebitda: ebitdaValue,
        industry: industry,
        country_code: countryCode,
        founding_year: foundingYear,
        employees: sourceData.number_of_employees,
        business_model: businessModel,
        historical_years_data: sourceData.historical_years_data,
        total_debt: sourceData.current_year_data?.total_debt,
        cash: sourceData.current_year_data?.cash,
        // Metrics will be populated from response after valuation
      }

      setInputData(inputData)

      // Log session/formData for debugging (structured logging)
      storeLogger.debug('Data source before building request', {
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

      const request: ValuationRequest = {
        company_name: companyName,
        country_code: countryCode,
        industry: industry,
        business_model: businessModel,
        founding_year: foundingYear,
        current_year_data: {
          year: currentYear,
          revenue: revenueValue, // Ensure positive number
          ebitda: ebitdaValue,
          // Include optional fields if present (ensure they're non-negative where required)
          ...(sourceData.current_year_data?.total_assets &&
            sourceData.current_year_data.total_assets >= 0 && {
              total_assets: Number(sourceData.current_year_data.total_assets),
            }),
          ...(sourceData.current_year_data?.total_debt &&
            sourceData.current_year_data.total_debt >= 0 && {
              total_debt: Number(sourceData.current_year_data.total_debt),
            }),
          ...(sourceData.current_year_data?.cash &&
            sourceData.current_year_data.cash >= 0 && {
              cash: Number(sourceData.current_year_data.cash),
            }),
        },
        historical_years_data:
          sourceData.historical_years_data && sourceData.historical_years_data.length > 0
            ? sourceData.historical_years_data
                .filter((year: YearDataInput) => year.ebitda !== undefined && year.ebitda !== null) // Only include years with EBITDA values
                .map((year: YearDataInput) => ({
                  ...year,
                  year: Math.min(Math.max(Number(year.year), 2000), 2100),
                  revenue: Math.max(Number(year.revenue) || 0, 1), // Ensure positive revenue
                  ebitda: Number(year.ebitda), // Preserve negative values (already filtered for undefined/null)
                }))
            : revenueValue > 0 && ebitdaValue !== 0
              ? [
                  {
                    year: Math.min(currentYear - 1, 2100),
                    revenue: Math.max(revenueValue * 0.9, 1), // Assume 10% growth, ensure positive
                    ebitda: ebitdaValue * 0.9,
                  },
                ]
              : [], // Don't send historical data if current data is invalid
        // Only include owner concentration fields for companies (not sole traders)
        // Sole traders are inherently owner-operated, so owner concentration analysis doesn't apply
        // CRITICAL FIX: Check for undefined/null explicitly, not falsy (0 is valid!)
        number_of_employees:
          sourceData.business_type === 'sole-trader'
            ? undefined
            : sourceData.number_of_employees !== undefined &&
                sourceData.number_of_employees !== null &&
                sourceData.number_of_employees >= 0
              ? sourceData.number_of_employees
              : undefined,
        number_of_owners:
          sourceData.business_type === 'sole-trader'
            ? undefined
            : sourceData.number_of_owners !== undefined &&
                sourceData.number_of_owners !== null &&
                sourceData.number_of_owners >= 1
              ? sourceData.number_of_owners
              : 1,
        recurring_revenue_percentage: recurringRevenue,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: sourceData.comparables || [],
        // NEW: Include PostgreSQL business type ID and context metadata
        business_type_id: sourceData.business_type_id,
        // Include business_type (form uses this, backend expects it)
        business_type: sourceData.business_type,
        // Include shares_for_sale for ownership adjustment (Step 8)
        shares_for_sale:
          sourceData.shares_for_sale !== undefined && sourceData.shares_for_sale !== null
            ? Math.max(0, Math.min(100, Number(sourceData.shares_for_sale))) // Clamp to 0-100
            : 100, // Default to 100% if not provided
        business_context: sourceData.business_type_id
          ? {
              // Values already converted to numbers in ValuationForm.tsx, but validate range as defensive check
              dcfPreference: validatePreference((sourceData as any)._internal_dcf_preference),
              multiplesPreference: validatePreference(
                (sourceData as any)._internal_multiples_preference
              ),
              ownerDependencyImpact: validatePreference(
                (sourceData as any)._internal_owner_dependency_impact
              ),
              keyMetrics: (sourceData as any)._internal_key_metrics,
              typicalEmployeeRange: (sourceData as any)._internal_typical_employee_range,
              typicalRevenueRange: (sourceData as any)._internal_typical_revenue_range,
            }
          : undefined,
      }

      // DIAGNOSTIC: Log business_context after building request
      storeLogger.debug('Business context in request', {
        business_context: request.business_context,
      })
      // Owner concentration data already logged above

      storeLogger.info('Sending unified valuation request', {
        dataSource,
        companyName: request.company_name,
        revenue: request.current_year_data.revenue,
        ebitda: request.current_year_data.ebitda,
        business_type_id: request.business_type_id,
        business_context: request.business_context,
        requestData: request,
      })

      // Use unified calculation endpoint with dataSource
      const response = await backendAPI.calculateValuationUnified(
        request,
        dataSource as 'manual' | 'conversational' | 'mixed'
      )

      // Extract and store correlation ID from response
      // Note: backendAPI should extract from headers, but we also check response body
      if (response?.valuation_id) {
        const { setCorrelationId } = get()
        setCorrelationId(response.valuation_id)
        // Also update global correlation context
        correlationContext.setValuationId(response.valuation_id)
        storeLogger.info('Valuation response received', {
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

      // DIAGNOSTIC: Log backend response structure (FIXED - now extracts nested data)
      storeLogger.debug('Backend response received', {
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        equityValues: {
          low: response?.equity_value_low,
          mid: response?.equity_value_mid,
          high: response?.equity_value_high,
        },
        recommendedAskingPrice: response?.recommended_asking_price,
        confidenceScore: response?.confidence_score,
        htmlReport: {
          present: !!response?.html_report,
          length: response?.html_report?.length || 0,
          preview: response?.html_report?.substring(0, 200) || 'N/A',
          type: typeof response?.html_report,
        },
        infoTabHtml: {
          present: !!response?.info_tab_html,
          length: response?.info_tab_html?.length || 0,
          preview: response?.info_tab_html?.substring(0, 200) || 'N/A',
          type: typeof response?.info_tab_html,
        },
        fullData: response,
      })

      // Log report data sections
      const responseAny = response as any
      storeLogger.debug('Report data sections', {
        keyValueDrivers: responseAny?.key_value_drivers,
        riskFactors: responseAny?.risk_factors,
        financialMetrics: responseAny?.financial_metrics,
        historicalData: responseAny?.historical_years_data,
        transparency: responseAny?.transparency,
        methodologyNotes: responseAny?.methodology_notes,
      })

      // DIAGNOSTIC: Log before storing in Zustand
      storeLogger.info('DIAGNOSTIC: About to store result in Zustand store', {
        hasHtmlReport: !!response?.html_report,
        htmlReportLength: response?.html_report?.length || 0,
        hasInfoTabHtml: !!response?.info_tab_html,
        infoTabHtmlLength: response?.info_tab_html?.length || 0,
        valuationId: response?.valuation_id,
      })

      // CRITICAL: Preserve html_report and info_tab_html from streaming if regular endpoint response doesn't have it
      // This happens when streaming completes first and sets html_report, then regular endpoint overwrites
      const currentResult = get().result
      const responseHasHtmlReport = response?.html_report && response.html_report.length > 0
      const currentHasHtmlReport =
        currentResult?.html_report && currentResult.html_report.length > 0
      const responseHasInfoTabHtml = response?.info_tab_html && response.info_tab_html.length > 0
      const currentHasInfoTabHtml =
        currentResult?.info_tab_html && currentResult.info_tab_html.length > 0

      // Prefer response html_report if it exists and is non-empty, otherwise preserve from current result
      const htmlReportToPreserve = responseHasHtmlReport
        ? response.html_report
        : currentHasHtmlReport
          ? currentResult.html_report
          : response?.html_report

      // Prefer response info_tab_html if it exists and is non-empty, otherwise preserve from current result
      const infoTabHtmlToPreserve = responseHasInfoTabHtml
        ? response.info_tab_html
        : currentHasInfoTabHtml
          ? currentResult.info_tab_html
          : response?.info_tab_html

      if (currentHasHtmlReport && !responseHasHtmlReport) {
        storeLogger.info('DIAGNOSTIC: Preserving html_report from streaming/previous result', {
          preservedFrom: 'previous_result',
          htmlReportLength: htmlReportToPreserve?.length || 0,
          valuationId: response?.valuation_id,
          responseHadHtmlReport: !!response?.html_report,
          responseHtmlReportLength: response?.html_report?.length || 0,
        })
      }

      if (currentHasInfoTabHtml && !responseHasInfoTabHtml) {
        storeLogger.info('DIAGNOSTIC: Preserving info_tab_html from streaming/previous result', {
          preservedFrom: 'previous_result',
          infoTabHtmlLength: infoTabHtmlToPreserve?.length || 0,
          valuationId: response?.valuation_id,
          responseHadInfoTabHtml: !!response?.info_tab_html,
          responseInfoTabHtmlLength: response?.info_tab_html?.length || 0,
        })
      }

      // Merge response with preserved html_report and info_tab_html
      const resultToStore = {
        ...response,
        html_report: htmlReportToPreserve,
        info_tab_html: infoTabHtmlToPreserve,
      }

      // CRITICAL: Validate critical numeric fields for NaN/Infinity (log warnings only, don't modify)
      // Components already handle NaN at display/calculation time, so we just log for debugging
      const criticalFields = [
        'equity_value_low',
        'equity_value_mid',
        'equity_value_high',
        'equity_value',
        'enterprise_value',
        'confidence_score',
      ]

      const nanFields: string[] = []
      criticalFields.forEach((field) => {
        const value = (resultToStore as any)[field]
        if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
          nanFields.push(field)
        }
      })

      if (nanFields.length > 0) {
        storeLogger.warn('⚠️ Valuation result contains NaN/Infinity in critical fields', {
          valuationId: response?.valuation_id,
          nanFields,
          note: 'Components will handle NaN at display time with fallback values',
        })
      }

      setResult(resultToStore)

      // Verify result was stored correctly
      const storedResult = get().result
      storeLogger.info('Result stored in Zustand store', {
        stored: !!storedResult,
        storedHasHtmlReport: !!storedResult?.html_report,
        storedHtmlReportLength: storedResult?.html_report?.length || 0,
        storedHasInfoTabHtml: !!storedResult?.info_tab_html,
        storedInfoTabHtmlLength: storedResult?.info_tab_html?.length || 0,
      })

      // Update inputData with metrics from response
      if (response.financial_metrics && inputData) {
        setInputData({
          ...inputData,
          metrics: response.financial_metrics as any, // Type assertion: backend metrics may have different fields than input metrics
        })
      }

      // Mark session as completed
      if (session) {
        try {
          await backendAPI.updateValuationSession(session.reportId, {
            completedAt: new Date().toISOString(),
          })
          storeLogger.info('Session marked as completed', { reportId: session.reportId })
        } catch (error) {
          storeLogger.warn('Failed to mark session as completed', { error })
        }
      }

      // ✅ AUTO-SAVE TO DATABASE (primary storage)
      // This will also send PostMessage to parent window (upswitch.biz)
      try {
        const saveResult = await get().saveToBackend()
        if (saveResult) {
          storeLogger.info('Valuation auto-saved to database', { valuationId: saveResult.id })
        }
      } catch (saveError) {
        storeLogger.warn('Failed to auto-save to database', { error: saveError })
        // Don't fail the whole operation - valuation still calculated successfully
      }
    } catch (error) {
      storeLogger.error('Valuation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        response:
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined,
      })

      // Extract detailed error message
      let errorMessage = 'Failed to calculate valuation'
      if (error.response?.data?.error) {
        const errorData = error.response.data.error
        if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData?.message) {
          errorMessage = errorData.message
        } else if (errorData?.error) {
          errorMessage = errorData.error
        }
      } else if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          // Handle Pydantic validation errors (array format)
          errorMessage = detail
            .map((err: { loc?: string[]; msg?: string }) => {
              const field = err.loc?.join('.') || 'unknown field'
              return `${field}: ${err.msg || 'Validation error'}`
            })
            .join('; ')
        } else if (typeof detail === 'object' && detail !== null) {
          // Handle business logic validation errors (object format with errors array)
          const detailObj = detail as { errors?: Array<{ field?: string; message?: string }> }
          if (Array.isArray(detailObj.errors) && detailObj.errors.length > 0) {
            // Extract validation error messages from errors array
            errorMessage = detailObj.errors
              .map((err) => {
                // Format: "field: message" or just "message" if field is not available
                return err.field && err.message
                  ? `${err.field}: ${err.message}`
                  : err.message || err.field || 'Validation error'
              })
              .join('; ')
          } else if (detail.error) {
            // Fallback to error field if errors array is empty or missing
            errorMessage =
              typeof detail.error === 'string' ? detail.error : detail.hint || 'Validation failed'
          } else if (detail.hint) {
            errorMessage = detail.hint
          } else if (detail.message) {
            errorMessage = detail.message
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      // Special handling for timeout errors
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('504') ||
        error.response?.status === 504
      ) {
        errorMessage =
          'The valuation calculation is taking longer than expected. This may be due to high server load. Please try again in a moment.'
      }

      setError(errorMessage)
      // BANK-GRADE: Clear isCalculating on error so error state can be displayed
      setIsCalculating(false)
    }
    // Note: No finally block needed - isCalculating is managed by:
    // 1. Stream completes successfully (handleStreamComplete sets it to false)
    // 2. Stream error occurs (handleStreamError sets it to false)
    // 3. Error occurs in catch block (already set to false above)
    // For successful responses, isCalculating stays true until streaming completes
  },

  calculateValuationStreaming: async (onProgress?: (progress: number) => void) => {
    // Streaming is handled by ManualValuationFlow component
    // This method exists for interface compatibility but streaming is initiated
    // directly from the component using manualValuationStreamService
    if (onProgress) {
      onProgress(0)
    }
    // The actual streaming is handled in ManualValuationFlow.tsx
    // This method is kept for type compatibility
    return Promise.resolve()
  },

  quickValuation: async () => {
    const { formData, setIsCalculatingLive, setLiveEstimate } = get()

    if (!formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code) {
      return
    }

    setIsCalculatingLive(true)

    try {
      const quickRequest: QuickValuationRequest = {
        revenue: formData.revenue,
        ebitda: formData.ebitda,
        industry: formData.industry,
        country_code: formData.country_code,
      }

      const response = await api.quickValuation(quickRequest)
      setLiveEstimate(response)
    } catch (error) {
      // Silently fail for live preview
      storeLogger.error('Quick valuation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsCalculatingLive(false)
    }
  },

  /**
   * Save valuation to backend database
   * Requires authentication via cookie
   */
  saveToBackend: async (businessId?: string) => {
    const { result, formData, setSavedValuationId, setError } = get()

    if (!result) {
      storeLogger.warn('No valuation result to save')
      return null
    }

    try {
      storeLogger.info('Saving valuation to backend')

      // Use environment variable for backend URL (Node.js backend for auth & saving)
      const BACKEND_URL =
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        'https://web-production-8d00b.up.railway.app'

      const response = await fetch(`${BACKEND_URL}/api/valuations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send authentication cookie
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
        setSavedValuationId(data.data.id)
        storeLogger.info('Valuation saved successfully', { valuationId: data.data.id })

        // Notify parent window via PostMessage
        if (window.opener || window.parent !== window) {
          const targetOrigin = import.meta.env.VITE_PARENT_DOMAIN || 'https://upswitch.biz'

          const message = {
            type: 'VALUATION_SAVED',
            valuationId: data.data.id,
            companyName: formData.company_name,
            timestamp: new Date().toISOString(),
          }

          // Try to send to opener (new window)
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, targetOrigin)
            storeLogger.debug('PostMessage sent to opener window')
          }

          // Try to send to parent (iframe)
          if (window.parent !== window) {
            window.parent.postMessage(message, targetOrigin)
            storeLogger.debug('PostMessage sent to parent window')
          }
        }

        return { id: data.data.id }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      storeLogger.error('Failed to save valuation', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setError(error.message || 'Failed to save valuation to backend')
      return null
    }
  },
}))
