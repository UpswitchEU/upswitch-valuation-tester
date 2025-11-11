import { create } from 'zustand';
import { api } from '../services/api';
import { backendAPI } from '../services/backendApi';
import type { QuickValuationRequest, ValuationFormData, ValuationInputData, ValuationRequest, ValuationResponse } from '../types/valuation';
import { storeLogger, correlationContext, setCorrelationFromResponse } from '../utils/logger';
import { validatePreference } from '../utils/numberUtils';
// import { useReportsStore } from './useReportsStore'; // Deprecated: Now saving to database

interface ValuationStore {
  // Form data
  formData: ValuationFormData;
  
  updateFormData: (data: Partial<ValuationFormData>) => void;
  resetFormData: () => void;
  prefillFromBusinessCard: (businessCard: {
    company_name: string;
    industry: string;
    business_model: string;
    founding_year: number;
    country_code: string;
  }) => void;

  // Results
  result: ValuationResponse | null;
  setResult: (result: ValuationResponse | null) => void;
  clearResult: () => void;
  
  // Input data storage
  inputData: ValuationInputData | null;
  setInputData: (data: ValuationInputData | null) => void;

  // UI state
  isCalculating: boolean;
  setIsCalculating: (isCalculating: boolean) => void;
  
  isCalculatingLive: boolean;
  setIsCalculatingLive: (isCalculating: boolean) => void;
  
  error: string | null;
  setError: (error: string | null) => void;
  
  // Real-time preview
  liveEstimate: ValuationResponse | null;
  setLiveEstimate: (estimate: ValuationResponse | null) => void;
  
  // Saved valuation ID (from backend)
  savedValuationId: string | null;
  setSavedValuationId: (id: string | null) => void;
  
  // Correlation ID for logging (links frontend and backend logs)
  correlationId: string | null;
  setCorrelationId: (id: string | null) => void;
  
  // Actions
  calculateValuation: () => Promise<void>;
  quickValuation: () => Promise<void>;
  saveToBackend: (businessId?: string) => Promise<{ id: string } | null>;
}

// Helper to get safe current year (allow up to current year, max 2100 per backend validation)
const getSafeCurrentYear = () => Math.min(new Date().getFullYear(), 2100);

const defaultFormData: ValuationFormData = {
  company_name: 'My Company', // Default company name to avoid validation error
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
};

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
    company_name: string;
    industry: string;
    business_model: string;
    founding_year: number;
    country_code: string;
    employee_count?: number;
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
  setResult: (result) => set({ result }),
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
    set({ correlationId });
    // Also update global correlation context
    correlationContext.setCorrelationId(correlationId);
    if (correlationId) {
      storeLogger.info('Correlation ID set', { correlationId });
    }
  },
  
  // Actions
  calculateValuation: async () => {
    const { formData, setIsCalculating, setResult, setError, setInputData } = get();
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Validate and construct proper request
      if (!formData.company_name || formData.company_name.trim() === '') {
        throw new Error('Company name is required');
      }
      if (!formData.industry) {
        throw new Error('Industry is required');
      }
      if (!formData.revenue || formData.revenue <= 0) {
        throw new Error('Revenue must be greater than 0');
      }
      if (formData.ebitda === undefined || formData.ebitda === null) {
        throw new Error('EBITDA is required');
      }
      
      // Ensure year values are within valid range (2000-2100)
      const currentYear = Math.min(Math.max(formData.current_year_data?.year || new Date().getFullYear(), 2000), 2100);
      const foundingYear = Math.min(Math.max(formData.founding_year || currentYear - 5, 1900), 2100);
      
      // Ensure recurring revenue percentage is between 0 and 1
      const recurringRevenue = Math.min(Math.max(formData.recurring_revenue_percentage || 0.0, 0.0), 1.0);
      
      // Validate required fields and ensure proper data types
      const companyName = formData.company_name?.trim() || 'Unknown Company';
      const countryCode = (formData.country_code || 'BE').toUpperCase().substring(0, 2);
      const industry = formData.industry || 'services';
      const businessModel = formData.business_model || 'services';
      const revenue = Math.max(Number(formData.revenue) || 100000, 1); // Ensure positive revenue
      const ebitda = formData.ebitda !== undefined && formData.ebitda !== null ? Number(formData.ebitda) : 20000; // Preserve negative values
      
      // Capture input data for Info tab
      const inputData: ValuationInputData = {
        revenue: revenue,
        ebitda: ebitda,
        industry: industry,
        country_code: countryCode,
        founding_year: foundingYear,
        employees: formData.number_of_employees,
        business_model: businessModel,
        historical_years_data: formData.historical_years_data,
        total_debt: formData.current_year_data?.total_debt,
        cash: formData.current_year_data?.cash,
        // Metrics will be populated from response after valuation
      };
      
      setInputData(inputData);
      
      // DIAGNOSTIC: Log formData before building request
      console.log('[DIAGNOSTIC-FRONTEND] FormData before building request:');
      console.log('[DIAGNOSTIC-FRONTEND] business_type_id:', formData.business_type_id);
      console.log('[DIAGNOSTIC-FRONTEND] _internal_dcf_preference:', formData._internal_dcf_preference);
      console.log('[DIAGNOSTIC-FRONTEND] _internal_multiples_preference:', formData._internal_multiples_preference);
      console.log('[DIAGNOSTIC-FRONTEND] _internal_owner_dependency_impact:', formData._internal_owner_dependency_impact);
      console.log('[DIAGNOSTIC-FRONTEND] number_of_employees (raw):', formData.number_of_employees);
      console.log('[DIAGNOSTIC-FRONTEND] number_of_owners (raw):', formData.number_of_owners);
      console.log('[DIAGNOSTIC-FRONTEND] business_type:', formData.business_type);
      
      const request: ValuationRequest = {
        company_name: companyName,
        country_code: countryCode,
        industry: industry,
        business_model: businessModel,
        founding_year: foundingYear,
        current_year_data: {
          year: currentYear,
          revenue: revenue, // Ensure positive number
          ebitda: ebitda,
          // Include optional fields if present (ensure they're non-negative where required)
          ...(formData.current_year_data?.total_assets && formData.current_year_data.total_assets >= 0 && { total_assets: Number(formData.current_year_data.total_assets) }),
          ...(formData.current_year_data?.total_debt && formData.current_year_data.total_debt >= 0 && { total_debt: Number(formData.current_year_data.total_debt) }),
          ...(formData.current_year_data?.cash && formData.current_year_data.cash >= 0 && { cash: Number(formData.current_year_data.cash) }),
        },
        historical_years_data: formData.historical_years_data && formData.historical_years_data.length > 0 
          ? formData.historical_years_data
              .filter(year => year.ebitda !== undefined && year.ebitda !== null) // Only include years with EBITDA values
              .map(year => ({
                ...year,
                year: Math.min(Math.max(Number(year.year), 2000), 2100),
                revenue: Math.max(Number(year.revenue) || 0, 1), // Ensure positive revenue
                ebitda: Number(year.ebitda), // Preserve negative values (already filtered for undefined/null)
              }))
          : (revenue > 0 && ebitda !== 0)
            ? [{
                year: Math.min(currentYear - 1, 2100),
                revenue: Math.max(revenue * 0.9, 1), // Assume 10% growth, ensure positive
                ebitda: ebitda * 0.9,
              }]
            : [], // Don't send historical data if current data is invalid
        // Only include owner concentration fields for companies (not sole traders)
        // Sole traders are inherently owner-operated, so owner concentration analysis doesn't apply
        // CRITICAL FIX: Check for undefined/null explicitly, not falsy (0 is valid!)
        number_of_employees: (formData.business_type === 'sole-trader')
          ? undefined 
          : (formData.number_of_employees !== undefined && formData.number_of_employees !== null && formData.number_of_employees >= 0 
              ? formData.number_of_employees 
              : undefined),
        number_of_owners: (formData.business_type === 'sole-trader')
          ? undefined 
          : (formData.number_of_owners !== undefined && formData.number_of_owners !== null && formData.number_of_owners >= 1 
              ? formData.number_of_owners 
              : 1),
        recurring_revenue_percentage: recurringRevenue,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: formData.comparables || [],
        // NEW: Include PostgreSQL business type ID and context metadata
        business_type_id: formData.business_type_id,
        // Include business_type (form uses this, backend expects it)
        business_type: formData.business_type,
        // Include shares_for_sale for ownership adjustment (Step 8)
        shares_for_sale: formData.shares_for_sale !== undefined && formData.shares_for_sale !== null
          ? Math.max(0, Math.min(100, Number(formData.shares_for_sale))) // Clamp to 0-100
          : 100, // Default to 100% if not provided
        business_context: formData.business_type_id ? {
          // Values already converted to numbers in ValuationForm.tsx, but validate range as defensive check
          dcfPreference: validatePreference(formData._internal_dcf_preference),
          multiplesPreference: validatePreference(formData._internal_multiples_preference),
          ownerDependencyImpact: validatePreference(formData._internal_owner_dependency_impact),
          keyMetrics: formData._internal_key_metrics,
          typicalEmployeeRange: formData._internal_typical_employee_range,
          typicalRevenueRange: formData._internal_typical_revenue_range,
        } : undefined,
      };
      
      // DIAGNOSTIC: Log business_context after building request
      console.log('[DIAGNOSTIC-FRONTEND] business_context in request:', JSON.stringify(request.business_context));
      console.log('[DEBUG-OWNER-CONCENTRATION] number_of_employees being sent:', request.number_of_employees);
      console.log('[DEBUG-OWNER-CONCENTRATION] number_of_owners being sent:', request.number_of_owners);
      
      storeLogger.info('Sending manual valuation request (FREE)', { 
        companyName: request.company_name,
        revenue: request.current_year_data.revenue,
        ebitda: request.current_year_data.ebitda,
        business_type_id: request.business_type_id,
        business_context: request.business_context,
        requestData: request
      });
      const response = await backendAPI.calculateManualValuation(request);
      
      // Extract and store correlation ID from response
      // Note: backendAPI should extract from headers, but we also check response body
      if (response?.valuation_id) {
        const { setCorrelationId } = get();
        setCorrelationId(response.valuation_id);
        // Also update global correlation context
        correlationContext.setValuationId(response.valuation_id);
        storeLogger.info('Valuation response received', {
          valuationId: response.valuation_id,
          hasTransparency: !!response.transparency,
          hasModularSystem: !!response.modular_system,
          transparencyStepsCount: response.transparency?.calculation_steps?.length || 0,
          modularSystemStepsCount: response.modular_system?.step_details?.length || 0
        });
      }
      
      // DIAGNOSTIC: Log backend response structure (FIXED - now extracts nested data)
      console.log('DIAGNOSTIC: Backend response (FIXED):', {
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        equityValues: {
          low: response?.equity_value_low,
          mid: response?.equity_value_mid,
          high: response?.equity_value_high
        },
        recommendedAskingPrice: response?.recommended_asking_price,
        confidenceScore: response?.confidence_score,
        fullData: response
      });
      
      // DIAGNOSTIC: Log report data sections
      const responseAny = response as any;
      console.log('DIAGNOSTIC: Report data sections:', {
        keyValueDrivers: responseAny?.key_value_drivers,
        riskFactors: responseAny?.risk_factors,
        financialMetrics: responseAny?.financial_metrics,
        historicalData: responseAny?.historical_years_data,
        transparency: responseAny?.transparency,
        methodologyNotes: responseAny?.methodology_notes
      });
      
      setResult(response);
      
      // Update inputData with metrics from response
      if (response.financial_metrics && inputData) {
        setInputData({
          ...inputData,
          metrics: response.financial_metrics as any // Type assertion: backend metrics may have different fields than input metrics
        });
      }
      
      // ✅ AUTO-SAVE TO DATABASE (primary storage)
      // This will also send PostMessage to parent window (upswitch.biz)
      try {
        const saveResult = await get().saveToBackend();
        if (saveResult) {
          storeLogger.info('Valuation auto-saved to database', { valuationId: saveResult.id });
        }
      } catch (saveError) {
        storeLogger.warn('Failed to auto-save to database', { error: saveError });
        // Don't fail the whole operation - valuation still calculated successfully
      }
      
      // 📝 DEPRECATED: localStorage save (keeping for backward compatibility/guest users)
      // TODO: Remove this after guest user flow is implemented
      // useReportsStore.getState().addReport({
      //   company_name: formData.company_name,
      //   source: 'manual',
      //   result: response,
      //   form_data: formData,
      // });
    } catch (error: any) {
      storeLogger.error('Valuation error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: error.response?.data 
      });
      
      // Extract detailed error message
      let errorMessage = 'Failed to calculate valuation';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle Pydantic validation errors (array format)
          errorMessage = error.response.data.detail.map((err: any) => {
            const field = err.loc?.join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join('; ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  },
  
  quickValuation: async () => {
    const { formData, setIsCalculatingLive, setLiveEstimate } = get();
    
    if (!formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code) {
      return;
    }
    
    setIsCalculatingLive(true);
    
    try {
      const quickRequest: QuickValuationRequest = {
        revenue: formData.revenue,
        ebitda: formData.ebitda,
        industry: formData.industry,
        country_code: formData.country_code,
      };
      
      const response = await api.quickValuation(quickRequest);
      setLiveEstimate(response);
    } catch (error: any) {
      // Silently fail for live preview
      storeLogger.error('Quick valuation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCalculatingLive(false);
    }
  },
  
  /**
   * Save valuation to backend database
   * Requires authentication via cookie
   */
  saveToBackend: async (businessId?: string) => {
    const { result, formData, setSavedValuationId, setError } = get();
    
    if (!result) {
      storeLogger.warn('No valuation result to save');
      return null;
    }
    
    try {
      storeLogger.info('Saving valuation to backend');
      
      // Use environment variable for backend URL (Node.js backend for auth & saving)
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
                          import.meta.env.VITE_API_BASE_URL || 
                          'https://web-production-8d00b.up.railway.app';
      
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
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save valuation');
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.id) {
        setSavedValuationId(data.data.id);
        storeLogger.info('Valuation saved successfully', { valuationId: data.data.id });
        
        // Notify parent window via PostMessage
        if (window.opener || window.parent !== window) {
          const targetOrigin = import.meta.env.VITE_PARENT_DOMAIN || 'https://upswitch.biz';
          
          const message = {
            type: 'VALUATION_SAVED',
            valuationId: data.data.id,
            companyName: formData.company_name,
            timestamp: new Date().toISOString(),
          };
          
          // Try to send to opener (new window)
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, targetOrigin);
            storeLogger.debug('PostMessage sent to opener window');
          }
          
          // Try to send to parent (iframe)
          if (window.parent !== window) {
            window.parent.postMessage(message, targetOrigin);
            storeLogger.debug('PostMessage sent to parent window');
          }
        }
        
        return { id: data.data.id };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      storeLogger.error('Failed to save valuation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setError(error.message || 'Failed to save valuation to backend');
      return null;
    }
  },
}));
