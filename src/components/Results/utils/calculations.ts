/**
 * Calculation utilities for Results components
 */

import type { ValuationResponse } from '../../../types/valuation';

export const calculateOwnershipAdjustment = (result: ValuationResponse) => {
  // For now, return default values since ownership_percentage is not in the type
  const ownershipPercentage = 0; // result.ownership_percentage || 0;
  const equityValue = result.equity_value_mid || 0;
  
  return {
    ownershipValue: (equityValue * ownershipPercentage) / 100,
    ownershipPercentage,
    equityValue
  };
};

export const calculateGrowthMetrics = (result: ValuationResponse) => {
  // Backend always provides CAGR in financial_metrics (never None/null)
  // Frontend should only format/display, never calculate
  const resultAny = result as any;
  const hasFinancialMetrics = resultAny.financial_metrics && Object.keys(resultAny.financial_metrics).length > 0;
  
  if (hasFinancialMetrics && resultAny.financial_metrics) {
    const metrics = resultAny.financial_metrics;
    
    // Backend always returns revenue_cagr_3y as decimal format (0.0037 = 0.37%, 0.111 = 11.1%)
    // Backend guarantees this field is never None (defaults to 0.0)
    const cagrDecimal = metrics.revenue_cagr_3y !== undefined && metrics.revenue_cagr_3y !== null 
      ? metrics.revenue_cagr_3y 
      : 0.0;
    
    // Determine years from actual year difference (first historical year to current year)
    // This matches the backend calculation which uses year difference, not historical_years_data.length
    const hasHistoricalData = resultAny.historical_years_data && resultAny.historical_years_data.length > 0;
    let years = 2; // Default fallback
    
    if (hasHistoricalData && resultAny.historical_years_data.length > 0) {
      const firstHistoricalYear = resultAny.historical_years_data[0]?.year;
      const currentYear = resultAny.current_year_data?.year;
      
      // Calculate actual year difference (matches backend logic: current_year - first_year)
      if (firstHistoricalYear && currentYear && currentYear > firstHistoricalYear) {
        years = currentYear - firstHistoricalYear;
      } else {
        // Fallback to length if year fields not available (backward compatibility)
        years = resultAny.historical_years_data.length;
      }
    }
    
    return { 
      cagr: cagrDecimal, 
      hasHistoricalData: hasHistoricalData && years > 0, 
      years 
    };
  }
  
  // If financial_metrics is missing, show no data (backend should always provide this)
  // Log warning but don't calculate - backend is source of truth
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[calculateGrowthMetrics] Financial metrics missing from backend response. Backend should always provide CAGR.');
  }
  
  return { cagr: 0, hasHistoricalData: false, years: 0 };
};

export const getValueDrivers = (result: ValuationResponse): Array<{
  label: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}> => {
  const resultAny = result as any;
  
  // Extract value drivers from the Python response
  if (resultAny.key_value_drivers && Array.isArray(resultAny.key_value_drivers) && resultAny.key_value_drivers.length > 0) {
    return resultAny.key_value_drivers.map((driver: any) => ({
      label: driver.name || driver.label || 'Value Driver',
      value: driver.value || driver.impact || 0,
      impact: (driver.impact === 'positive' ? 'positive' : 
              driver.impact === 'negative' ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral'
    }));
  }
  
  // Fallback: extract from financial metrics if available
  if (resultAny.financial_metrics) {
    const metrics = resultAny.financial_metrics;
    const drivers: Array<{
      label: string;
      value: number;
      impact: 'positive' | 'negative' | 'neutral';
    }> = [];
    
    if (metrics.revenue_growth_rate) {
      drivers.push({
        label: 'Revenue Growth Rate',
        value: metrics.revenue_growth_rate,
        impact: metrics.revenue_growth_rate > 0 ? 'positive' : 'negative'
      });
    }
    
    if (metrics.ebitda_margin) {
      drivers.push({
        label: 'EBITDA Margin',
        value: metrics.ebitda_margin,
        impact: metrics.ebitda_margin > 0.1 ? 'positive' : 'negative'
      });
    }
    
    return drivers;
  }
  
  return [];
};

export const getRiskFactors = (result: ValuationResponse): Array<{
  label: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}> => {
  const resultAny = result as any;
  
  // Extract risk factors from the Python response
  if (resultAny.risk_factors && Array.isArray(resultAny.risk_factors) && resultAny.risk_factors.length > 0) {
    return resultAny.risk_factors.map((risk: any) => ({
      label: risk.name || risk.label || 'Risk Factor',
      description: risk.description || risk.details || 'Risk factor identified',
      severity: (risk.severity === 'high' ? 'high' : 
               risk.severity === 'medium' ? 'medium' : 'low') as 'high' | 'medium' | 'low'
    }));
  }
  
  // Fallback: generate risk factors based on financial metrics
  if (resultAny.financial_metrics) {
    const metrics = resultAny.financial_metrics;
    const risks: Array<{
      label: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];
    
    if (metrics.debt_to_equity_ratio && metrics.debt_to_equity_ratio > 0.5) {
      risks.push({
        label: 'High Debt-to-Equity Ratio',
        description: `Debt-to-equity ratio of ${(metrics.debt_to_equity_ratio * 100).toFixed(1)}% indicates high financial leverage`,
        severity: metrics.debt_to_equity_ratio > 1 ? 'high' : 'medium'
      });
    }
    
    // revenue_growth_rate is in decimal format (0.20 = 20%, -0.15 = -15%)
    // Convert to percentage for display
    if (metrics.revenue_growth_rate && metrics.revenue_growth_rate < 0) {
      risks.push({
        label: 'Declining Revenue',
        description: `Revenue declining at ${(Math.abs(metrics.revenue_growth_rate) * 100).toFixed(1)}% annually`,
        severity: 'high'
      });
    }
    
    if (metrics.ebitda_margin && metrics.ebitda_margin < 0.05) {
      risks.push({
        label: 'Low Profitability',
        description: `EBITDA margin of ${(metrics.ebitda_margin * 100).toFixed(1)}% indicates low profitability`,
        severity: 'medium'
      });
    }
    
    return risks;
  }
  
  return [];
};
