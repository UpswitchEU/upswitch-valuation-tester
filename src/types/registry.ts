/**
 * Registry-First Architecture Types
 * 
 * Types for company registry lookups and financial data fetching
 * Matches backend API schema from valuation-engine
 */

export interface CompanySearchResult {
  company_id: string;
  company_name: string;
  registration_number: string;
  legal_form: string;
  address?: string;
  status: string;
  confidence_score: number;
}

export interface FinancialFilingYear {
  year: number;
  revenue?: number;
  ebitda?: number;
  net_income?: number;
  total_assets?: number;
  total_debt?: number;
  cash?: number;
  cost_of_goods_sold?: number;
  operating_expenses?: number;
  filing_date?: string;
  source_url?: string;
}

export interface CompanyFinancialData {
  company_id: string;
  company_name: string;
  registration_number: string;
  country_code: string;
  legal_form: string;
  
  // Financial history
  filing_history: FinancialFilingYear[];
  
  // Company metadata
  founding_year?: number;
  industry_code?: string;
  industry_description?: string;
  employees?: number;
  website?: string;
  
  // Data quality
  data_source: string;
  source_url?: string;
  last_updated: string;
  completeness_score: number;
}

export interface RegistrySearchRequest {
  company_name: string;
  country_code: string;
  registration_number?: string;
}

export interface RegistrySearchResponse {
  results: CompanySearchResult[];
  registry_name: string;
  registry_url: string;
}

export interface RegistryFetchRequest {
  company_id: string;
  country_code: string;
  years?: number;
}

