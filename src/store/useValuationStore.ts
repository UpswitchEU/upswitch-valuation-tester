import { create } from 'zustand';
import type { ValuationRequest, ValuationResponse, QuickValuationRequest, ValuationFormData } from '../types/valuation';
import { api } from '../services/api';

interface ValuationStore {
  // Form data
  formData: ValuationFormData;
  
  updateFormData: (data: Partial<ValuationFormData>) => void;
  resetFormData: () => void;

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
  
  // Actions
  calculateValuation: () => Promise<void>;
  quickValuation: () => Promise<void>;
}

// Helper to get safe current year (allow up to current year, max 2100 per backend validation)
const getSafeCurrentYear = () => Math.min(new Date().getFullYear(), 2100);

const defaultFormData: ValuationFormData = {
  company_name: 'My Company', // Default company name to avoid validation error
  country_code: 'BE',
  industry: '',
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
      
      const request: ValuationRequest = {
        company_name: formData.company_name,
        country_code: formData.country_code || 'BE',
        industry: formData.industry,
        business_model: formData.business_model || 'other',
        founding_year: foundingYear,
        current_year_data: {
          year: currentYear,
          revenue: formData.revenue, // Use formData.revenue
          ebitda: formData.ebitda, // Use formData.ebitda
          // Include optional fields if present (ensure they're non-negative where required)
          ...(formData.current_year_data?.total_assets && formData.current_year_data.total_assets >= 0 && { total_assets: formData.current_year_data.total_assets }),
          ...(formData.current_year_data?.total_debt && formData.current_year_data.total_debt >= 0 && { total_debt: formData.current_year_data.total_debt }),
          ...(formData.current_year_data?.cash && formData.current_year_data.cash >= 0 && { cash: formData.current_year_data.cash }),
        },
        historical_years_data: formData.historical_years_data && formData.historical_years_data.length > 0 
          ? formData.historical_years_data.map(year => ({
              ...year,
              year: Math.min(Math.max(year.year, 2000), 2100)
            }))
          : [{
              year: Math.min(currentYear - 1, 2100),
              revenue: formData.revenue * 0.9, // Assume 10% growth
              ebitda: formData.ebitda * 0.9,
            }],
        number_of_employees: formData.number_of_employees && formData.number_of_employees >= 0 ? formData.number_of_employees : undefined,
        recurring_revenue_percentage: recurringRevenue,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: formData.comparables || [],
      };
      
      console.log('Sending valuation request:', request);
      const response = await api.calculateValuation(request);
      setResult(response);
    } catch (error: any) {
      console.error('Valuation error:', error);
      console.error('Error response:', error.response?.data);
      
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
      console.error('Quick valuation failed:', error);
    } finally {
      setIsCalculatingLive(false);
    }
  },
}));
