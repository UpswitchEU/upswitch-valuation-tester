import { create } from 'zustand';
import type { ValuationRequest, ValuationResponse, QuickValuationRequest, ValuationFormData } from '../types/valuation';
import { api } from '../services/api';
import { backendAPI } from '../services/backendApi';
import { storeLogger } from '../utils/logger';
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
  business_model: 'other', // Default business model
  founding_year: getSafeCurrentYear() - 5, // Default to 5 years ago
  business_type: 'company',
  shares_for_sale: 100,
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
  
  // Actions
  calculateValuation: async () => {
    const { formData, setIsCalculating, setResult, setError } = get();
    
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
      if (!formData.revenue || !formData.ebitda) {
        throw new Error('Revenue and EBITDA are required');
      }
      if (formData.revenue <= 0) {
        throw new Error('Revenue must be greater than 0');
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
      const businessModel = formData.business_model || 'other';
      const revenue = Math.max(Number(formData.revenue) || 100000, 1); // Ensure positive revenue
      const ebitda = Number(formData.ebitda) || 20000;
      
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
          ? formData.historical_years_data.map(year => ({
              ...year,
              year: Math.min(Math.max(Number(year.year), 2000), 2100),
              revenue: Math.max(Number(year.revenue) || 0, 1), // Ensure positive revenue
              ebitda: Number(year.ebitda) || 0,
            }))
          : (revenue > 0 && ebitda !== 0)
            ? [{
                year: Math.min(currentYear - 1, 2100),
                revenue: Math.max(revenue * 0.9, 1), // Assume 10% growth, ensure positive
                ebitda: ebitda * 0.9,
              }]
            : [], // Don't send historical data if current data is invalid
        number_of_employees: formData.number_of_employees && formData.number_of_employees >= 0 ? formData.number_of_employees : undefined,
        recurring_revenue_percentage: recurringRevenue,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: formData.comparables || [],
      };
      
      storeLogger.info('Sending manual valuation request (FREE)', { 
        companyName: request.company_name,
        revenue: request.current_year_data.revenue,
        ebitda: request.current_year_data.ebitda,
        requestData: request
      });
      const response = await backendAPI.calculateManualValuation(request);
      setResult(response);
      
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
