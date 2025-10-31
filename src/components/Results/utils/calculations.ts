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
  // Check if we have financial metrics (preferred - comes from backend calculation)
  const resultAny = result as any;
  const hasFinancialMetrics = resultAny.financial_metrics && Object.keys(resultAny.financial_metrics).length > 0;
  
  // Primary: use revenue_cagr_3y from financial_metrics (backend calculated)
  if (hasFinancialMetrics && resultAny.financial_metrics) {
    const metrics = resultAny.financial_metrics;
    
    // Backend returns revenue_cagr_3y as decimal (e.g., 0.291 for 29.1% or 11.11 for 1111.1%)
    // Keep as decimal for internal use, will be converted to percentage for display
    if (metrics.revenue_cagr_3y !== undefined && metrics.revenue_cagr_3y !== null) {
      // Backend always returns as decimal, no conversion needed
      const cagrDecimal = metrics.revenue_cagr_3y;
      
      // Determine years from historical data if available, otherwise use 2 (most common)
      const hasHistoricalData = resultAny.historical_years_data && resultAny.historical_years_data.length > 0;
      const years = hasHistoricalData ? resultAny.historical_years_data.length : 2;
      
      return { 
        cagr: cagrDecimal, 
        hasHistoricalData: true, 
        years 
      };
    }
    
    // Fallback to other metrics if revenue_cagr_3y not available  
    if (metrics.cagr !== undefined && metrics.cagr !== null) {
      // Backend returns as decimal
      return { cagr: metrics.cagr, hasHistoricalData: true, years: 3 };
    }
    
    if (metrics.revenue_growth !== undefined && metrics.revenue_growth !== null) {
      // Backend returns as decimal
      return { cagr: metrics.revenue_growth, hasHistoricalData: true, years: 2 };
    }
  }
  
  // Secondary: calculate CAGR from historical data if available (fallback)
  const hasHistoricalData = resultAny.historical_years_data && resultAny.historical_years_data.length > 0;
  if (hasHistoricalData && resultAny.historical_years_data && resultAny.current_year_data) {
    const years = resultAny.historical_years_data.length;
    const firstYear = resultAny.historical_years_data[0];
    const currentYear = resultAny.current_year_data;
    
    if (firstYear && currentYear && firstYear.revenue > 0 && currentYear.revenue > 0) {
      // Calculate CAGR: (current_year / first_year)^(1/periods) - 1
      const periods = years; // Number of periods between first historical and current
      const cagr = Math.pow(currentYear.revenue / firstYear.revenue, 1 / periods) - 1;
      return { cagr, hasHistoricalData: true, years: periods };
    }
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
