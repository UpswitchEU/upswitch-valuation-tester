import axios from 'axios';
import { API_CONFIG } from '../config';

export interface CompanySearchResult {
  result_type: string;
  company_id: string;
  company_name: string;
  registration_number: string;
  country_code: string;
  legal_form: string;
  address: string;
  status: string;
  confidence_score: number;
  registry_name: string;
  registry_url: string;
}

export interface SearchSuggestion {
  text: string;
  type: string;
  reason?: string;
  confidence?: number;
}

export interface CompanyFinancialData {
  company_id: string;
  company_name: string;
  registration_number: string;
  country_code: string;
  legal_form: string;
  industry_code?: string;
  industry_description?: string;
  founding_year?: number;
  employees?: number;
  filing_history: Array<{
    year: number;
    revenue?: number;
    ebitda?: number;
    net_income?: number;
    total_assets?: number;
    total_debt?: number;
    cash?: number;
    filing_date: string;
    source_url?: string;
  }>;
  data_source: string;
  last_updated: string;
  completeness_score: number;
}

export const searchCompanies = async (
  companyName: string, 
  countryCode: string
): Promise<CompanySearchResult[]> => {
  try {
    const response = await axios.post(`${API_CONFIG.baseURL}/api/registry/search`, {
      company_name: companyName,
      country_code: countryCode,
      limit: 10
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('Company search error:', error);
    throw new Error('Failed to search for companies');
  }
};

export const fetchCompanyFinancials = async (
  companyId: string,
  countryCode: string
): Promise<CompanyFinancialData> => {
  try {
    const response = await axios.get(`${API_CONFIG.baseURL}/api/registry/${countryCode.toLowerCase()}/${companyId}`);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.info('ℹ️ Company registry data not available (will collect manually)');
    } else {
      console.error('Company financials fetch error:', error);
    }
    throw new Error('Failed to fetch company financial data');
  }
};

export const getSearchSuggestions = async (query: string, _country?: string): Promise<{ suggestions: SearchSuggestion[] }> => {
  // Mock implementation - in real app this would call the backend
  return {
    suggestions: [
      { text: `${query} NV`, type: 'company', reason: 'Belgian company', confidence: 0.9 },
      { text: `${query} BV`, type: 'company', reason: 'Belgian company', confidence: 0.8 },
      { text: `${query} SA`, type: 'company', reason: 'Belgian company', confidence: 0.7 }
    ]
  };
};