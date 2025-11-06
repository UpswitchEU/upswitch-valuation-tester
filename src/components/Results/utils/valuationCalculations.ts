/**
 * Valuation Calculation Utilities
 * 
 * Helper functions for extracting and formatting calculation steps from valuation results.
 * Used by ValuationWaterfall component to show detailed breakdown.
 */

import type { ValuationResponse } from '../../../types/valuation';

export interface CalculationStep {
  stepNumber: number;
  title: string;
  subtitle?: string;
  formula: string;
  inputs: { label: string; value: string; highlight?: boolean }[];
  calculation: string;
  result: { low: number; mid: number; high: number };
  adjustmentPercent?: number;
  color: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
  icon: string;
  explanation?: string;
}

/**
 * Format currency for display
 */
export const formatCurrency = (value: number): string => {
  return `€${Math.round(value).toLocaleString()}`;
};

/**
 * Format percentage for display
 */
export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Calculate base enterprise value step
 */
export const calculateBaseEnterpriseValue = (result: ValuationResponse): CalculationStep => {
  const multiples = result.multiples_valuation;
  const currentData = result.current_year_data;
  
  if (!multiples || !currentData) {
    return {
      stepNumber: 1,
      title: 'Base Valuation',
      subtitle: 'Data unavailable',
      formula: 'N/A',
      inputs: [],
      calculation: 'Insufficient data',
      result: { low: 0, mid: 0, high: 0 },
      color: 'gray',
      icon: '📊'
    };
  }

  const isPrimaryEBITDA = multiples.primary_multiple_method === 'ebitda_multiple';
  const primaryMultiple = isPrimaryEBITDA ? multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple : multiples.unadjusted_revenue_multiple || multiples.revenue_multiple;
  const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
  const metricName = isPrimaryEBITDA ? 'EBITDA' : 'Revenue';
  const multipleName = isPrimaryEBITDA ? 'EBITDA Multiple' : 'Revenue Multiple';

  // Calculate base enterprise value before any adjustments
  const baseEV = (primaryMetric || 0) * (primaryMultiple || 0);
  
  // For range: use percentile multiples if available, otherwise estimate ±20%
  const lowMultiple = isPrimaryEBITDA 
    ? (multiples.p25_ebitda_multiple || primaryMultiple * 0.8)
    : (multiples.p25_revenue_multiple || primaryMultiple * 0.8);
  const highMultiple = isPrimaryEBITDA 
    ? (multiples.p75_ebitda_multiple || primaryMultiple * 1.2)
    : (multiples.p75_revenue_multiple || primaryMultiple * 1.2);

  return {
    stepNumber: 1,
    title: 'Base Enterprise Valuation',
    subtitle: `Primary Method: ${isPrimaryEBITDA ? 'EBITDA Multiple' : 'Revenue Multiple'}`,
    formula: `${metricName} × ${multipleName} = Enterprise Value`,
    inputs: [
      { label: metricName, value: formatCurrency(primaryMetric || 0), highlight: true },
      { label: `${multipleName} (Industry Median)`, value: `${(primaryMultiple || 0).toFixed(2)}x`, highlight: true },
      { label: 'P25 Multiple (Low)', value: `${lowMultiple.toFixed(2)}x` },
      { label: 'P75 Multiple (High)', value: `${highMultiple.toFixed(2)}x` }
    ],
    calculation: `${formatCurrency(primaryMetric || 0)} × ${(primaryMultiple || 0).toFixed(2)}x = ${formatCurrency(baseEV)}`,
    result: {
      low: (primaryMetric || 0) * lowMultiple,
      mid: baseEV,
      high: (primaryMetric || 0) * highMultiple
    },
    color: 'blue',
    icon: '📊',
    explanation: multiples.primary_multiple_reason || `${multipleName} is the standard approach for ${isPrimaryEBITDA ? 'profitable companies' : 'this industry'}`
  };
};

/**
 * Calculate owner concentration adjustment step
 */
export const calculateOwnerConcentrationImpact = (result: ValuationResponse, previousStep: CalculationStep): CalculationStep | null => {
  const multiples = result.multiples_valuation;
  const ownerConc = multiples?.owner_concentration;
  
  if (!ownerConc || ownerConc.adjustment_factor === 0) {
    return null; // Skip this step if no owner concentration adjustment
  }

  const owners = ownerConc.number_of_owners;
  const employees = ownerConc.number_of_employees;
  const ratio = ownerConc.ratio;
  const adjustmentFactor = ownerConc.adjustment_factor;
  const riskLevel = ownerConc.risk_level || 'UNKNOWN';

  // Calculate adjusted values
  const adjustedLow = previousStep.result.low * (1 + adjustmentFactor);
  const adjustedMid = previousStep.result.mid * (1 + adjustmentFactor);
  const adjustedHigh = previousStep.result.high * (1 + adjustmentFactor);

  const isFullyOwnerOperated = employees === 0;
  const ratioDisplay = isFullyOwnerOperated 
    ? '100% (fully owner-operated)' 
    : `${(ratio * 100).toFixed(0)}%`;

  return {
    stepNumber: 2,
    title: 'Owner Concentration Adjustment',
    subtitle: `${riskLevel} Key Person Risk`,
    formula: 'Owners / Employees = Ratio → Discount %',
    inputs: [
      { label: 'Active Owner-Managers', value: String(owners), highlight: true },
      { label: 'FTE Employees', value: String(employees), highlight: true },
      { label: 'Owner/Employee Ratio', value: ratioDisplay },
      { label: 'Risk Level', value: riskLevel },
      { label: 'Adjustment Factor', value: `${(adjustmentFactor * 100).toFixed(0)}%`, highlight: true }
    ],
    calculation: isFullyOwnerOperated
      ? `${owners} owners / 0 employees = 100% ratio → ${(adjustmentFactor * 100).toFixed(0)}% (CRITICAL)`
      : `${owners} owners / ${employees} employees = ${(ratio * 100).toFixed(0)}% ratio → ${(adjustmentFactor * 100).toFixed(0)}%`,
    result: {
      low: adjustedLow,
      mid: adjustedMid,
      high: adjustedHigh
    },
    adjustmentPercent: adjustmentFactor,
    color: 'red',
    icon: '👥',
    explanation: isFullyOwnerOperated
      ? 'Business is 100% owner-operated with no non-owner employees. This represents maximum key person risk.'
      : `High owner concentration (${(ratio * 100).toFixed(0)}% of workforce) indicates significant key person dependency.`
  };
};

/**
 * Calculate size discount step
 */
export const calculateSizeDiscountImpact = (result: ValuationResponse, previousStep: CalculationStep): CalculationStep => {
  const multiples = result.multiples_valuation;
  const sizeDiscount = multiples?.size_discount || 0;
  const revenue = result.current_year_data?.revenue || 0;

  // Determine size category
  let sizeCategory = 'Unknown';
  let thresholdInfo = '';
  if (revenue < 1_000_000) {
    sizeCategory = 'Micro (<€1M)';
    thresholdInfo = 'Revenue: €' + Math.round(revenue / 1000).toLocaleString() + 'K < €1M';
  } else if (revenue < 5_000_000) {
    sizeCategory = 'Small (€1M-€5M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else if (revenue < 25_000_000) {
    sizeCategory = 'Medium (€5M-€25M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else {
    sizeCategory = 'Large (>€25M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  }

  const adjustedLow = previousStep.result.low * (1 + sizeDiscount);
  const adjustedMid = previousStep.result.mid * (1 + sizeDiscount);
  const adjustedHigh = previousStep.result.high * (1 + sizeDiscount);

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Size Discount',
    subtitle: sizeCategory,
    formula: 'Enterprise Value × (1 + Size Discount)',
    inputs: [
      { label: 'Annual Revenue', value: formatCurrency(revenue) },
      { label: 'Size Category', value: sizeCategory },
      { label: 'Size Discount', value: `${(sizeDiscount * 100).toFixed(0)}%`, highlight: true }
    ],
    calculation: thresholdInfo + ` → ${(sizeDiscount * 100).toFixed(0)}% discount`,
    result: {
      low: adjustedLow,
      mid: adjustedMid,
      high: adjustedHigh
    },
    adjustmentPercent: sizeDiscount,
    color: sizeDiscount < 0 ? 'red' : 'gray',
    icon: '📏',
    explanation: sizeDiscount < 0 
      ? 'Smaller companies trade at lower multiples due to higher risk, lower liquidity, and less diversification.'
      : 'No size discount applied for this revenue range.'
  };
};

/**
 * Calculate liquidity discount step
 */
export const calculateLiquidityDiscountImpact = (result: ValuationResponse, previousStep: CalculationStep): CalculationStep => {
  const multiples = result.multiples_valuation;
  const liquidityDiscount = multiples?.liquidity_discount || 0;
  const ebitdaMargin = result.financial_metrics?.ebitda_margin || 0;
  
  // Base liquidity discount is typically -15% for private companies
  // Can be adjusted based on profitability (higher margins = better liquidity = smaller discount)
  const baseLiquidityDiscount = -0.15;
  const marginBonus = liquidityDiscount - baseLiquidityDiscount; // Calculate the margin-based adjustment

  const adjustedLow = previousStep.result.low * (1 + liquidityDiscount);
  const adjustedMid = previousStep.result.mid * (1 + liquidityDiscount);
  const adjustedHigh = previousStep.result.high * (1 + liquidityDiscount);

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Liquidity Discount',
    subtitle: 'Private Company Illiquidity',
    formula: 'Value × (1 + Liquidity Discount)',
    inputs: [
      { label: 'Base Discount (Private Co.)', value: `${(baseLiquidityDiscount * 100).toFixed(0)}%` },
      { label: 'EBITDA Margin', value: formatPercent(ebitdaMargin) },
      { label: 'Margin Adjustment', value: `+${(marginBonus * 100).toFixed(0)}%` },
      { label: 'Total Liquidity Discount', value: `${(liquidityDiscount * 100).toFixed(0)}%`, highlight: true }
    ],
    calculation: `${(baseLiquidityDiscount * 100).toFixed(0)}% + ${(marginBonus * 100).toFixed(0)}% (margin bonus) = ${(liquidityDiscount * 100).toFixed(0)}%`,
    result: {
      low: adjustedLow,
      mid: adjustedMid,
      high: adjustedHigh
    },
    adjustmentPercent: liquidityDiscount,
    color: 'red',
    icon: '💧',
    explanation: 'Private company shares are less liquid than public markets. Higher profitability margins reduce this discount.'
  };
};

/**
 * Generate all calculation steps for the waterfall
 */
export const generateCalculationSteps = (result: ValuationResponse): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  
  // Step 1: Base Enterprise Value
  const baseStep = calculateBaseEnterpriseValue(result);
  steps.push(baseStep);
  
  let previousStep = baseStep;
  
  // Step 2: Owner Concentration (if applicable)
  const ownerStep = calculateOwnerConcentrationImpact(result, previousStep);
  if (ownerStep) {
    steps.push(ownerStep);
    previousStep = ownerStep;
  }
  
  // Step 3: Size Discount
  const sizeStep = calculateSizeDiscountImpact(result, previousStep);
  steps.push(sizeStep);
  previousStep = sizeStep;
  
  // Step 4: Liquidity Discount
  const liquidityStep = calculateLiquidityDiscountImpact(result, previousStep);
  steps.push(liquidityStep);
  
  return steps;
};

/**
 * Get final valuation result step
 */
export const getFinalValuationStep = (result: ValuationResponse): { low: number; mid: number; high: number } => {
  return {
    low: result.equity_value_low,
    mid: result.equity_value_mid,
    high: result.equity_value_high
  };
};

