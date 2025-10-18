/**
 * Registry Service Types
 * 
 * Centralized type definitions for the unified registry service
 */

export interface CompanySearchResult {
  company_id: string;
  company_name: string;
  result_type: string;
  registration_number: string;
  country_code: string;
  legal_form: string;
  address: string;
  status: string;
  confidence_score: number;
  registry_name: string;
  registry_url: string;
  website?: string;
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
    cost_of_goods_sold?: number;
    operating_expenses?: number;
  }>;
  data_source: string;
  last_updated: string;
  completeness_score: number;
}

export interface SearchSuggestion {
  text: string;
  type: string;
  reason?: string;
  confidence?: number;
}

export interface CompanySearchResponse {
  success: boolean;
  results: CompanySearchResult[];
  error?: string;
  requestId: string;
  total_results?: number;
  search_time_ms?: number;
  registry_name?: string;
}

export interface CachedData {
  data: any;
  timestamp: number;
}

export interface RegistryServiceConfig {
  baseURL: string;
  cacheTTL: number;
  maxCacheSize: number;
  timeout: number;
}
