/**
 * Valuation Configuration
 * 
 * Centralized configuration for valuation calculations and display
 * thresholds. Based on industry standards and Big 4 methodologies.
 */

/**
 * Variance Thresholds
 * 
 * Used to determine when DCF and Multiples valuations are in agreement.
 * Based on PwC Valuation Handbook 2024, Section 3.4
 */
export const VARIANCE_THRESHOLDS = {
  /**
   * Excellent agreement (<20% variance)
   * Indicates strong alignment between methodologies
   */
  EXCELLENT: 20,

  /**
   * Good agreement (<50% variance)
   * Normal range for SME valuations per Big 4 standards
   */
  GOOD: 50,

  /**
   * Review needed (>75% variance)
   * Suggests conflicting assumptions or data quality issues
   */
  REVIEW_NEEDED: 75,

  /**
   * Primary threshold for warnings
   * Variance above this triggers review recommendations
   */
  WARNING_THRESHOLD: 50,
} as const;

/**
 * WACC (Weighted Average Cost of Capital) Thresholds
 * 
 * Based on Damodaran (2024) and typical SME ranges
 */
export const WACC_THRESHOLDS = {
  /**
   * Minimum reasonable WACC for SMEs (5%)
   * Below this suggests unrealistic risk assumptions
   */
  MIN: 5.0,

  /**
   * Maximum reasonable WACC for SMEs (30%)
   * Above this suggests extreme risk or calculation errors
   */
  MAX: 30.0,

  /**
   * Typical range for stable SMEs (8-16%)
   */
  TYPICAL_MIN: 8.0,
  TYPICAL_MAX: 16.0,
} as const;

/**
 * CAGR (Compound Annual Growth Rate) Thresholds
 * 
 * Based on OECD SME statistics and industry analysis
 */
export const CAGR_THRESHOLDS = {
  /**
   * Maximum reasonable CAGR (±200%)
   * Above this likely indicates data entry errors
   */
  MAX_ABSOLUTE: 200,

  /**
   * High growth threshold (>50%)
   * Requires additional scrutiny and explanation
   */
  HIGH_GROWTH: 50,

  /**
   * Typical SME growth range (5-25%)
   */
  TYPICAL_MIN: 5,
  TYPICAL_MAX: 25,
} as const;

/**
 * Growth Consistency Thresholds
 * 
 * Difference between single-year growth and multi-year CAGR
 */
export const GROWTH_CONSISTENCY_THRESHOLDS = {
  /**
   * Maximum acceptable difference (50 percentage points)
   * Beyond this suggests volatile or inconsistent performance
   */
  MAX_DIFFERENCE: 50,

  /**
   * Review threshold (30 percentage points)
   * May warrant explanation but not necessarily problematic
   */
  REVIEW_THRESHOLD: 30,
} as const;

/**
 * Display Configuration
 */
export const DISPLAY_CONFIG = {
  /**
   * Decimal places for percentage display
   */
  PERCENTAGE_DECIMALS: 1,

  /**
   * Decimal places for currency display
   */
  CURRENCY_DECIMALS: 0,

  /**
   * Decimal places for multiples display
   */
  MULTIPLES_DECIMALS: 1,

  /**
   * Number of years for CAGR calculation
   */
  CAGR_YEARS: 3,
} as const;

/**
 * Academic Sources
 * 
 * Citations for threshold values and methodologies
 */
export const ACADEMIC_SOURCES = {
  VARIANCE: 'PwC Valuation Handbook 2024, Section 3.4 - "Cross-Methodology Validation"',
  WACC: 'Damodaran (2024), "Cost of Capital by Sector" - SME Adjustments',
  CAGR: 'OECD (2023), "SME and Entrepreneurship Outlook" - Growth Statistics',
  GROWTH_CONSISTENCY: 'McKinsey Valuation (2020), "Performance Stability Analysis"',
} as const;

/**
 * Helper function to check if variance is within acceptable range
 */
export function isVarianceAcceptable(variance: number | null): boolean {
  if (variance === null) return false;
  return variance < VARIANCE_THRESHOLDS.WARNING_THRESHOLD;
}

/**
 * Helper function to get variance status message
 */
export function getVarianceMessage(variance: number | null): string {
  if (variance === null) {
    return 'Unable to calculate variance';
  }

  if (variance < VARIANCE_THRESHOLDS.EXCELLENT) {
    return '✓ Strong methodological agreement';
  }

  if (variance < VARIANCE_THRESHOLDS.GOOD) {
    return '✓ Acceptable agreement';
  }

  if (variance < VARIANCE_THRESHOLDS.REVIEW_NEEDED) {
    return '⚠ Review recommended';
  }

  return '⚠ Significant divergence - review assumptions';
}

