// Valuation Engine API Types

// Enums matching backend
export enum IndustryCode {
  TECHNOLOGY = "technology",
  MANUFACTURING = "manufacturing",
  RETAIL = "retail",
  SERVICES = "services",
  HEALTHCARE = "healthcare",
  FINANCE = "finance",
  REAL_ESTATE = "real_estate",
  HOSPITALITY = "hospitality",
  CONSTRUCTION = "construction",
  AGRICULTURE = "agriculture",
  OTHER = "other"
}

export enum BusinessModel {
  B2B = "b2b",
  B2C = "b2c",
  B2B_SAAS = "b2b_saas",
  MARKETPLACE = "marketplace",
  ECOMMERCE = "ecommerce",
  MANUFACTURING = "manufacturing",
  SERVICES = "services",
  OTHER = "other"
}

export interface YearDataInput {
  year: number;
  revenue: number;
  ebitda: number;
  
  // Optional detailed financials
  cogs?: number;
  gross_profit?: number;
  operating_expenses?: number;
  ebit?: number;
  depreciation?: number;
  amortization?: number;
  interest_expense?: number;
  tax_expense?: number;
  net_income?: number;
  
  // Balance sheet
  total_assets?: number;
  current_assets?: number;
  cash?: number;
  accounts_receivable?: number;
  inventory?: number;
  total_liabilities?: number;
  current_liabilities?: number;
  total_debt?: number;
  total_equity?: number;
  
  // Cash flow
  nwc_change?: number;
}

export interface ValuationRequest {
  // Company information (all required)
  company_name: string;
  country_code: string; // 2-letter ISO code (e.g., "BE", "DE", "US")
  industry: IndustryCode | string; // Backend expects IndustryCode enum
  business_model: BusinessModel | string; // Backend expects BusinessModel enum
  founding_year: number; // Required by backend
  
  // Financial data (required)
  current_year_data: YearDataInput;
  historical_years_data?: YearDataInput[];
  
  // Optional company details
  number_of_employees?: number;
  recurring_revenue_percentage?: number; // 0.0 to 1.0
  
  // Optional market context overrides
  government_bond_yield?: number;
  long_term_gdp_growth?: number;
  
  // Valuation preferences
  use_dcf?: boolean;
  use_multiples?: boolean;
  projection_years?: number; // 5-15 years
  
  // Optional comparable companies
  comparables?: Array<{
    name: string;
    ev_ebitda_multiple?: number;
    ev_revenue_multiple?: number;
    pe_ratio?: number;
  }>;
}

// Extended request type for frontend form state
export interface ValuationFormData extends Partial<ValuationRequest> {
  revenue?: number;
  ebitda?: number;
  business_type?: 'sole-trader' | 'company';
  shares_for_sale?: number;
}

export interface QuickValuationRequest {
  revenue: number;
  ebitda: number;
  industry: string;
  country_code: string;
}

export interface ValuationResponse {
  valuation_id: string;
  company_name: string;
  timestamp: string;
  
  // Final results
  equity_value_low: number;
  equity_value_mid: number;
  equity_value_high: number;
  recommended_asking_price: number;
  
  // Confidence (multiple formats for compatibility)
  confidence_score: number;
  overall_confidence: string;
  confidence?: number; // Alias for confidence_score
  
  // Methodology
  primary_method?: string;
  methodology?: string;
  
  // Methodology breakdown
  dcf_result: {
    enterprise_value: number;
    equity_value: number;
    wacc: number;
    terminal_value: number;
    pv_fcf: number;
    pv_terminal_value: number;
    fcf_projections: Array<{
      year: number;
      revenue: number;
      ebitda: number;
      fcf: number;
      discount_factor: number;
      pv_fcf: number;
    }>;
  };
  
  multiples_result: {
    ev_ebitda_valuation: number;
    ev_revenue_valuation: number;
    pe_valuation: number | null;
    comparable_companies: Array<{
      name: string;
      ev_ebitda: number;
      ev_revenue: number;
      pe_ratio?: number;
    }>;
  };
  
  financial_metrics: {
    ebitda_margin: number;
    net_margin: number;
    roa?: number;
    roe?: number;
    debt_to_equity?: number;
    current_ratio?: number;
    financial_health_score: number;
  };
  
  // Weights
  dcf_weight: number;
  multiples_weight: number;
  
  // Ownership adjustment (optional)
  ownership_adjustment?: {
    shares_for_sale: number;
    control_premium: number;
    adjusted_value: number;
  };
  
  // Insights (multiple formats for compatibility)
  key_value_drivers: string[];
  value_drivers?: string[]; // Alias for key_value_drivers
  risk_factors: string[];
}

export interface CompanyLookupResult {
  name: string;
  industry: string;
  country: string;
  founding_year?: number;
  employees?: number;
  business_model?: string;
  revenue?: number;
  description?: string;
}

export interface DocumentParseResult {
  extracted_data: Partial<ValuationRequest>;
  confidence: number;
  warnings: string[];
}

