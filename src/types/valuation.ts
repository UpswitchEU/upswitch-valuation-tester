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
  OTHER = "other"
}

export enum BusinessModel {
  B2B_SAAS = "b2b_saas",
  B2C = "b2c",
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
  
  // Additional business context
  business_type?: string;
  revenue?: number;
  employee_count?: number;
  business_description?: string;
  business_highlights?: string;
  reason_for_selling?: string;
  city?: string;
  
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
  // Required fields that must be present in form data
  business_model: BusinessModel | string;
  founding_year: number;
  
  // NEW: Primary business type ID from PostgreSQL
  business_type_id?: string;
  
  // Phase 2: Sub-industry granularity
  subIndustry?: string;
  employees?: number;
  
  // Internal preferences (not sent to backend)
  _internal_dcf_preference?: number;
  _internal_multiples_preference?: number;
  
  // Legacy fields for backward compatibility
  revenue?: number;
  ebitda?: number;
  business_type?: 'sole-trader' | 'company';
  shares_for_sale?: number;
  employee_count?: number;
  business_description?: string;
  business_highlights?: string;
  reason_for_selling?: string;
  city?: string;
}

export interface QuickValuationRequest {
  revenue: number;
  ebitda: number;
  industry: string;
  country_code: string;
}

// Quick valuation uses same response format as full valuation
export type QuickValuationResponse = ValuationResponse;

// Transparency-related interfaces
export interface TransparencyData {
  data_sources: DataSource[];
  calculation_steps: CalculationStep[];
  comparable_companies?: ComparableCompany[];
  confidence_breakdown: ConfidenceBreakdown;
  range_methodology: RangeMethodology;
}

export interface DataSource {
  name: string;
  value: any;
  source: string;
  timestamp: string;
  confidence: number;
  api_url?: string;
  cache_status?: string;
}

export interface CalculationStep {
  step_number: number;
  description: string;
  formula: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  explanation: string;
}

export interface ComparableCompany {
  name: string;
  country: string;
  revenue: number;
  ebitda_multiple?: number;
  revenue_multiple?: number;
  similarity_score: number;
  source: string;
}

export interface ConfidenceBreakdown {
  data_quality: number;
  historical_data: number;
  methodology_agreement: number;
  industry_benchmarks: number;
  company_profile: number;
  market_conditions: number;
  geographic_data: number;
  business_model_clarity: number;
  overall_score: number;
}

export interface RangeMethodology {
  mid_point: number;
  confidence_level: string;
  base_spread: number;
  asymmetric_adjustment: boolean;
  downside_factor: number;
  upside_factor: number;
  low_value: number;
  high_value: number;
  academic_source: string;
}

export interface ValuationResponse {
  valuation_id: string;
  company_name: string;
  timestamp?: string;
  valuation_date?: string;
  creditsRemaining?: number; // Added for backend credit synchronization
  
  // Final results
  equity_value_low: number;
  equity_value_mid: number;
  equity_value_high: number;
  recommended_asking_price: number;
  
  // Confidence (multiple formats for compatibility)
  confidence_score: number;
  overall_confidence: string;
  confidence?: number; // Alias for confidence_score
  
  // Transparency data
  transparency?: TransparencyData;
  
  // Owner Dependency Assessment (Phase 4: 12-factor analysis)
  owner_dependency_result?: {
    factors: {
      client_concentration: string;
      operational_knowledge: string;
      sales_relationship: string;
      technical_expertise: string;
      industry_network: string;
      decision_making: string;
      brand_reputation: string;
      process_documentation: string;
      team_capability: string;
      succession_planning: string;
      business_scalability: string;
      contract_transferability: string;
    };
    overall_score: number;
    risk_level: string;
    valuation_adjustment: number;
    explanation: string;
    key_risks: string[];
    recommendations: string[];
  };
  owner_dependency_adjustment?: number;
  
  // Methodology
  primary_method?: string;
  methodology?: string;
  methodology_notes?: string;
  valuation_summary?: string;
  
  // Weights
  dcf_weight: number;
  multiples_weight: number;
  
  // DCF Valuation (detailed breakdown from API)
  dcf_valuation?: {
    enterprise_value: number;
    equity_value: number;
    wacc: number;
    cost_of_equity: number;
    cost_of_debt: number;
    terminal_growth_rate: number;
    terminal_value: number;
    pv_terminal_value: number;
    fcf_projections_5y: number[];
    pv_fcf_projections_5y: number[];
    sensitivity_wacc: Record<string, number>;
    sensitivity_growth: Record<string, number>;
    confidence: string;
    confidence_score: number;
    confidence_factors: Record<string, string>;
  };
  
  // Market Multiples (detailed breakdown from API)
  multiples_valuation?: {
    ev_ebitda_valuation: number;
    ev_revenue_valuation: number;
    pe_valuation: number | null;
    ebitda_multiple: number;
    revenue_multiple: number;
    pe_multiple: number | null;
    comparables_count: number;
    comparables_quality: string;
    size_discount: number;
    liquidity_discount: number;
    country_adjustment: number;
    total_adjustment: number;
    adjusted_equity_value: number;
    confidence: string;
    confidence_score: number;
  };
  
  // Financial Metrics (comprehensive)
  financial_metrics: {
    gross_margin: number;
    ebitda_margin: number;
    ebit_margin: number;
    net_margin: number;
    return_on_assets: number;
    return_on_equity: number;
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    debt_to_equity: number;
    debt_to_assets: number;
    interest_coverage: number;
    revenue_growth: number;
    revenue_cagr_3y: number;
    ebitda_growth: number;
    altman_z_score: number;
    financial_health_score: number;
    financial_health_description: string;
  };
  
  // Legacy fields for backward compatibility
  dcf_result?: {
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
  
  multiples_result?: {
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

// =============================================================================
// INTELLIGENT CONVERSATION TYPES
// =============================================================================

export interface ConversationStartRequest {
  user_id?: string; // Add user_id for intelligent triage
  business_context?: {
    company_name?: string;
    industry?: string;
    business_model?: string;
    country_code?: string;
    founding_year?: number;
  };
  user_preferences?: {
    preferred_methodology?: string;
    time_commitment?: 'quick' | 'detailed' | 'comprehensive';
    focus_area?: 'valuation' | 'growth' | 'risk' | 'all';
  };
  pre_filled_data?: Partial<ValuationRequest>;
}

export interface ConversationStartResponse {
  session_id: string;
  complete: boolean;
  ai_message: string;
  step: number;
  field_name?: string;
  input_type?: string;
  validation_rules?: Record<string, any>;
  help_text?: string;
  context: Record<string, any>;
  owner_profile_needed: boolean;
  valuation_result?: any;
}

export interface ConversationQuestion {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'text' | 'number' | 'yes_no' | 'rating';
  options?: string[];
  required: boolean;
  context?: string;
  help_text?: string;
}

export interface ConversationStepRequest {
  session_id: string;
  answer: string | number | boolean;
  question_id: string;
  additional_context?: string;
}

export interface ConversationStepResponse {
  next_question?: ConversationQuestion;
  is_complete: boolean;
  progress_percentage: number;
  current_valuation?: ValuationResponse;
  insights?: string[];
  recommendations?: string[];
}

export interface ConversationContext {
  session_id: string;
  business_context: Partial<ValuationRequest>;
  owner_profile: OwnerProfile;
  conversation_history: ConversationHistory[];
  current_step: number;
  total_steps: number;
  methodology_selected?: string;
  
  // ADD: Extracted business information
  extracted_business_model?: BusinessModel | string;
  extracted_founding_year?: number;
  extraction_confidence?: {
    business_model?: number;  // 0-1 confidence score
    founding_year?: number;
  };
}

export interface ConversationHistory {
  question_id: string;
  question: string;
  answer: string | number | boolean;
  timestamp: string;
  context_added?: string;
}

// =============================================================================
// BUSINESS TYPE ANALYSIS TYPES
// =============================================================================

export interface BusinessTypeAnalysis {
  business_type: string;
  industry_code: string;
  methodology_recommendation: string;
  confidence_score: number;
  reasoning: string;
  key_factors: string[];
  risk_factors: string[];
  growth_potential: 'low' | 'medium' | 'high';
  market_maturity: 'emerging' | 'growing' | 'mature' | 'declining';
}

export interface MethodologyRecommendation {
  recommended_methodology: string;
  alternative_methodologies: string[];
  confidence_score: number;
  reasoning: string;
  key_factors: string[];
  expected_accuracy: number;
  time_estimate: string;
}

// =============================================================================
// OWNER PROFILING TYPES
// =============================================================================

export interface OwnerProfile {
  involvement_level: 'hands_on' | 'strategic' | 'passive' | 'absentee';
  time_commitment: number; // hours per week
  succession_plan: 'family' | 'management' | 'sale' | 'none' | 'uncertain';
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
  growth_ambition: 'maintain' | 'moderate_growth' | 'aggressive_growth' | 'exit';
  industry_experience: number; // years
  management_team_strength: 'weak' | 'adequate' | 'strong' | 'excellent';
  key_man_risk: boolean;
  personal_guarantees: boolean;
  additional_context?: string;
}

export interface OwnerProfileRequest {
  session_id?: string;
  profile: OwnerProfile;
  business_context: Partial<ValuationRequest>;
}

export interface OwnerProfileResponse {
  profile_analysis: {
    risk_assessment: string;
    value_impact: string;
    recommendations: string[];
    confidence_score: number;
  };
  valuation_adjustments?: {
    risk_premium_adjustment: number;
    growth_rate_adjustment: number;
    multiple_adjustment: number;
    reasoning: string;
  };
}

// =============================================================================
// VALUATION TOOLBAR TYPES
// =============================================================================

export interface ValuationInputData {
  revenue: number;
  ebitda: number;
  industry: string;
  country_code: string;
  founding_year?: number;
  employees?: number;
  business_model?: string;
  historical_years_data?: YearDataInput[];
  total_debt?: number;
  cash?: number;
  metrics?: {
    gross_margin: number;
    ebitda_margin: number;
    ebit_margin: number;
    net_margin: number;
    return_on_assets: number;
    return_on_equity: number;
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    debt_to_equity: number;
    debt_to_assets: number;
    interest_coverage: number;
    asset_turnover: number;
    inventory_turnover: number;
    receivables_turnover: number;
    payables_turnover: number;
    revenue_growth: number;
    financial_health_description: string;
  };
}

export interface ValuationToolbarProps {
  onRefresh?: () => void;
  onDownload?: () => void;
  onFullScreen?: () => void;
  isGenerating?: boolean;
  user?: any;
  valuationName?: string;
  valuationId?: string;
  activeTab?: 'preview' | 'source' | 'info';
  onTabChange?: (tab: 'preview' | 'source' | 'info') => void;
  companyName?: string;
  valuationMethod?: string;
}

