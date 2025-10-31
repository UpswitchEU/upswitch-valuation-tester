/**
 * Calculation Helper Utilities
 * 
 * Safe mathematical operations with error handling for edge cases
 * like division by zero, NaN, Infinity, etc.
 */

/**
 * Calculate variance between two values safely
 * 
 * Formula: |value1 - value2| / average * 100
 * 
 * Edge cases handled:
 * - Both values are 0 → returns 0
 * - Values are undefined/null/NaN → returns null
 * - Negative values → returns null (data quality issue in valuation context)
 * - Average is zero (e.g., 100 and -100) → returns null
 * - Result is Infinity → returns null
 * 
 * @param value1 First value (must be non-negative in valuation context)
 * @param value2 Second value (must be non-negative in valuation context)
 * @param options Optional settings { allowNegative: false }
 * @returns Variance percentage (0-100+) or null if cannot calculate
 */
export function calculateVariance(
  value1: number | null | undefined,
  value2: number | null | undefined,
  options: { allowNegative?: boolean } = {}
): number | null {
  const { allowNegative = false } = options;

  // Validate inputs - explicit null/undefined/NaN checks
  if (
    value1 === undefined || value1 === null || isNaN(value1) ||
    value2 === undefined || value2 === null || isNaN(value2)
  ) {
    return null;
  }

  // CRITICAL FIX: Reject negative values in valuation context (data quality issue)
  if (!allowNegative && (value1 < 0 || value2 < 0)) {
    console.warn(
      `[calculateVariance] Negative valuation detected: value1=${value1}, value2=${value2}. ` +
      `This indicates a data quality issue. Returning null.`
    );
    return null;
  }

  // Both zero → no variance
  if (value1 === 0 && value2 === 0) {
    return 0;
  }

  // Calculate average (base for variance calculation)
  const average = (value1 + value2) / 2;

  // Average is zero (e.g., value1=100, value2=-100 with allowNegative=true)
  // This indicates offsetting values - variance calculation is undefined
  if (average === 0) {
    console.warn(
      `[calculateVariance] Average is zero: value1=${value1}, value2=${value2}. ` +
      `Cannot calculate meaningful variance. Returning null.`
    );
    return null;
  }

  // Calculate variance as percentage
  const variance = Math.abs((value1 - value2) / average) * 100;

  // Check for Infinity or NaN in result (defensive)
  if (!isFinite(variance)) {
    console.warn(
      `[calculateVariance] Non-finite variance: ${variance}. ` +
      `value1=${value1}, value2=${value2}. Returning null.`
    );
    return null;
  }

  return variance;
}

/**
 * Format variance for display
 * 
 * @param variance Variance percentage or null
 * @param showStatus Whether to show status indicator (✓ or ⚠)
 * @param threshold Threshold for "good" variance (default 50%)
 * @returns Formatted string
 */
export function formatVariance(
  variance: number | null,
  showStatus: boolean = false,
  threshold: number = 50
): string {
  if (variance === null) {
    return 'N/A';
  }

  const formatted = `${variance.toFixed(1)}%`;

  if (!showStatus) {
    return formatted;
  }

  const status = variance < threshold ? '✓' : '⚠';
  return `${formatted} ${status}`;
}

/**
 * Get variance status
 * 
 * @param variance Variance percentage or null
 * @param thresholds Object with low, medium, high thresholds
 * @returns Status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
 */
export function getVarianceStatus(
  variance: number | null,
  thresholds = { low: 20, medium: 50, high: 75 }
): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (variance === null) {
    return 'unknown';
  }

  if (variance < thresholds.low) return 'excellent';
  if (variance < thresholds.medium) return 'good';
  if (variance < thresholds.high) return 'fair';
  return 'poor';
}

/**
 * Safe division with fallback
 * 
 * Handles division edge cases: division by zero, NaN, Infinity
 * 
 * @param numerator Numerator (accepts number, null, undefined)
 * @param denominator Denominator (accepts number, null, undefined)
 * @param fallback Fallback value if division is invalid (default 0)
 * @returns Result or fallback
 */
export function safeDivide(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  fallback: number = 0
): number {
  // Explicit validation for all invalid cases
  if (
    numerator === null || numerator === undefined || isNaN(numerator) || !isFinite(numerator) ||
    denominator === null || denominator === undefined || isNaN(denominator) || !isFinite(denominator) ||
    denominator === 0
  ) {
    return fallback;
  }

  const result = numerator / denominator;

  // Defensive check: ensure result is finite
  if (!isFinite(result)) {
    return fallback;
  }

  return result;
}

