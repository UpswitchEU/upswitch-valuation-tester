import { create } from 'zustand';
import type { ValuationRequest, ValuationResponse, QuickValuationRequest } from '../types/valuation';
import { api } from '../services/api';

interface ValuationStore {
  // Form data
  formData: Partial<ValuationRequest> & {
    revenue?: number;
    ebitda?: number;
    industry?: string;
    country_code?: string;
    business_type?: 'sole-trader' | 'company';
    shares_for_sale?: number;
  };
  
  updateFormData: (data: Partial<ValuationRequest>) => void;
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

const defaultFormData: Partial<ValuationRequest> = {
  company_name: '',
  country_code: 'DE',
  industry: '',
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
      const response = await api.calculateValuation(formData as ValuationRequest);
      setResult(response);
    } catch (error: any) {
      setError(error.response?.data?.detail || error.message || 'Failed to calculate valuation');
    } finally {
      setIsCalculating(false);
    }
  },
  
  quickValuation: async () => {
    const { formData, setIsCalculatingLive, setLiveEstimate, setError } = get();
    
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
