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

export interface FinancialFilingYear {
  year: number;
  revenue?: number;
  ebitda?: number;
  net_income?: number;
  total_assets?: number;
  total_debt?: number;
  cash?: number;
  filing_date: string;
  source_url?: string;
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
  filing_history: FinancialFilingYear[];
  data_source: string;
  last_updated: string;
  completeness_score: number;
  source_url?: string;
}