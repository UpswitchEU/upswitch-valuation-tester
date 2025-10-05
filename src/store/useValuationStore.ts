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

const defaultFormData: ValuationFormData = {
  company_name: '',
  country_code: 'BE',
  industry: '',
  business_model: 'other', // Default business model
  founding_year: new Date().getFullYear() - 5, // Default to 5 years ago
  business_type: 'company',
  shares_for_sale: 100,
  revenue: undefined,
  ebitda: undefined,
  current_year_data: {
    year: new Date().getFullYear(),
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
      if (!formData.company_name) {
        throw new Error('Company name is required');
      }
      if (!formData.industry) {
        throw new Error('Industry is required');
      }
      if (!formData.current_year_data?.revenue || !formData.current_year_data?.ebitda) {
        throw new Error('Revenue and EBITDA are required');
      }
      
      const request: ValuationRequest = {
        company_name: formData.company_name,
        country_code: formData.country_code || 'BE',
        industry: formData.industry,
        business_model: formData.business_model || 'other',
        founding_year: formData.founding_year || new Date().getFullYear() - 5, // Default to 5 years ago
        current_year_data: {
          year: formData.current_year_data.year || new Date().getFullYear(),
          revenue: formData.current_year_data.revenue,
          ebitda: formData.current_year_data.ebitda,
          // Include optional fields if present
          ...(formData.current_year_data.total_assets && { total_assets: formData.current_year_data.total_assets }),
          ...(formData.current_year_data.total_debt && { total_debt: formData.current_year_data.total_debt }),
          ...(formData.current_year_data.cash && { cash: formData.current_year_data.cash }),
        },
        historical_years_data: formData.historical_years_data || [],
        number_of_employees: formData.number_of_employees,
        recurring_revenue_percentage: formData.recurring_revenue_percentage || 0.0,
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
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to calculate valuation';
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
