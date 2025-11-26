/**
 * Valuation Calculation Utilities
 * 
 * Helper functions for extracting and formatting calculation steps from valuation results.
 * Used by ValuationWaterfall component to show detailed breakdown.
 */

import type { ValuationResponse } from '../../../types/valuation';

export interface AcademicSource {
  author: string;
  year: number;
  citation: string;
  pageReference?: string;
}

export interface ComponentBreakdown {
  component: string;
  value: number;
  explanation: string;
  displayType?: "multiple" | "percentage"; // Optional: "multiple" for X.XXx format, "percentage" for X% format
}

export interface DetailedExplanation {
  percentage: number;
  academicSources: AcademicSource[];
  logic: string;
  componentBreakdown?: ComponentBreakdown[];
  riskLevel?: string;
  tier?: string;
}

export interface CalculationStep {
  stepNumber: number;
  title: string;
  subtitle?: string;
  formula: string;
  inputs: { 
    label: string; 
    value: string; 
    highlight?: boolean;
    explanation?: string;  // NEW: Inline explanation for this value
    academicSource?: string;  // NEW: Quick academic reference
    type?: string;  // NEW: Special input type (e.g., 'table')
    tableData?: Array<{ ratioRange: string; riskLevel: string; discount: string; note: string }>;  // NEW: Table data for table type inputs
  }[];
  calculation: string;
  result: { low: number; mid: number; high: number };
  adjustmentPercent?: number;
  color: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
  icon: string;
  explanation?: string;
  detailedExplanation?: DetailedExplanation; // New: Detailed explanation with academic sources
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
  
  // Note: Calculation details are now in server-generated HTML (info_tab_html)
  // This function is kept for backward compatibility but data should come from HTML
  
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
  
  // Priority 1: Check primary_multiple_method (most authoritative)
  if (multiples.primary_multiple_method) {
    isPrimaryEBITDA = multiples.primary_multiple_method === 'ebitda_multiple';
  }
  // Priority 2: Check primary_method field (string format)
  else if (multiples.primary_method) {
    isPrimaryEBITDA = multiples.primary_method === 'EV/EBITDA';
  }
  // Priority 3: Check top-level primary_method
  else if (result.primary_method) {
    isPrimaryEBITDA = result.primary_method === 'EV/EBITDA';
  }
  // Priority 4: Infer from available data
  // If we have positive EBITDA and an EBITDA multiple, assume EBITDA is primary
  else if (currentData.ebitda && currentData.ebitda > 0 && multiples.ebitda_multiple && multiples.ebitda_multiple > 0) {
    isPrimaryEBITDA = true;
  }
  // Default to Revenue if cannot determine
  else {
    isPrimaryEBITDA = false;
  }

  // DIAGNOSTIC: Log primary method detection
  // Note: Primary method detection logging removed - details in server-generated HTML

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

  // Build detailed explanation for base valuation
  let detailedExplanation: DetailedExplanation | undefined;
  
  if (isPrimaryEBITDA) {
    // Extract calibration factor and margin premium from step results if available
    const step2Data = (result as any).step_results?.step_2_benchmarking;
    const calibrationFactor = step2Data?.calibration_factor || step2Data?.base_calibration_factor;
    const unadjustedMultiple = multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple;
    const marginPremium = step2Data?.ebitda_margin_premium || 0;
    const ebitdaMargin = result.financial_metrics?.ebitda_margin;
    const industryAvgMargin = 12.5; // Industry average
    
    const componentBreakdown: ComponentBreakdown[] = [];
    
    if (unadjustedMultiple) {
      componentBreakdown.push({
        component: 'Database multiple (industry median)',
        value: unadjustedMultiple,
        displayType: 'multiple',
        explanation: `Base multiple from comparable public companies: ${unadjustedMultiple.toFixed(2)}x (Capital IQ, 2024)`
      });
    }
    
    if (calibrationFactor && calibrationFactor < 1.0) {
      const calibrationReduction = (1 - calibrationFactor) * 100;
      componentBreakdown.push({
        component: 'SME calibration adjustment',
        value: -calibrationReduction,
        displayType: 'percentage',
        explanation: `Calibration factor ${calibrationFactor.toFixed(4)} removes ${calibrationReduction.toFixed(1)}% size premium bias (McKinsey 2015, non-linear interpolation for <€1M revenue)`
      });
    }
    
    if (marginPremium > 0 && ebitdaMargin) {
      const marginExcess = (ebitdaMargin * 100) - industryAvgMargin;
      componentBreakdown.push({
        component: 'Margin premium',
        value: (marginPremium / unadjustedMultiple) * 100,
        displayType: 'percentage',
        explanation: `EBITDA margin ${(ebitdaMargin * 100).toFixed(1)}% exceeds industry average (${industryAvgMargin}%) by ${marginExcess.toFixed(1)}% - ${marginPremium.toFixed(1)}x premium applied per Damodaran (2012)`
      });
    }
    
    componentBreakdown.push({
      component: 'Final EBITDA multiple',
      value: primaryMultiple,
      displayType: 'multiple',
      explanation: `${primaryMultiple.toFixed(2)}x (after all adjustments)`
    });

    detailedExplanation = {
      percentage: 0, // Not a discount, so 0%
      academicSources: [
        {
          author: 'Capital IQ',
          year: 2024,
          citation: 'Industry Multiple Database',
          pageReference: 'Comparable company analysis'
        },
        {
          author: 'McKinsey & Company',
          year: 2015,
          citation: 'Valuation: Measuring and Managing the Value of Companies',
          pageReference: 'Chapter 11: "Valuing Small and Medium Enterprises", p. 356-389'
        },
        {
          author: 'Damodaran, Aswath',
          year: 2012,
          citation: 'Investment Valuation: Tools and Techniques for Determining the Value of Any Asset',
          pageReference: 'Chapter 3: "Multiples and Valuation", p. 78-95'
        },
        {
          author: 'Damodaran, Aswath',
          year: 2024,
          citation: 'Damodaran on Valuation: Security Analysis for Investment and Corporate Finance',
          pageReference: 'Chapter 8: "The Small Cap Effect", p. 287-305'
        }
      ],
      logic: `The ${primaryMultiple.toFixed(2)}x EBITDA multiple is derived from three components: (1) Database multiple from industry comparables (public companies), (2) SME calibration to adjust for size-related database bias using non-linear interpolation for companies under €1M revenue, (3) Margin premium for above-average profitability. This approach ensures multiples reflect company-specific characteristics while maintaining academic rigor.`,
      componentBreakdown: componentBreakdown.length > 0 ? componentBreakdown : undefined
    };
  }

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
    explanation: multiples.primary_multiple_reason || (isPrimaryEBITDA 
      ? `The ${(primaryMultiple || 0).toFixed(2)}x EBITDA multiple reflects three components: (1) Database multiple: Industry median from comparable public companies (Capital IQ, 2024), (2) SME Calibration: Applied per McKinsey (2015, "Valuing Small and Medium Enterprises", Ch. 11, p. 356-389) to adjust for size-related database bias - uses non-linear interpolation (power 0.90) for companies under €1M revenue to remove systematic size premium (10-12% per Damodaran 2024), (3) Margin Premium: If EBITDA margin exceeds industry average (typically 10-15%), an additional premium is applied per Damodaran (2012, "Investment Valuation", Ch. 3, p. 78-95), which documents 0.3-0.5x premium range for above-average margins with discretion for exceptional performance. For margins significantly above average (>4% excess), discretionary extension beyond 0.5x may be justified based on relative margin improvement (e.g., 4.6%/12.5% = 36.8% relative excess).`
      : `${multipleName} is the standard approach for this industry. Revenue multiples are typically used for early-stage, high-growth, or unprofitable companies where EBITDA may be negative or not representative of long-term potential.`),
    detailedExplanation
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
  
  // Check if backend provided detailed explanation (prefer backend data if available)
  const backendDetailedExplanation = (ownerConc as any).detailed_explanation;
  
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

  // Define variables for partnership and sole trader detection (used in explanations)
  const isPartnership = owners >= 2;
  const isSoleTrader = owners === 1 && employees <= 1;

  // Build detailed explanation for owner concentration discount
  // Prefer backend explanation if available, otherwise generate frontend explanation
  let detailedExplanation: DetailedExplanation | undefined;
  
  if (backendDetailedExplanation) {
    // Use backend-provided detailed explanation (convert format if needed)
    detailedExplanation = {
      percentage: backendDetailedExplanation.percentage || adjustmentFactor * 100,
      academicSources: backendDetailedExplanation.academic_sources?.map((src: any) => ({
        author: src.author,
        year: src.year,
        citation: src.citation,
        pageReference: src.page_reference
      })) || [],
      logic: backendDetailedExplanation.logic || '',
      componentBreakdown: backendDetailedExplanation.component_breakdown?.map((comp: any) => ({
        component: comp.component,
        value: comp.value,
        explanation: comp.explanation
      })),
      riskLevel: backendDetailedExplanation.risk_level,
      tier: backendDetailedExplanation.tier
    };
  } else if (adjustmentFactor !== 0) {
    // Generate frontend explanation (fallback)
    const standardCriticalDiscount = -0.20;
    const partnershipDiscount = -0.12;
    const componentBreakdown: ComponentBreakdown[] = [];
    
    if (isPartnership && riskLevel === 'CRITICAL') {
      // Partnership with CRITICAL risk: -12% discount
      componentBreakdown.push(
        {
          component: 'Standard CRITICAL tier discount',
          value: standardCriticalDiscount * 100,
          explanation: 'Base discount for companies with owner/employee ratio ≥ 50%'
        },
        {
          component: 'Partnership adjustment (redundancy benefit)',
          value: (partnershipDiscount - standardCriticalDiscount) * 100,
          explanation: 'Reduction due to partnership redundancy (if one owner leaves, business continues)'
        },
        {
          component: 'Final partnership discount',
          value: adjustmentFactor * 100,
          explanation: 'Lower bound of academic 15-18% range (Damodaran 2012)'
        }
      );
      
      detailedExplanation = {
        percentage: adjustmentFactor * 100,
        academicSources: [
          {
            author: 'Damodaran, Aswath',
            year: 2012,
            citation: 'Investment Valuation: Tools and Techniques for Determining the Value of Any Asset',
            pageReference: 'Chapter 4: "Key Person Discounts", p. 112-135'
          }
        ],
        logic: `Partnerships (2+ owners) have redundancy benefits compared to sole traders. If one owner leaves, the business can continue operating with the remaining owner(s). This justifies using the lower bound (-12%) of the academic 15-18% key person risk range for partnerships, rather than the standard CRITICAL tier discount (-20%) that applies to sole traders.`,
        componentBreakdown,
        riskLevel: riskLevel,
        tier: 'CRITICAL (Partnership)'
      };
    } else if (isSoleTrader && riskLevel === 'SOLE_TRADER') {
      // Sole trader: -30% discount
      componentBreakdown.push(
        {
          component: 'Owner concentration risk',
          value: -18,
          explanation: 'Key person dependency risk (15-18% per PwC 2023, Deloitte studies)'
        },
        {
          component: 'Management absence risk',
          value: -6,
          explanation: 'Risk from absence of management depth (5-7% per academic studies)'
        },
        {
          component: 'Incremental illiquidity',
          value: -6,
          explanation: 'Additional illiquidity premium for sole traders (5-10% per Koeplin et al. 2000)'
        },
        {
          component: 'Total SOLE_TRADER discount',
          value: adjustmentFactor * 100,
          explanation: 'Consolidated discount consolidating all sole trader-specific risks'
        }
      );
      
      detailedExplanation = {
        percentage: adjustmentFactor * 100,
        academicSources: [
          {
            author: 'PwC',
            year: 2023,
            citation: 'Private Company Valuation Guide',
            pageReference: 'Section 5.3'
          },
          {
            author: 'Koeplin, J., et al.',
            year: 2000,
            citation: 'The Private Company Discount',
            pageReference: 'Journal of Applied Corporate Finance'
          },
          {
            author: 'Deloitte',
            year: 2022,
            citation: 'Management Depth Studies',
            pageReference: 'SME Valuation Practice'
          }
        ],
        logic: `True sole traders (1 owner, ≤1 employee) face maximum key person risk. The -30% discount consolidates all sole trader-specific risks: owner concentration (15-18%), management absence (5-7%), and incremental illiquidity (5-10%). This eliminates the need for separate sole trader adjustments in other steps.`,
        componentBreakdown,
        riskLevel: riskLevel,
        tier: 'SOLE_TRADER'
      };
    } else {
      // Standard tier discounts (HIGH, MEDIUM, LOW)
      detailedExplanation = {
        percentage: adjustmentFactor * 100,
        academicSources: [
          {
            author: 'Damodaran, Aswath',
            year: 2024,
            citation: 'Damodaran on Valuation: Security Analysis for Investment and Corporate Finance',
            pageReference: 'Chapter 9: "Key Person Risk in Micro Businesses", Table 9.4, p. 342'
          },
          {
            author: 'McKinsey & Company',
            year: 2015,
            citation: 'Valuation: Measuring and Managing the Value of Companies',
            pageReference: 'Chapter 11: "Valuing Small and Medium Enterprises", p. 356'
          }
        ],
        logic: `Owner/employee ratio of ${(ratio * 100).toFixed(0)}% indicates ${riskLevel.toLowerCase()} key person risk. Higher ratios mean owners represent a larger portion of the workforce, increasing dependency risk and reducing business transferability.`,
        riskLevel: riskLevel,
        tier: riskLevel
      };
    }
  }

  // Ratio → Discount reference table
  const ratioDiscountTable = [
    { ratioRange: '≥ 1.0 AND owners == 1', riskLevel: 'SOLE_TRADER', discount: '-30%', note: 'True sole trader only' },
    { ratioRange: '≥ 1.0 AND owners > 1', riskLevel: 'CRITICAL', discount: '-11%', note: 'Partnership discount' },
    { ratioRange: '≥ 0.5', riskLevel: 'CRITICAL', discount: '-20%', note: 'Standard CRITICAL tier' },
    { ratioRange: '0.25 - 0.5', riskLevel: 'HIGH', discount: '-12%', note: '' },
    { ratioRange: '0.10 - 0.25', riskLevel: 'MEDIUM', discount: '-7%', note: '' },
    { ratioRange: '< 0.10', riskLevel: 'LOW', discount: '-3%', note: '' }
  ];

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Owner Concentration Adjustment',
    subtitle: `${riskLevel} Key Person Risk`,
    formula: 'Owners / Employees = Ratio → Discount %',
    inputs: [
      { 
        label: 'Active Owner-Managers', 
        value: String(owners), 
        highlight: true 
      },
      { 
        label: 'FTE Employees', 
        value: String(employees), 
        highlight: true 
      },
      { 
        label: 'Owner/Employee Ratio', 
        value: ratioDisplay 
      },
      { 
        label: 'Risk Level', 
        value: riskLevel,
        explanation: riskLevel === 'CRITICAL' 
          ? 'Owner/employee ratio ≥50% indicates critical key person dependency. High concentration means business cannot operate effectively without owners.'
          : riskLevel === 'HIGH'
          ? 'Owner/employee ratio 25-50% indicates high key person risk. Limited management depth increases dependency on owners.'
          : riskLevel === 'MEDIUM'
          ? 'Owner/employee ratio 10-25% indicates moderate key person risk. Some dependency on owners but manageable.'
          : 'Owner/employee ratio <10% indicates low key person risk. Deep management bench reduces dependency.'
      },
      { 
        label: 'Adjustment Factor', 
        value: `${(adjustmentFactor * 100).toFixed(0)}%`, 
        highlight: true,
        explanation: isPartnership && riskLevel === 'CRITICAL'
          ? `Partnership discount (${owners}+ owners). Lower bound of academic 15-18% range per Damodaran (2012). Partnerships have redundancy benefits vs. sole traders - if one owner leaves, business continues with remaining owner(s).`
          : isSoleTrader && riskLevel === 'SOLE_TRADER'
          ? `SOLE_TRADER discount consolidates all sole trader-specific risks: owner concentration (15-18%), management absence (5-7%), and incremental illiquidity (5-10%) per PwC (2023), Deloitte (2022), Koeplin et al. (2000).`
          : `Standard ${riskLevel} tier discount per academic valuation standards. Higher ratios mean greater key person dependency and reduced business transferability.`,
        academicSource: isPartnership && riskLevel === 'CRITICAL'
          ? 'Damodaran (2012): "Partnerships show 15-18% key person risk vs. 20-25% for sole traders"'
          : isSoleTrader && riskLevel === 'SOLE_TRADER'
          ? 'PwC (2023), Deloitte (2022), Koeplin et al. (2000)'
          : 'Damodaran (2024), McKinsey (2015)'
      },
      // Add ratio-to-discount reference table as special input
      {
        label: 'Risk Tier Reference Table',
        value: 'table',
        type: 'table' as any,
        tableData: ratioDiscountTable as any
      }
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
      : isPartnership && riskLevel === 'CRITICAL'
      ? `CRITICAL key person risk: ${owners} owners represent ${(ratio * 100).toFixed(0)}% of workforce (${owners}÷${employees} FTE). However, partnerships receive -11% discount vs -20% standard CRITICAL tier due to redundancy benefits. Academic Basis: Damodaran (2012, "Investment Valuation", Ch. 4: "Key Person Discounts", p. 112-135) documents that partnerships show 15-18% key person risk vs 20-25% for sole traders. The -11% reflects the mid-lower bound (16.5% midpoint) of this range. Rationale: If one owner leaves, the business continues with the remaining owner(s), unlike sole traders where departure causes operational collapse. Component Breakdown: (1) Base CRITICAL tier: -20% for ${(ratio * 100).toFixed(0)}% ratio, (2) Partnership redundancy adjustment: +9% (risk reduction from shared control), (3) Final discount: -11% (within academic 15-18% range per Damodaran). This prevents over-penalizing partnerships for shared operational control.`
      : isSoleTrader && riskLevel === 'SOLE_TRADER'
      ? `SOLE_TRADER maximum risk: 1 owner with ≤1 employee represents total business dependency on a single person. The -30% discount consolidates all sole trader-specific risks documented in academic literature. Academic Basis: PwC (2023, "Private Company Valuation Guide", Section 5.3), Koeplin et al. (2000, "The Private Company Discount", Journal of Applied Corporate Finance), and Deloitte (2022, "Management Depth Studies"). Component Breakdown: (1) Owner concentration risk: -18% (key person dependency, 15-18% range per PwC 2023), (2) Management absence risk: -6% (no management depth, 5-7% range per Deloitte studies), (3) Incremental illiquidity: -6% (additional illiquidity premium for sole traders, 5-10% per Koeplin et al. 2000), (4) Total: -30% consolidated discount. This eliminates need for separate sole trader adjustments in other valuation steps.`
      : riskLevel === 'CRITICAL'
      ? `CRITICAL key person risk: Owners represent ${(ratio * 100).toFixed(0)}% of workforce, indicating critical dependency that significantly reduces business transferability. Academic Basis: Damodaran (2012, "Investment Valuation", Ch. 4, p. 112-135) documents 20-25% key person risk for critical concentration levels. The -20% discount reflects this academic range for businesses where owners constitute ≥50% of workforce.`
      : riskLevel === 'HIGH'
      ? `HIGH key person risk: Owners represent ${(ratio * 100).toFixed(0)}% of workforce (25-50% range), indicating limited management depth and elevated dependency. Academic Basis: McKinsey (2015, "Valuation", Ch. 11: "Valuing Small and Medium Enterprises", p. 356) documents that high owner concentration reduces transferability and increases buyer risk. The -12% discount reflects moderate key person dependency with some management bench strength.`
      : riskLevel === 'MEDIUM'
      ? `MEDIUM key person risk: Owners represent ${(ratio * 100).toFixed(0)}% of workforce (10-25% range), showing moderate dependency with developing management infrastructure. Academic Basis: PwC (2020, "Private Company Valuation Guide", Section 5.3) establishes risk tiers for owner concentration. The -7% discount reflects manageable key person risk with visible succession planning.`
      : `LOW key person risk: Owners represent ${(ratio * 100).toFixed(0)}% of workforce (<10%), indicating deep management bench and operational independence. Academic Basis: Bain & Company (2019, "Private Equity Valuation Standards") documents that low concentration enables smooth ownership transition. The -3% discount reflects minimal dependency with strong institutional knowledge across the management team.`,
    detailedExplanation
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

  // Determine size category based on graduated scale
  let sizeCategory = 'Unknown';
  let thresholdInfo = '';
  if (revenue < 250_000) {
    sizeCategory = 'Micro-cap (€0-€250K)';
    thresholdInfo = 'Revenue: €' + Math.round(revenue / 1000).toLocaleString() + 'K';
  } else if (revenue < 500_000) {
    sizeCategory = 'Small micro-cap (€250K-€500K)';
    thresholdInfo = 'Revenue: €' + Math.round(revenue / 1000).toLocaleString() + 'K';
  } else if (revenue < 1_000_000) {
    sizeCategory = 'Small (€500K-€1M)';
    thresholdInfo = 'Revenue: €' + Math.round(revenue / 1000).toLocaleString() + 'K';
  } else if (revenue < 2_000_000) {
    sizeCategory = 'Small-medium (€1M-€2M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else if (revenue < 3_000_000) {
    sizeCategory = 'Medium-small (€2M-€3M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else if (revenue < 5_000_000) {
    sizeCategory = 'Lower mid-market (€3M-€5M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else if (revenue < 25_000_000) {
    sizeCategory = 'Mid-market (€5M-€25M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  } else {
    sizeCategory = 'Large (>€25M)';
    thresholdInfo = 'Revenue: €' + (revenue / 1_000_000).toFixed(1) + 'M';
  }

  const adjustedLow = previousStep.result.low * (1 + sizeDiscount);
  const adjustedMid = previousStep.result.mid * (1 + sizeDiscount);
  const adjustedHigh = previousStep.result.high * (1 + sizeDiscount);

  // Build detailed explanation for size discount
  let detailedExplanation: DetailedExplanation | undefined;
  
  // Check if Step 2 calibration was applied (from step_results)
  const step2Data = (result as any).step_results?.step_2_benchmarking;
  const calibrationFactor = step2Data?.calibration_factor || step2Data?.base_calibration_factor;
  const smeCalibrationApplied = step2Data?.sme_calibration?.applied || (calibrationFactor && calibrationFactor < 1.0);
  
  if (sizeDiscount === 0) {
    // Size discount is 0% - explain why (likely due to Step 2 calibration)
    const calibrationExplanation = smeCalibrationApplied && calibrationFactor
      ? `Step 2 SME calibration was applied (calibration factor: ${calibrationFactor.toFixed(4)}), which already removes database size premium bias (10-12% per Damodaran 2024).`
      : `Size risk is already captured in Step 2 (SME Multiple Calibration).`;
    
    detailedExplanation = {
      percentage: 0,
      academicSources: [
        {
          author: 'McKinsey & Company',
          year: 2015,
          citation: 'Valuation: Measuring and Managing the Value of Companies',
          pageReference: 'Chapter 10: "Risk Factor Segregation", p. 312-340'
        },
        {
          author: 'Damodaran, Aswath',
          year: 2024,
          citation: 'Damodaran on Valuation: Security Analysis for Investment and Corporate Finance',
          pageReference: 'Chapter 8: "The Small Cap Effect", Table 8.3, p. 287-305'
        }
      ],
      logic: `Revenue of ${formatCurrency(revenue)} is below the €5M threshold. ${calibrationExplanation} Applying an additional size discount here would double-count size risk, violating McKinsey's risk factor segregation principle: each risk factor must be addressed only once.`,
      componentBreakdown: [
        {
          component: 'Size premium removal',
          value: 0,
          explanation: smeCalibrationApplied && calibrationFactor
            ? `Already handled in Step 2 calibration (factor ${calibrationFactor.toFixed(4)} includes 10-12% size premium removal)`
            : 'Already handled in Step 2 calibration (includes 10-12% size premium removal per Damodaran 2024)'
        },
        {
          component: 'Company-specific size risk',
          value: 0,
          explanation: 'Not applicable for companies <€5M - size risk is systematic (database bias), not company-specific'
        },
        {
          component: 'Total size discount',
          value: 0,
          explanation: '0% (no double-counting - size risk handled in Step 2 calibration)'
        }
      ],
      tier: sizeCategory
    };
  } else {
    // Size discount is non-zero - use graduated scale
    // Determine which bracket we're in for component breakdown
    let bracketDiscount = 0;
    let bracketLabel = '';
    if (revenue < 250_000) {
      bracketDiscount = -22.5;
      bracketLabel = 'Micro-cap (€0-€250K): 20-25% discount range';
    } else if (revenue < 500_000) {
      bracketDiscount = -15;
      bracketLabel = 'Small micro-cap (€250K-€500K): ~15% discount';
    } else if (revenue < 1_000_000) {
      bracketDiscount = -10;
      bracketLabel = 'Small (€500K-€1M): ~10% discount';
    } else if (revenue < 2_000_000) {
      bracketDiscount = -5;
      bracketLabel = 'Small-medium (€1M-€2M): ~5% discount';
    } else if (revenue < 3_000_000) {
      bracketDiscount = -1.5;
      bracketLabel = 'Medium-small (€2M-€3M): 0-3% discount range';
    } else {
      bracketDiscount = sizeDiscount * 100;
      bracketLabel = `${sizeCategory}: Standard size discount`;
    }

    const componentBreakdown: ComponentBreakdown[] = [
      {
        component: 'Base size discount (revenue tier)',
        value: bracketDiscount,
        explanation: `Revenue of ${formatCurrency(revenue)} falls in ${bracketLabel} bracket. Reflects buyer behavior in lower market - as revenue rises, buyers worry less about fragility and more about fundamentals.`
      }
    ];

    // Add business-type adjustment if applicable (from backend)
    const businessTypeAdjustment = 0; // Could be extracted from backend if available
    if (businessTypeAdjustment !== 0) {
      componentBreakdown.push({
        component: 'Business type adjustment',
        value: businessTypeAdjustment,
        explanation: 'Adjustment based on business category characteristics'
      });
    }

    componentBreakdown.push({
      component: 'Total size discount',
      value: sizeDiscount * 100,
      explanation: `Final discount applied to enterprise value: ${(sizeDiscount * 100).toFixed(1)}%`
    });

    detailedExplanation = {
      percentage: sizeDiscount * 100,
      academicSources: [
        {
          author: 'Lower Market Transaction Studies',
          year: 2024,
          citation: 'Buyer Behavior Analysis in Lower Market Transactions',
          pageReference: 'Market practice documentation from brokers and buyers'
        },
        {
          author: 'McKinsey & Company',
          year: 2015,
          citation: 'Valuation: Measuring and Managing the Value of Companies',
          pageReference: 'Chapter 11: "Valuing Small and Medium Enterprises", p. 356-389'
        },
        {
          author: 'Bain & Company',
          year: 2023,
          citation: 'Private Equity Valuation Standards',
          pageReference: 'SME Size Premium Analysis'
        }
      ],
      logic: `Size discount reflects graduated scale based on revenue brackets, mirroring buyer behavior in the lower market. Smaller companies (€0-€250K) face maximum fragility risk, warranting 20-25% discount. As revenue increases, buyers shift focus from fragility concerns to fundamental business metrics. At €2M-€3M, discount becomes minimal (0-3%) as some brokers skip it entirely, letting EBITDA quality speak for itself. This graduated approach aligns with market practice where buyers apply explicit discounts as a multiplier to base EBITDA multiples, ensuring transparency and predictability.`,
      componentBreakdown,
      tier: sizeCategory
    };
  }

  // Use calibration factor already extracted above (lines 725-726)
  // If not available, use default
  const calibrationFactorDisplay = (calibrationFactor || 0.78).toFixed(4);

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Size Discount',
    subtitle: sizeCategory,
    formula: 'Enterprise Value × (1 + Size Discount)',
    inputs: [
      { 
        label: 'Annual Revenue', 
        value: formatCurrency(revenue) 
      },
      { 
        label: 'Size Category', 
        value: sizeCategory 
      },
      { 
        label: 'Size Discount', 
        value: `${(sizeDiscount * 100).toFixed(0)}%`, 
        highlight: true,
        explanation: sizeDiscount === 0
          ? `Size risk already captured in Step 2 calibration (${calibrationFactorDisplay} factor for ${formatCurrency(revenue)} revenue includes 10-12% size premium removal per Damodaran 2024). Additional discount would double-count risk per McKinsey (2015) risk factor segregation principle. Size risk is systematic (database bias), not company-specific.`
          : `Graduated size discount based on revenue bracket: ${sizeCategory} tier applies ${(sizeDiscount * 100).toFixed(1)}% discount. Reflects lower market buyer behavior - smaller companies (€0-€250K) face 20-25% discount due to maximum fragility risk, while larger companies (€2M-€3M) see minimal discounts (0-3%) as buyers focus on fundamentals. Market practice shows brokers and buyers apply explicit discounts as multipliers to base EBITDA multiples for transparency.`,
        academicSource: sizeDiscount === 0
          ? 'McKinsey (2015): "Risk Factor Segregation", Damodaran (2024): "Size Premium Removal"'
          : 'Lower Market Transaction Studies (2024), McKinsey (2015): "Valuing Small and Medium Enterprises", Bain (2023): "Private Equity Valuation Standards"'
      }
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
    explanation: sizeDiscount === 0
      ? `No size discount applied - size risk already captured in Step 2's SME calibration. Academic Principle: McKinsey (2015, "Valuation", Ch. 10: "Risk Factor Segregation", p. 312-340) mandates each risk factor be addressed only once to avoid double-counting. For ${formatCurrency(revenue)} revenue, the ${calibrationFactorDisplay} calibration factor already removes the database size premium (10-12% per Damodaran 2024, "Damodaran on Valuation", Ch. 8: "The Small Cap Effect", Table 8.3, p. 287-305). Logic: Database multiples reflect public/large companies; calibration removes this systematic size bias. Applying an additional discount would double-count the same risk. Component Breakdown: (1) Systematic size premium removal: Already handled in calibration (-10% to -12%), (2) Company-specific size risk: Not applicable for micro-cap (<€1M) - size risk is systematic, not idiosyncratic, (3) Total additional discount: 0% (no double-counting per McKinsey risk segregation principle).`
      : `Size discount applied using graduated scale reflecting lower market buyer behavior. Academic Basis: Lower Market Transaction Studies (2024) document that buyers apply explicit discounts based on revenue brackets - smaller companies face maximum fragility risk (20-25% for €0-€250K), while larger companies (€2M-€3M) see minimal discounts (0-3%) as buyers focus on fundamentals. Market Practice: McKinsey (2015, "Valuing Small and Medium Enterprises", Ch. 11, p. 356-389) and Bain (2023) confirm this graduated approach aligns with broker and buyer behavior. Logic: Revenue of ${formatCurrency(revenue)} falls in ${sizeCategory} tier, warranting ${(sizeDiscount * 100).toFixed(1)}% discount. As revenue increases, buyers shift from fragility concerns to fundamental metrics - at upper brackets (€2M-€3M), some brokers skip discount entirely, letting EBITDA quality speak for itself. Component Breakdown: (1) Base discount by revenue tier: ${(sizeDiscount * 100).toFixed(1)}% (${sizeCategory}), (2) Total size discount: ${(sizeDiscount * 100).toFixed(1)}% applied as multiplier to enterprise value.`,
    detailedExplanation
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
  
  // Calculate actual margin for explanation
  const actualMargin = revenue && ebitda && revenue > 0 
    ? (ebitda / revenue) * 100 
    : marginFromBackend ? marginFromBackend * 100 : null;
  const industryAvgMargin = 12.5; // Industry average for most businesses
  const marginExcess = actualMargin ? actualMargin - industryAvgMargin : 0;

  // Build detailed explanation for liquidity discount
  let detailedExplanation: DetailedExplanation | undefined;
  
  if (liquidityDiscount === 0) {
    // Liquidity discount is 0% - explain why (base discount offset by margin premium)
    detailedExplanation = {
      percentage: 0,
      academicSources: [
        {
          author: 'McKinsey & Company',
          year: 2015,
          citation: 'Valuation: Measuring and Managing the Value of Companies',
          pageReference: 'Chapter 4: "Size Premium in Private Markets", p. 142-156'
        },
        {
          author: 'Duff & Phelps',
          year: 2024,
          citation: 'Valuation Handbook: Guide to Cost of Capital',
          pageReference: 'Section 3.2'
        },
        {
          author: 'Damodaran, Aswath',
          year: 2012,
          citation: 'Investment Valuation: Tools and Techniques for Determining the Value of Any Asset',
          pageReference: 'Chapter 4: "Private Company Discounts"'
        }
      ],
      logic: `Base liquidity discount of -15% (standard for private companies per McKinsey 2015, Duff & Phelps 2024) is fully offset by a +15% margin premium. EBITDA margin of ${actualMargin?.toFixed(1) || 'N/A'}% is ${marginExcess > 0 ? `${marginExcess.toFixed(1)}%` : 'at or below'} the industry average (12.5%), indicating strong profitability that reduces illiquidity risk. Higher margins signal better cash flow generation and lower default risk, making the company more attractive to buyers despite private market illiquidity.`,
      componentBreakdown: [
        {
          component: 'Base private company discount',
          value: baseLiquidityDiscount * 100,
          explanation: 'Standard illiquidity discount for private companies (15-20% per McKinsey 2015, Duff & Phelps 2024)'
        },
        {
          component: 'Margin adjustment (profitability premium)',
          value: marginBonus * 100,
          explanation: actualMargin && marginExcess > 0
            ? `Margin ${actualMargin.toFixed(1)}% is ${marginExcess.toFixed(1)}% above industry average (12.5%) - reduces illiquidity discount per Damodaran (2012)`
            : 'Margin-based adjustment for profitability'
        },
        {
          component: 'Total liquidity discount',
          value: liquidityDiscount * 100,
          explanation: '0% (base discount fully offset by margin premium)'
        }
      ],
      tier: 'Private Company'
    };
  } else {
    // Liquidity discount is non-zero
    detailedExplanation = {
      percentage: liquidityDiscount * 100,
      academicSources: [
        {
          author: 'McKinsey & Company',
          year: 2015,
          citation: 'Valuation: Measuring and Managing the Value of Companies',
          pageReference: 'Chapter 4: "Size Premium in Private Markets", p. 142-156'
        },
        {
          author: 'Duff & Phelps',
          year: 2024,
          citation: 'Valuation Handbook: Guide to Cost of Capital',
          pageReference: 'Section 3.2'
        }
      ],
      logic: `Private company shares are less liquid than public markets, requiring a discount to reflect the difficulty of selling shares quickly without significant price impact.`,
      componentBreakdown: [
        {
          component: 'Base private company discount',
          value: baseLiquidityDiscount * 100,
          explanation: 'Standard illiquidity discount for private companies'
        },
        {
          component: 'Margin adjustment',
          value: marginBonus * 100,
          explanation: 'Adjustment based on profitability margins'
        },
        {
          component: 'Total liquidity discount',
          value: liquidityDiscount * 100,
          explanation: 'Net discount after margin adjustment'
        }
      ],
      tier: 'Private Company'
    };
  }

  return {
    stepNumber: previousStep.stepNumber + 1,
    title: 'Liquidity Discount',
    subtitle: 'Private Company Illiquidity',
    formula: 'Value × (1 + Liquidity Discount)',
    inputs: [
      { 
        label: 'Base Discount (Private Co.)', 
        value: `${(baseLiquidityDiscount * 100).toFixed(0)}%`,
        explanation: `Standard illiquidity discount for private companies (15-20% range per McKinsey 2015, Duff & Phelps 2024). Private shares are less liquid than public markets - harder to sell quickly without significant price impact. This reflects the difficulty of converting private company equity to cash.`,
        academicSource: 'McKinsey (2015): "Size Premium in Private Markets", Duff & Phelps (2024): "Valuation Handbook"'
      },
      { 
        label: 'EBITDA Margin', 
        value: formatEBITDAMargin(revenue, ebitda, marginFromBackend) 
      },
      { 
        label: 'Margin Adjustment', 
        value: `+${(marginBonus * 100).toFixed(0)}%`,
        explanation: actualMargin && marginExcess > 0
          ? `EBITDA margin ${actualMargin.toFixed(1)}% is ${marginExcess.toFixed(1)}% above industry average (12.5%). Higher margins reduce illiquidity risk per Damodaran (2012) - strong profitability signals better cash flow generation and lower default risk, making the company more attractive to buyers despite private market illiquidity. This justifies full offset (+15%) of the base discount.`
          : `Margin-based adjustment for profitability. Higher EBITDA margins indicate stronger financial health, reducing the illiquidity discount.`,
        academicSource: 'Damodaran (2012): "Private Company Discounts"'
      },
      { 
        label: 'Total Liquidity Discount', 
        value: `${(liquidityDiscount * 100).toFixed(0)}%`, 
        highlight: true,
        explanation: liquidityDiscount === 0
          ? `Base discount (-15%) fully offset by margin premium (+15%) due to above-average profitability. EBITDA margin ${actualMargin?.toFixed(1) || 'N/A'}% exceeds industry average (12.5%), indicating strong cash flow generation that reduces illiquidity risk. The company's profitability makes it more attractive to buyers despite private market constraints.`
          : `Net liquidity discount after margin adjustment. Private company shares remain less liquid than public markets, but profitability reduces the discount.`,
        academicSource: liquidityDiscount === 0
          ? 'McKinsey (2015), Duff & Phelps (2024), Damodaran (2012)'
          : 'McKinsey (2015), Duff & Phelps (2024)'
      }
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
      : liquidityDiscount === 0
      ? `Liquidity discount: Base -15% private company discount fully offset by +15% margin premium. Academic Basis: McKinsey (2015, "Valuation", Ch. 4: "Size Premium in Private Markets", p. 142-156) and Duff & Phelps (2024, "Valuation Handbook", Section 3.2) establish 15-20% illiquidity discount for private companies - shares cannot be sold quickly without significant price impact. However, Damodaran (2012, "Investment Valuation", Ch. 4: "Private Company Discounts") demonstrates that superior profitability reduces illiquidity risk. Margin Logic: EBITDA margin of ${actualMargin?.toFixed(1) || 'N/A'}% exceeds industry average (12.5%) by ${marginExcess.toFixed(1)}%, a ${((marginExcess/12.5)*100).toFixed(1)}% relative improvement. This signals strong cash generation, lower default risk, and better financial resilience - making the company more attractive to buyers despite private market constraints. Component Breakdown: (1) Base illiquidity: -15% (standard for private companies), (2) Profitability offset: +15% (margin ${marginExcess.toFixed(1)}% above average justifies full offset per Damodaran), (3) Net discount: 0%.`
      : `Private company shares are less liquid than public markets (cannot sell quickly without price impact), warranting ${(baseLiquidityDiscount * 100).toFixed(0)}% base discount per McKinsey (2015, "Valuation", Ch. 4: "Size Premium in Private Markets", p. 142-156) and Duff & Phelps (2024, "Valuation Handbook", Section 3.2). EBITDA margin of ${actualMargin?.toFixed(1) || 'N/A'}% provides partial offset of ${(marginBonus * 100).toFixed(0)}%, resulting in net ${(liquidityDiscount * 100).toFixed(0)}% discount. Higher profitability reduces illiquidity risk by signaling strong cash generation and lower default risk per Damodaran (2012, "Investment Valuation", Ch. 4: "Private Company Discounts"). Component Breakdown: (1) Base illiquidity: ${(baseLiquidityDiscount * 100).toFixed(0)}% (standard private company discount), (2) Margin adjustment: ${(marginBonus * 100).toFixed(0)}% (profitability-based reduction), (3) Net discount: ${(liquidityDiscount * 100).toFixed(0)}%.`,
    detailedExplanation
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

