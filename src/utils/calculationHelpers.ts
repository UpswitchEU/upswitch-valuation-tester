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
 * - One value is 0 → uses non-zero value as reference
 * - Values are undefined/null/NaN → returns null
 * - Result is Infinity → returns null
 * 
 * @param value1 First value
 * @param value2 Second value
 * @returns Variance percentage (0-100+) or null if cannot calculate
 */
export function calculateVariance(value1: number, value2: number): number | null {
  // Validate inputs
  if (
    value1 === undefined || value1 === null || isNaN(value1) ||
    value2 === undefined || value2 === null || isNaN(value2)
  ) {
    return null;
  }

  // Both zero → no variance
  if (value1 === 0 && value2 === 0) {
    return 0;
  }

  // Calculate average (base for variance)
  const average = (value1 + value2) / 2;

  // Average is zero (shouldn't happen if we checked both zero above, but defensive)
  if (average === 0) {
    return null;
  }

  // Calculate variance
  const variance = Math.abs((value1 - value2) / average) * 100;

  // Check for Infinity or NaN in result
  if (!isFinite(variance)) {
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
 * @param numerator Numerator
 * @param denominator Denominator
 * @param fallback Fallback value if division is invalid (default 0)
 * @returns Result or fallback
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  fallback: number = 0
): number {
  if (
    denominator === 0 ||
    isNaN(numerator) ||
    isNaN(denominator) ||
    !isFinite(numerator) ||
    !isFinite(denominator)
  ) {
    return fallback;
  }

  const result = numerator / denominator;

  if (!isFinite(result)) {
    return fallback;
  }

  return result;
}

