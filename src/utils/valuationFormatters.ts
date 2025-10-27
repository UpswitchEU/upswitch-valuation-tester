/**
 * Valuation Formatters - Dual Format Display Utilities
 * 
 * Provides utilities for displaying valuation adjustments in both percentage and multiple formats
 * following McKinsey/Bain professional presentation standards.
 */

export interface MultipleImpactDisplay {
  percentageFormat: string;        // "-20.0%"
  multipleFormat: string;           // "-0.8x"
  baseMultiple: number;             // 4.0
  adjustedMultiple: number;         // 3.2
  multipleImpact: number;           // -0.8
  isApplicable: boolean;            // false if EBITDA <= 0
}

/**
 * Calculate owner dependency multiple impact from valuation adjustment
 * 
 * @param preAdjustmentValue - Valuation before owner dependency adjustment
 * @param postAdjustmentValue - Valuation after owner dependency adjustment
 * @param ebitda - EBITDA amount for multiple calculation
 * @returns MultipleImpactDisplay with both percentage and multiple formats
 */
export function calculateOwnerDependencyMultipleImpact(
  preAdjustmentValue: number,
  postAdjustmentValue: number,
  ebitda: number
): MultipleImpactDisplay {
  // Handle pre-revenue or negative EBITDA
  if (ebitda <= 0) {
    const percentageChange = ((postAdjustmentValue / preAdjustmentValue - 1) * 100);
    return {
      percentageFormat: `${percentageChange.toFixed(1)}%`,
      multipleFormat: 'N/A',
      baseMultiple: 0,
      adjustedMultiple: 0,
      multipleImpact: 0,
      isApplicable: false
    };
  }
  
  const baseMultiple = preAdjustmentValue / ebitda;
  const adjustedMultiple = postAdjustmentValue / ebitda;
  const multipleImpact = adjustedMultiple - baseMultiple;
  const percentageChange = ((postAdjustmentValue / preAdjustmentValue - 1) * 100);
  
  return {
    percentageFormat: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`,
    multipleFormat: `${multipleImpact >= 0 ? '+' : ''}${multipleImpact.toFixed(1)}x`,
    baseMultiple: parseFloat(baseMultiple.toFixed(1)),
    adjustedMultiple: parseFloat(adjustedMultiple.toFixed(1)),
    multipleImpact: parseFloat(multipleImpact.toFixed(1)),
    isApplicable: true
  };
}

/**
 * Format currency values for display
 * 
 * @param value - Numeric value to format
 * @param currency - Currency code (default: 'EUR')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-BE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage values for display
 * 
 * @param value - Numeric value (0.20 for 20%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format multiple values for display
 * 
 * @param value - Multiple value (4.0 for 4.0x)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted multiple string
 */
export function formatMultiple(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}x`;
}
