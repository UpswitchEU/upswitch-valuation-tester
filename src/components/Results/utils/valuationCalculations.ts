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
  dataRequired?: boolean; // Flag to indicate missing critical data
  dataRequiredMessage?: string; // Message to show when data is missing
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
 * Safely calculate EBITDA margin with validation
 * Returns null if revenue is invalid, caps at 100%
 */
export const calculateEBITDAMargin = (revenue: number | null | undefined, ebitda: number | null | undefined): number | null => {
  if (!revenue || revenue <= 0) {
    return null; // Cannot calculate margin with zero/negative revenue
  }
  if (ebitda === null || ebitda === undefined) {
    return null; // EBITDA not provided
  }
  
  const margin = ebitda / revenue;
  
  // Cap at 100% (mathematically impossible to exceed)
  if (margin > 1.0) {
    return 1.0; // Return as decimal (1.0 = 100%)
  }
  
  return margin;
};

/**
 * Normalize EBITDA margin format (handles both decimal 0-1 and percentage 0-100)
 * Returns decimal format (0-1) for consistency
 */
export const normalizeMarginFormat = (margin: number | null | undefined): number | null => {
  if (margin === null || margin === undefined) {
    return null;
  }
  
  // If value > 1.0, assume it's in percentage format (0-100) and convert to decimal
  if (margin > 1.0) {
    return Math.min(1.0, margin / 100); // Convert percentage to decimal, cap at 1.0
  }
  
  // Already in decimal format (0-1)
  return Math.min(1.0, Math.max(0.0, margin)); // Ensure it's within valid range
};

/**
 * Format EBITDA margin for display with validation
 * Handles both decimal (0-1) and percentage (0-100) formats from backend
 */
export const formatEBITDAMargin = (revenue: number | null | undefined, ebitda: number | null | undefined, marginFromBackend?: number | null | undefined): string => {
  // If margin is provided from backend, use it (with format normalization)
  // Otherwise calculate from revenue/EBITDA
  let margin: number | null;
  
  if (marginFromBackend !== null && marginFromBackend !== undefined) {
    margin = normalizeMarginFormat(marginFromBackend);
  } else {
    margin = calculateEBITDAMargin(revenue, ebitda);
  }
  
  if (margin === null) {
    return 'N/A';
  }
  
  // Check if margin was capped (indicates data quality issue)
  const wasCapped = revenue && ebitda && (ebitda / revenue) > 1.0;
  
  return wasCapped 
    ? '100.0% (capped - data review required)'
    : formatPercent(margin);
};

/**
 * Calculate base enterprise value step
 */
export const calculateBaseEnterpriseValue = (result: ValuationResponse): CalculationStep => {
  const multiples = result.multiples_valuation;
  const currentData = result.current_year_data;
  
  // DIAGNOSTIC: Log current_year_data availability
  console.log('[DIAGNOSTIC-VALUATION] calculateBaseEnterpriseValue:', {
    hasMultiples: !!multiples,
    hasCurrentData: !!currentData,
    currentData: currentData,
    revenue: currentData?.revenue,
    ebitda: currentData?.ebitda,
    resultKeys: Object.keys(result || {}),
  });
  
  // Check if currentData exists and has valid revenue or EBITDA
  const hasValidData = currentData && (
    (typeof currentData.revenue === 'number' && currentData.revenue > 0) ||
    (typeof currentData.ebitda === 'number' && currentData.ebitda !== undefined)
  );
  
  if (!multiples || !currentData || !hasValidData) {
    return {
      stepNumber: 1,
      title: 'Base Valuation',
      subtitle: 'Data unavailable',
      formula: 'N/A',
      inputs: [],
      calculation: 'Insufficient data',
      result: { low: 0, mid: 0, high: 0 },
      color: 'gray',
      icon: '📊',
      dataRequired: true,
      dataRequiredMessage: 'Revenue and EBITDA data are required to calculate enterprise value. Please enter financial data to generate valuation.'
    };
  }

  // CRITICAL FIX: Enhanced primary method detection with multiple fallbacks
  // Priority: primary_multiple_method → primary_method → infer from available data
  let isPrimaryEBITDA = false;
  let primaryMethodSource = 'unknown';
  
  // Priority 1: Check primary_multiple_method (most authoritative)
  if (multiples.primary_multiple_method) {
    isPrimaryEBITDA = multiples.primary_multiple_method === 'ebitda_multiple';
    primaryMethodSource = `primary_multiple_method=${multiples.primary_multiple_method}`;
  }
  // Priority 2: Check primary_method field (string format)
  else if (multiples.primary_method) {
    isPrimaryEBITDA = multiples.primary_method === 'EV/EBITDA';
    primaryMethodSource = `primary_method=${multiples.primary_method}`;
  }
  // Priority 3: Check top-level primary_method
  else if (result.primary_method) {
    isPrimaryEBITDA = result.primary_method === 'EV/EBITDA';
    primaryMethodSource = `result.primary_method=${result.primary_method}`;
  }
  // Priority 4: Infer from available data
  // If we have positive EBITDA and an EBITDA multiple, assume EBITDA is primary
  else if (currentData.ebitda && currentData.ebitda > 0 && multiples.ebitda_multiple && multiples.ebitda_multiple > 0) {
    isPrimaryEBITDA = true;
    primaryMethodSource = 'inferred_from_ebitda_available';
  }
  // Default to Revenue if cannot determine
  else {
    isPrimaryEBITDA = false;
    primaryMethodSource = 'default_to_revenue';
  }

  // DIAGNOSTIC: Log primary method detection
  console.log('[DIAGNOSTIC-VALUATION] calculateBaseEnterpriseValue - Primary method detection', {
    primary_multiple_method: multiples.primary_multiple_method,
    primary_method: multiples.primary_method || result.primary_method,
    isPrimaryEBITDA,
    primaryMethodSource,
    hasEBITDA: !!(currentData.ebitda && currentData.ebitda > 0),
    hasRevenue: !!(currentData.revenue && currentData.revenue > 0),
    ebitdaMultiple: multiples.ebitda_multiple,
    revenueMultiple: multiples.revenue_multiple
  });

  const primaryMultiple = isPrimaryEBITDA ? multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple : multiples.unadjusted_revenue_multiple || multiples.revenue_multiple;
  const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
  const metricName = isPrimaryEBITDA ? 'EBITDA' : 'Revenue';
  const multipleName = isPrimaryEBITDA ? 'EBITDA Multiple' : 'Revenue Multiple';

  // Validate that we have the required metric (revenue or EBITDA)
  if (!primaryMetric || primaryMetric <= 0) {
    return {
      stepNumber: 1,
      title: 'Base Enterprise Valuation',
      subtitle: `Primary Method: ${isPrimaryEBITDA ? 'EBITDA Multiple' : 'Revenue Multiple'}`,
      formula: `${metricName} × ${multipleName} = Enterprise Value`,
      inputs: [
        { label: metricName, value: 'Required', highlight: true },
        { label: `${multipleName} (Industry Median)`, value: `${(primaryMultiple || 0).toFixed(2)}x`, highlight: true }
      ],
      calculation: `Cannot calculate: ${metricName} is required`,
      result: { low: 0, mid: 0, high: 0 },
      color: 'gray',
      icon: '📊',
      dataRequired: true,
      dataRequiredMessage: `${metricName} is required for valuation calculation. Please enter ${metricName.toLowerCase()} data to generate enterprise value.`
    };
  }

  // Calculate base enterprise value before any adjustments
  const baseEV = primaryMetric * (primaryMultiple || 0);
  
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
      { label: metricName, value: formatCurrency(primaryMetric), highlight: true },
      { label: `${multipleName} (Industry Median)`, value: `${(primaryMultiple || 0).toFixed(2)}x`, highlight: true },
      { label: 'P25 Multiple (Low)', value: `${lowMultiple.toFixed(2)}x` },
      { label: 'P75 Multiple (High)', value: `${highMultiple.toFixed(2)}x` }
    ],
    calculation: `${formatCurrency(primaryMetric)} × ${(primaryMultiple || 0).toFixed(2)}x = ${formatCurrency(baseEV)}`,
    result: {
      low: primaryMetric * lowMultiple,
      mid: baseEV,
      high: primaryMetric * highMultiple
    },
    color: 'blue',
    icon: '📊',
    explanation: multiples.primary_multiple_reason || `${multipleName} is the standard approach for ${isPrimaryEBITDA ? 'profitable companies' : 'this industry'}`
  };
};

/**
 * Calculate owner concentration adjustment step
 */
export const calculateOwnerConcentrationImpact = (result: ValuationResponse, previousStep: CalculationStep): CalculationStep => {
  const multiples = result.multiples_valuation;
  const ownerConc = multiples?.owner_concentration;
  
  // Always show this step, even if no adjustment was applied
  // Check both adjustment_factor and adjustment_percentage for backward compatibility
  const hasNoAdjustment = !ownerConc || 
    (ownerConc.adjustment_factor === 0 || ownerConc.adjustment_factor === null || ownerConc.adjustment_factor === undefined) &&
    (ownerConc.adjustment_percentage === 0 || ownerConc.adjustment_percentage === null || ownerConc.adjustment_percentage === undefined);
  
  if (hasNoAdjustment) {
    // Try to get owner/employee data from the request if available
    const owners = ownerConc?.number_of_owners;
    const employees = ownerConc?.number_of_employees;
    const hasData = owners !== undefined && employees !== undefined;
    
    // Return a step indicating no adjustment was applied
    return {
      stepNumber: previousStep.stepNumber + 1,
      title: 'Owner Concentration Adjustment',
      subtitle: 'No adjustment applied',
      formula: hasData ? 'Owners / Employees = Ratio' : 'Owner/Employee Ratio Analysis',
      inputs: hasData ? [
        { label: 'Active Owner-Managers', value: String(owners) },
        { label: 'FTE Employees', value: String(employees) },
        { label: 'Owner/Employee Ratio', value: employees > 0 ? `${((owners / employees) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Status', value: 'Low risk - sufficient non-owner employees', highlight: false }
      ] : [
        { label: 'Status', value: 'No owner concentration data provided', highlight: false }
      ],
      calculation: hasData 
        ? `${owners} owners / ${employees} employees = ${employees > 0 ? ((owners / employees) * 100).toFixed(1) : 'N/A'}% ratio → No adjustment (low risk)`
        : 'No owner concentration risk detected - insufficient data or low risk profile',
      result: previousStep.result, // No change to values
      adjustmentPercent: 0,
      color: 'gray',
      icon: '👥',
      explanation: 'Owner concentration adjustment is only applied when owners represent a significant portion of the workforce (typically >50%), indicating key person dependency risk. Lower ratios indicate better operational independence.'
    };
  }

  const owners = ownerConc.number_of_owners;
  const employees = ownerConc.number_of_employees;
  const ratio = ownerConc.ratio;
  
  // CRITICAL FIX: Handle both adjustment_percentage (percentage) and adjustment_factor (decimal)
  // Backend may send either format, normalize to decimal for calculations
  let adjustmentFactor: number;
  if (ownerConc.adjustment_percentage !== undefined && ownerConc.adjustment_percentage !== null) {
    // If adjustment_percentage exists, convert from percentage to decimal
    adjustmentFactor = ownerConc.adjustment_percentage / 100;
  } else if (ownerConc.adjustment_factor !== undefined && ownerConc.adjustment_factor !== null) {
    // If adjustment_factor exists, check if it's already a decimal or percentage
    // If absolute value > 1, assume it's a percentage and convert
    adjustmentFactor = Math.abs(ownerConc.adjustment_factor) > 1 
      ? ownerConc.adjustment_factor / 100 
      : ownerConc.adjustment_factor;
  } else {
    adjustmentFactor = 0;
  }
  
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
    stepNumber: previousStep.stepNumber + 1,
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
  // Try to get revenue from current_year_data, fallback to multiples valuation if available
  const revenue = result.current_year_data?.revenue ?? 
                  (result.multiples_valuation?.enterprise_value && result.multiples_valuation?.revenue_multiple 
                    ? result.multiples_valuation.enterprise_value / (result.multiples_valuation.revenue_multiple || 1)
                    : 0);

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
  
  // Safely get EBITDA margin - prefer from backend financial_metrics, fallback to calculation
  const revenue = result.current_year_data?.revenue;
  const ebitda = result.current_year_data?.ebitda;
  const marginFromBackend = result.financial_metrics?.ebitda_margin;
  
  // Base liquidity discount is typically -15% for private companies
  // Can be adjusted based on profitability (higher margins = better liquidity = smaller discount)
  const baseLiquidityDiscount = -0.15;
  const marginBonus = liquidityDiscount - baseLiquidityDiscount; // Calculate the margin-based adjustment

  const adjustedLow = previousStep.result.low * (1 + liquidityDiscount);
  const adjustedMid = previousStep.result.mid * (1 + liquidityDiscount);
  const adjustedHigh = previousStep.result.high * (1 + liquidityDiscount);

  // Check if margin was unrealistic (capped at 100%)
  const marginWasCapped = revenue && ebitda && revenue > 0 && (ebitda / revenue) > 1.0;

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Liquidity Discount',
    subtitle: 'Private Company Illiquidity',
    formula: 'Value × (1 + Liquidity Discount)',
    inputs: [
      { label: 'Base Discount (Private Co.)', value: `${(baseLiquidityDiscount * 100).toFixed(0)}%` },
      { label: 'EBITDA Margin', value: formatEBITDAMargin(revenue, ebitda, marginFromBackend) },
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
    explanation: marginWasCapped 
      ? 'Private company shares are less liquid than public markets. Note: EBITDA margin exceeded 100% and was capped - data review recommended.'
      : 'Private company shares are less liquid than public markets. Higher profitability margins reduce this discount.'
  };
};

/**
 * Calculate Enterprise Value to Equity Value conversion step
 */
export const calculateEVToEquityConversion = (result: ValuationResponse, previousStep: CalculationStep): CalculationStep => {
  // Get debt and cash from current_year_data or use defaults
  const totalDebt = result.current_year_data?.total_debt || 0;
  const cash = result.current_year_data?.cash || 0;
  const netDebt = totalDebt - cash;
  
  // Calculate equity values (EV - Net Debt = Equity Value)
  const equityLow = previousStep.result.low - netDebt;
  const equityMid = previousStep.result.mid - netDebt;
  const equityHigh = previousStep.result.high - netDebt;
  
  // Check if DCF is included to provide context-aware explanation
  const dcfWeight = result.dcf_weight || 0;
  const isDCFIncluded = dcfWeight > 0 && result.dcf_valuation;
  
  // Determine title and subtitle based on net debt
  const hasNetDebt = Math.abs(netDebt) > 0.01; // Use small threshold to handle floating point precision
  const title = hasNetDebt ? 'Enterprise Value to Equity Value' : 'Final Equity Value';
  const subtitle = hasNetDebt 
    ? (isDCFIncluded ? 'Multiples Equity Value (Before Combination)' : 'Converting to shareholder value')
    : (isDCFIncluded ? 'Multiples Equity Value (no debt adjustment)' : 'No debt adjustment needed');
  
  const explanation = isDCFIncluded
    ? 'This is the Multiples-only equity value after all adjustments. In the next step, this value will be combined with the DCF equity value using weighted averages to create the final base valuation.'
    : (hasNetDebt 
        ? 'Enterprise Value represents the total value of the company. Equity Value is what shareholders own after accounting for debt obligations and cash holdings. This is the final base equity value before applying the range methodology.'
        : 'Since the company has no net debt (debt and cash are balanced), the Enterprise Value equals the Equity Value. This is the final base equity value before applying the range methodology.');
  
  return {
    stepNumber: previousStep.stepNumber + 1,
    title,
    subtitle,
    formula: 'Equity Value = Enterprise Value - Net Debt',
    inputs: [
      { label: 'Enterprise Value (After Adjustments)', value: formatCurrency(previousStep.result.mid), highlight: true },
      { label: 'Total Debt', value: formatCurrency(totalDebt) },
      { label: 'Cash & Equivalents', value: formatCurrency(cash) },
      { label: 'Net Debt', value: formatCurrency(netDebt), highlight: netDebt > 0 }
    ],
    calculation: `€${Math.round(previousStep.result.mid).toLocaleString()} - €${Math.round(netDebt).toLocaleString()} = €${Math.round(equityMid).toLocaleString()}`,
    result: {
      low: equityLow,
      mid: equityMid,
      high: equityHigh
    },
    adjustmentPercent: 0,
    color: 'blue',
    icon: '💼',
    explanation
  };
};

/**
 * Calculate historical trend analysis step
 * Only shown when 2+ years of historical data available
 */
export const calculateHistoricalTrendAnalysis = (result: ValuationResponse): CalculationStep | null => {
  const historicalData = result.historical_years_data || [];
  const currentData = result.current_year_data;
  
  // Need at least 2 years of data (1 historical + current) to show trends
  if (historicalData.length < 1 || !currentData) {
    return null;
  }
  
  // Sort historical data by year (oldest first)
  const sortedHistorical = [...historicalData].sort((a, b) => a.year - b.year);
  const allYears = [...sortedHistorical, currentData];
  
  // Calculate YoY growth rates
  const revenueGrowthRates: number[] = [];
  const ebitdaGrowthRates: number[] = [];
  
  for (let i = 1; i < allYears.length; i++) {
    const prevYear = allYears[i - 1];
    const currYear = allYears[i];
    
    if (prevYear.revenue > 0) {
      const revenueGrowth = ((currYear.revenue - prevYear.revenue) / prevYear.revenue) * 100;
      revenueGrowthRates.push(revenueGrowth);
    }
    
    if (prevYear.ebitda > 0 && currYear.ebitda > 0) {
      const ebitdaGrowth = ((currYear.ebitda - prevYear.ebitda) / Math.abs(prevYear.ebitda)) * 100;
      ebitdaGrowthRates.push(ebitdaGrowth);
    } else if (prevYear.ebitda < 0 && currYear.ebitda > 0) {
      // Negative to positive is significant improvement
      ebitdaGrowthRates.push(100); // Flag as 100%+ improvement
    }
  }
  
  // Calculate CAGR if we have first and last year
  const firstYear = sortedHistorical[0];
  const lastYear = currentData;
  const yearsDiff = lastYear.year - firstYear.year;
  
  let revenueCAGR = 0;
  
  if (yearsDiff > 0 && firstYear.revenue > 0) {
    revenueCAGR = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / yearsDiff) - 1) * 100;
  }
  
  // Determine trend direction
  const avgRevenueGrowth = revenueGrowthRates.length > 0 
    ? revenueGrowthRates.reduce((a, b) => a + b, 0) / revenueGrowthRates.length 
    : 0;
  
  const isDeclining = avgRevenueGrowth < -5; // More than 5% decline
  const isGrowing = avgRevenueGrowth > 5; // More than 5% growth
  
  const trendDirection = isDeclining ? 'Declining' : isGrowing ? 'Growing' : 'Stable';
  const trendColor: 'blue' | 'green' | 'orange' | 'purple' | 'teal' = isDeclining ? 'orange' : isGrowing ? 'green' : 'blue';
  
  // Build inputs array
  const inputs: { label: string; value: string; highlight?: boolean }[] = [];
  
  // Add year-by-year revenue
  for (let i = 0; i < allYears.length; i++) {
    const year = allYears[i];
    inputs.push({
      label: `${year.year} Revenue`,
      value: formatCurrency(year.revenue),
      highlight: i === allYears.length - 1 // Highlight current year
    });
  }
  
  // Add growth rates
  if (revenueGrowthRates.length > 0) {
    inputs.push({
      label: 'Average YoY Revenue Growth',
      value: `${avgRevenueGrowth.toFixed(1)}%`,
      highlight: isDeclining
    });
  }
  
  if (revenueCAGR !== 0) {
    inputs.push({
      label: `Revenue CAGR (${yearsDiff} years)`,
      value: `${revenueCAGR.toFixed(1)}%`,
      highlight: true
    });
  }
  
  // Build calculation string
  let calculation = '';
  if (revenueGrowthRates.length > 0) {
    calculation = `Average growth: ${avgRevenueGrowth.toFixed(1)}%`;
    if (revenueCAGR !== 0) {
      calculation += ` | CAGR: ${revenueCAGR.toFixed(1)}%`;
    }
  } else {
    calculation = 'Insufficient data for trend analysis';
  }
  
  // Build explanation
  let explanation = '';
  if (isDeclining) {
    explanation = `⚠️ Revenue is declining (average ${avgRevenueGrowth.toFixed(1)}% per year). This may indicate business challenges and could impact valuation multiples.`;
  } else if (isGrowing) {
    explanation = `✅ Revenue is growing (average ${avgRevenueGrowth.toFixed(1)}% per year). Positive growth trend supports higher valuation multiples.`;
  } else {
    explanation = `Revenue trend is relatively stable. Consistent performance may indicate mature business model.`;
  }
  
  return {
    stepNumber: 0, // Step 0 (before base valuation)
    title: 'Historical Trend Analysis',
    subtitle: `${trendDirection} Revenue Trend`,
    formula: 'YoY Growth = (Current Year - Previous Year) / Previous Year × 100%',
    inputs,
    calculation,
    result: { low: 0, mid: 0, high: 0 }, // No valuation impact, informational only
    color: trendColor as 'blue' | 'red' | 'green' | 'yellow' | 'gray',
    icon: '📈',
    explanation
  };
};

/**
 * Calculate DCF valuation waterfall step
 * Only shown when DCF is included (dcf_weight > 0 and not excluded)
 */
export const calculateDCFValuationStep = (result: ValuationResponse): CalculationStep | null => {
  const dcfValuation = result.dcf_valuation;
  const dcfWeight = result.dcf_weight || 0;
  const hasDCFExclusionReason = !!result.dcf_exclusion_reason;
  
  // Only show if DCF is included (not excluded)
  if (!dcfValuation || dcfWeight === 0 || hasDCFExclusionReason) {
    return null;
  }
  
  const equityValue = dcfValuation.equity_value || 0;
  const enterpriseValue = dcfValuation.enterprise_value || 0;
  const wacc = dcfValuation.wacc || 0;
  const pvTerminalValue = dcfValuation.pv_terminal_value || 0;
  
  // Calculate present value of cash flows from projections
  const pvFcfProjections = dcfValuation.pv_fcf_projections_5y || [];
  const presentValue = pvFcfProjections.reduce((sum: number, pv: number) => sum + (pv || 0), 0);
  
  // Build inputs
  const inputs: { label: string; value: string; highlight?: boolean }[] = [];
  
  // Calculate total FCF from projections if available
  const fcfProjections = dcfValuation.fcf_projections_5y || [];
  if (fcfProjections.length > 0) {
    const totalFCF = fcfProjections.reduce((sum: number, fcf: number) => sum + (fcf || 0), 0);
    inputs.push({
      label: 'Total Projected Free Cash Flows',
      value: formatCurrency(totalFCF),
      highlight: true
    });
  }
  
  inputs.push(
    { label: 'WACC (Discount Rate)', value: `${(wacc * 100).toFixed(1)}%`, highlight: true },
    { label: 'PV of Projected Cash Flows', value: formatCurrency(presentValue) },
    { label: 'PV of Terminal Value', value: formatCurrency(pvTerminalValue) },
    { label: 'Enterprise Value', value: formatCurrency(enterpriseValue), highlight: true }
  );
  
  // Net debt adjustment
  const netDebt = (result.current_year_data?.total_debt || 0) - (result.current_year_data?.cash || 0);
  if (netDebt !== 0) {
    inputs.push({ label: 'Net Debt', value: formatCurrency(netDebt) });
  }
  
  inputs.push({ label: 'DCF Equity Value', value: formatCurrency(equityValue), highlight: true });
  
  // Build calculation
  const calculation = netDebt !== 0
    ? `Enterprise Value (€${Math.round(enterpriseValue).toLocaleString()}) - Net Debt (€${Math.round(netDebt).toLocaleString()}) = Equity Value (€${Math.round(equityValue).toLocaleString()})`
    : `Enterprise Value = Equity Value (€${Math.round(equityValue).toLocaleString()})`;
  
  return {
    stepNumber: 1, // Will be adjusted in generateCalculationSteps
    title: 'DCF Valuation',
    subtitle: 'Discounted Cash Flow Method',
    formula: 'Equity Value = Present Value of Cash Flows + Terminal Value - Net Debt',
    inputs,
    calculation,
    result: {
      low: equityValue * 0.9, // Approximate range
      mid: equityValue,
      high: equityValue * 1.1
    },
    color: 'blue',
    icon: '💰',
    explanation: 'DCF valuation projects future free cash flows and discounts them to present value using WACC. Terminal value represents the business value beyond the projection period.'
  };
};

/**
 * Calculate weighted average combination step
 * Only shown when both DCF and Multiples are included (DCF not excluded)
 */
export const calculateWeightedAverageStep = (
  result: ValuationResponse,
  dcfStep: CalculationStep,
  multiplesStep: CalculationStep
): CalculationStep | null => {
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  const hasDCFExclusionReason = !!result.dcf_exclusion_reason;
  
  // Only show if both methodologies are included (DCF not excluded)
  if (dcfWeight === 0 || multiplesWeight === 0 || hasDCFExclusionReason) {
    return null;
  }
  
  const dcfValue = dcfStep.result.mid;
  const multiplesValue = multiplesStep.result.mid;
  // Use equity_value_mid from result as it's the authoritative weighted average from backend
  // Fallback to calculated value if backend doesn't provide it
  const weightedAverage = result.equity_value_mid || 
    ((dcfValue * dcfWeight) + (multiplesValue * multiplesWeight));
  
  const inputs: { label: string; value: string; highlight?: boolean }[] = [
    {
      label: 'DCF Equity Value',
      value: formatCurrency(dcfValue)
    },
    {
      label: 'DCF Weight',
      value: `${(dcfWeight * 100).toFixed(0)}%`,
      highlight: true
    },
    {
      label: 'Multiples Equity Value',
      value: formatCurrency(multiplesValue)
    },
    {
      label: 'Multiples Weight',
      value: `${(multiplesWeight * 100).toFixed(0)}%`,
      highlight: true
    },
    {
      label: 'Weighted Average',
      value: formatCurrency(weightedAverage),
      highlight: true
    }
  ];
  
  const calculation = `(€${Math.round(dcfValue).toLocaleString()} × ${(dcfWeight * 100).toFixed(0)}%) + (€${Math.round(multiplesValue).toLocaleString()} × ${(multiplesWeight * 100).toFixed(0)}%) = €${Math.round(weightedAverage).toLocaleString()}`;
  
  return {
    stepNumber: dcfStep.stepNumber + 1, // After both methodologies
    title: 'Methodology Combination',
    subtitle: 'Final Base Value: Weighted Average of DCF and Multiples',
    formula: 'Final Base Value = (DCF Value × DCF Weight) + (Multiples Value × Multiples Weight)',
    inputs,
    calculation,
    result: {
      low: (dcfStep.result.low * dcfWeight) + (multiplesStep.result.low * multiplesWeight),
      mid: weightedAverage,
      high: (dcfStep.result.high * dcfWeight) + (multiplesStep.result.high * multiplesWeight)
    },
    color: 'green',
    icon: '⚖️',
    explanation: 'This is the FINAL base equity value after combining both methodologies. The weighted average balances intrinsic value (DCF) with market comparables (Multiples). The range methodology (confidence spread or multiple dispersion) is then applied to this combined value to generate the final Low/Mid/High estimates shown below.'
  };
};

/**
 * Generate all calculation steps for the waterfall
 */
export const generateCalculationSteps = (result: ValuationResponse): CalculationStep[] => {
  const steps: CalculationStep[] = [];
  
  // Step 0: Historical Trend Analysis (if data available)
  const trendStep = calculateHistoricalTrendAnalysis(result);
  if (trendStep) {
    steps.push(trendStep);
  }
  
  // Check if DCF is included
  // DCF is excluded if: dcf_weight is 0, dcf_exclusion_reason exists, or no dcf_valuation
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  const hasDCFExclusionReason = !!result.dcf_exclusion_reason;
  const isDCFIncluded = dcfWeight > 0 && result.dcf_valuation && !hasDCFExclusionReason;
  const isMultiplesOnly = multiplesWeight === 1.0 || !isDCFIncluded;
  
  let stepNumber = 1;
  
  // If DCF included, show DCF waterfall first
  if (isDCFIncluded) {
    const dcfStep = calculateDCFValuationStep(result);
    if (dcfStep) {
      dcfStep.stepNumber = stepNumber++;
      steps.push(dcfStep);
    }
  }
  
  // Multiples waterfall (always shown)
  // Step 1 (or 2 if DCF included): Base Enterprise Value
  const baseStep = calculateBaseEnterpriseValue(result);
  baseStep.stepNumber = stepNumber++;
  steps.push(baseStep);
  
  let previousStep = baseStep;
  
  // Step 2 (or 3 if DCF included): Owner Concentration (ALWAYS show, even if no adjustment)
  const ownerStep = calculateOwnerConcentrationImpact(result, previousStep);
  ownerStep.stepNumber = stepNumber++;
  steps.push(ownerStep);
  previousStep = ownerStep;
  
  // Step 3 (or 4 if DCF included): Size Discount
  const sizeStep = calculateSizeDiscountImpact(result, previousStep);
  sizeStep.stepNumber = stepNumber++;
  steps.push(sizeStep);
  previousStep = sizeStep;
  
  // Step 4 (or 5 if DCF included): Liquidity Discount
  const liquidityStep = calculateLiquidityDiscountImpact(result, previousStep);
  liquidityStep.stepNumber = stepNumber++;
  steps.push(liquidityStep);
  previousStep = liquidityStep;
  
  // Step 5 (or 6 if DCF included): Enterprise Value to Equity Value Conversion
  const equityStep = calculateEVToEquityConversion(result, previousStep);
  equityStep.stepNumber = stepNumber++;
  steps.push(equityStep);
  
  // If both DCF and Multiples included, show weighted average combination
  if (isDCFIncluded && !isMultiplesOnly) {
    const dcfStep = steps.find(s => s.title === 'DCF Valuation');
    const multiplesFinalStep = equityStep; // Final step from Multiples waterfall
    if (dcfStep && multiplesFinalStep) {
      const weightedStep = calculateWeightedAverageStep(result, dcfStep, multiplesFinalStep);
      if (weightedStep) {
        weightedStep.stepNumber = stepNumber++;
        steps.push(weightedStep);
      }
    }
  }
  
  return steps;
};

/**
 * Get final valuation result step
 * CRITICAL: Validates that waterfall calculation matches backend adjusted_equity_value
 */
export const getFinalValuationStep = (result: ValuationResponse): { low: number; mid: number; high: number } => {
  // For multiples-only, validate that equity_value_mid matches adjusted_equity_value
  const dcfWeight = result.dcf_weight || 0;
  const isMultiplesOnly = dcfWeight === 0 || !!result.dcf_exclusion_reason;
  
  if (isMultiplesOnly) {
    const backendAdjustedEquity = result.multiples_valuation?.adjusted_equity_value;
    const rangeMid = result.equity_value_mid;
    
    if (backendAdjustedEquity && backendAdjustedEquity > 0 && rangeMid > 0) {
      const tolerance = Math.max(backendAdjustedEquity * 0.01, 100); // 1% or €100
      const difference = Math.abs(rangeMid - backendAdjustedEquity);
      
      if (difference > tolerance) {
        console.warn(
          '[VALUATION-AUDIT] Waterfall range mid-point mismatch with backend adjusted_equity_value',
          {
            rangeMid,
            backendAdjustedEquity,
            difference,
            tolerance,
            percentageDiff: (difference / backendAdjustedEquity * 100).toFixed(2) + '%'
          }
        );
      }
    }
  }
  
  return {
    low: result.equity_value_low,
    mid: result.equity_value_mid,
    high: result.equity_value_high
  };
};

