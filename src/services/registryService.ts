/**
 * Registry Service
 * 
 * Connects to the real Upswitch Backend API
 * https://web-production-8d00b.up.railway.app
 */

import axios from 'axios';
import type { CompanyFinancialData, CompanySearchResult } from '../types/registry';

// Types for search suggestions
export interface SearchSuggestion {
  text: string;
  type: 'variation' | 'method' | 'language';
  confidence: number;
  reason: string;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  total_suggestions: number;
  company_name: string;
  country_code: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                     import.meta.env.VITE_VALUATION_API_URL || 
                     'https://web-production-8d00b.up.railway.app';
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Retry helper for transient failures
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  attempt: number = 1
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check if error is retryable
    const isRetryable = 
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ERR_NETWORK' || // Network error
      error.response?.status >= 500 || // Server error
      error.response?.status === 429; // Rate limited
    
    if (isRetryable && attempt < maxRetries) {
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, maxRetries, attempt + 1);
    }
    
    throw error;
  }
};

/**
 * Real company search using the Upswitch Valuation Engine API
 * POST /api/v1/registry/search
 */
export const searchCompanies = async (
  companyName: string,
  countryCode: string
): Promise<CompanySearchResult[]> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/v1/registry/search', {
        company_name: companyName,
        country_code: countryCode,
        limit: 10
      });

      console.log('📡 Raw API response:', response.data);
      console.log('📡 Raw results:', response.data.results);

      // Transform API response to our expected format
      const results: CompanySearchResult[] = response.data.results.map((result: any) => {
        console.log('📡 Mapping result:', result);
        
        const mapped = {
          result_type: result.result_type || 'COMPANY',  // Explicit type field
          company_id: result.company_id,
          company_name: result.company_name,
          registration_number: result.registration_number,
          country_code: result.country_code,
          legal_form: result.legal_form,
          address: result.address,
          website: result.website,
          status: result.status || 'active',
          confidence_score: result.confidence_score || 0.9,
          registry_name: result.registry_name,
          registry_url: result.registry_url
        };
        
        console.log('📡 Mapped result:', mapped);
        return mapped;
      });

      console.log('📡 Final results:', results);
      return results;
    } catch (error) {
      console.error('Company search failed:', error);
      throw error; // Let withRetry handle retries
    }
  });
};

/**
 * Get search suggestions for company names
 * GET /api/v1/registry/suggestions
 */
export const getSearchSuggestions = async (
  companyName: string,
  countryCode: string = 'BE'
): Promise<SearchSuggestionsResponse> => {
  try {
    const response = await apiClient.get('/api/v1/registry/suggestions', {
      params: {
        company_name: companyName,
        country_code: countryCode,
        limit: 5
      }
    });

    return response.data;
  } catch (error) {
    console.error('Search suggestions failed:', error);
    throw new Error('Failed to get search suggestions. Please try again.');
  }
};

/**
 * Real company financial data fetch using the Upswitch Valuation Engine API
 * POST /api/v1/registry/financials
 */
export const fetchCompanyFinancials = async (
  companyId: string,
  countryCode: string,
  years: number = 3
): Promise<CompanyFinancialData> => {
  return withRetry(async () => {
    try {
      const response = await apiClient.post('/api/v1/registry/financials', {
        company_id: companyId,
        country_code: countryCode,
        years: years
      });

      // Transform API response to our expected format
      const financialData: CompanyFinancialData = {
        company_id: response.data.company_id,
        company_name: response.data.company_name,
        registration_number: response.data.registration_number,
        country_code: response.data.country_code,
        legal_form: response.data.legal_form,
        filing_history: response.data.filing_history,
        founding_year: response.data.founding_year,
        industry_code: response.data.industry_code,
        industry_description: response.data.industry_description,
        employees: response.data.employees,
        website: response.data.website,
        data_source: response.data.data_source,
        source_url: response.data.source_url,
        last_updated: response.data.last_updated,
        completeness_score: response.data.completeness_score
      };

      return financialData;
    } catch (error) {
      console.error('Financial data fetch failed:', error);
      throw error; // Let withRetry handle retries
    }
  });
};

/**
 * Complete lookup and valuation in one call
 * GET /api/v1/registry/lookup-and-value
 */
export const lookupAndValue = async (
  companyName: string,
  countryCode: string,
  years: number = 3
): Promise<any> => {
  try {
    const response = await apiClient.get('/api/v1/registry/lookup-and-value', {
      params: {
        company_name: companyName,
        country_code: countryCode,
        years: years
      }
    });

    return response.data;
  } catch (error) {
    console.error('Lookup and value failed:', error);
    throw new Error('Failed to lookup and value company. Please try again.');
  }
};

/**
 * Get supported countries
 * GET /api/v1/registry/supported-countries
 */
export const getSupportedCountries = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/v1/registry/supported-countries');
    return response.data;
  } catch (error) {
    console.error('Failed to get supported countries:', error);
    throw new Error('Failed to get supported countries.');
  }
};

/**
 * Health check for registry services
 * GET /api/v1/registry/health
 */
export const checkRegistryHealth = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/v1/registry/health');
    return response.data;
  } catch (error) {
    console.error('Registry health check failed:', error);
    throw new Error('Registry health check failed.');
  }
};

// Backward compatibility - keep the old function names
export const mockCompanySearch = searchCompanies;
export const mockFetchFinancials = fetchCompanyFinancials;
