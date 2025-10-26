import type { ValuationResponse } from '../../../types/valuation';

export interface WeightExplanation {
  dcfReasons: string[];
  multiplesReasons: string[];
}

/**
 * Generate explanations for why DCF and Multiples weights were chosen
 */
export const getWeightExplanation = (
  dcfWeight: number,
  multiplesWeight: number,
  result: ValuationResponse
): WeightExplanation => {
  const resultAny = result as any;
  const dcfReasons: string[] = [];
  const multiplesReasons: string[] = [];
  
  // DCF reasons
  if (dcfWeight > 0) {
    if (resultAny.historical_years_data?.length >= 3) {
      dcfReasons.push('Strong historical cash flow data available');
    }
    if (result.financial_metrics.ebitda_margin > 0.1) {
      dcfReasons.push('Positive profitability enables reliable projections');
    }
    if (result.financial_metrics.revenue_growth > 0.15) {
      dcfReasons.push('High growth rate is well-captured by DCF methodology');
    }
    if (resultAny.dcf_valuation?.confidence_score > 70) {
      dcfReasons.push('High confidence in cash flow projections');
    }
    if (resultAny.dcf_valuation?.wacc && resultAny.dcf_valuation.wacc < 15) {
      dcfReasons.push('Stable cost of capital enables reliable discounting');
    }
    if (result.financial_metrics.financial_health_score > 70) {
      dcfReasons.push('Strong financial health supports cash flow projections');
    }
  }
  
  // Multiples reasons
  if (multiplesWeight > 0) {
    const comparablesCount = resultAny.multiples_valuation?.comparables_count || 0;
    if (comparablesCount > 10) {
      multiplesReasons.push(`Strong comparable company data (${comparablesCount} similar companies)`);
    }
    if (resultAny.multiples_valuation?.comparables_quality === 'high') {
      multiplesReasons.push('High-quality industry comparables available');
    }
    if (result.financial_metrics.ebitda_margin > 0) {
      multiplesReasons.push('Positive EBITDA enables reliable multiple valuation');
    }
    if (resultAny.multiples_valuation?.ebitda_multiple && resultAny.multiples_valuation.ebitda_multiple > 0) {
      multiplesReasons.push('Industry has established EBITDA multiple benchmarks');
    }
    if (resultAny.multiples_valuation?.revenue_multiple && resultAny.multiples_valuation.revenue_multiple > 0) {
      multiplesReasons.push('Revenue multiples are reliable for your industry');
    }
    if (result.financial_metrics.financial_health_score > 60) {
      multiplesReasons.push('Company profile matches market comparables well');
    }
  }
  
  // If no specific reasons found, add generic explanations
  if (dcfWeight > 0 && dcfReasons.length === 0) {
    dcfReasons.push('DCF methodology is applicable to your business model');
  }
  
  if (multiplesWeight > 0 && multiplesReasons.length === 0) {
    multiplesReasons.push('Market multiples provide reliable valuation benchmark');
  }
  
  return { dcfReasons, multiplesReasons };
};

/**
 * Calculate confidence factors from valuation result
 */
export const calculateConfidenceFactors = (result: ValuationResponse) => {
  const resultAny = result as any;
  
  // Try to get from transparency.confidence_factors first
  if (resultAny.transparency?.confidence_factors) {
    return resultAny.transparency.confidence_factors;
  }
  
  // Fallback: Calculate from available data
  const historicalDataLength = resultAny.historical_years_data?.length || 0;
  const hasHistoricalData = historicalDataLength > 0;
  
  const dataQuality = calculateDataQuality(result);
  const historicalDataScore = hasHistoricalData ? 
    Math.min(100, (historicalDataLength / 3) * 100) : 0;
  const methodologyAgreement = calculateMethodologyAgreement(result);
  const industryBenchmarks = result.multiples_valuation?.comparables_quality === 'high' ? 85 : 70;
  const companyProfile = result.financial_metrics?.financial_health_score || 70;
  const marketConditions = 75; // Default
  const geographicData = 80; // Default for European markets
  const businessModelClarity = 85; // Default
  
  return {
    data_quality: dataQuality,
    historical_data: historicalDataScore,
    methodology_agreement: methodologyAgreement,
    industry_benchmarks: industryBenchmarks,
    company_profile: companyProfile,
    market_conditions: marketConditions,
    geographic_data: geographicData,
    business_model_clarity: businessModelClarity
  };
};

/**
 * Calculate data quality score based on available financial data
 */
const calculateDataQuality = (result: ValuationResponse): number => {
  let score = 0;
  let factors = 0;
  
  // Revenue and EBITDA provided
  if (result.financial_metrics?.revenue_growth !== undefined) {
    score += 20;
    factors++;
  }
  
  if (result.financial_metrics?.ebitda_margin !== undefined) {
    score += 20;
    factors++;
  }
  
  // Historical data
  const resultAny = result as any;
  if (resultAny.historical_years_data && resultAny.historical_years_data.length > 0) {
    score += 30;
    factors++;
  }
  
  // Financial health metrics
  if (result.financial_metrics?.financial_health_score !== undefined) {
    score += 20;
    factors++;
  }
  
  // Additional financial metrics
  if (result.financial_metrics?.gross_margin !== undefined) {
    score += 10;
    factors++;
  }
  
  return factors > 0 ? Math.min(100, score) : 0;
};

/**
 * Calculate methodology agreement score
 */
const calculateMethodologyAgreement = (result: ValuationResponse): number => {
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.ev_ebitda_valuation || 0;
  
  if (dcfValue === 0 || multiplesValue === 0) {
    return 50; // Neutral if one methodology not available
  }
  
  const difference = Math.abs(dcfValue - multiplesValue);
  const average = (dcfValue + multiplesValue) / 2;
  const percentageDifference = (difference / average) * 100;
  
  // Higher agreement = lower percentage difference
  if (percentageDifference < 10) return 90;
  if (percentageDifference < 20) return 80;
  if (percentageDifference < 30) return 70;
  if (percentageDifference < 50) return 60;
  return 40;
};
