/**
 * Growth Format Helper Utilities
 * 
 * Handles inconsistent backend format for growth rate values.
 * Backend may return growth rates as:
 * - Decimal (0.291 = 29.1%)
 * - Percentage (11.11 = 11.11%)
 * - Already normalized (29.1 = 29.1%)
 */

/**
 * Normalize growth value from backend to percentage
 * 
 * Handles inconsistent backend formats:
 * - < 1.0: Treated as decimal (multiply by 100)
 * - >= 1.0 and < 100: Treated as percentage (use as-is)
 * - >= 100: Treated as percentage (use as-is, but log warning)
 * 
 * @param value Growth value from backend (decimal or percentage)
 * @returns Normalized percentage value, or null if invalid
 */
export function normalizeGrowthValue(
  value: number | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle NaN
  if (isNaN(value) || !isFinite(value)) {
    console.warn(`[normalizeGrowthValue] Invalid growth value: ${value}`);
    return null;
  }

  // Format detection: if < 1.0, treat as decimal; if >= 1.0 and < 100, treat as percentage
  if (value < 1.0) {
    return value * 100; // Decimal format (0.291 → 29.1)
  } else if (value >= 1.0 && value < 100) {
    return value; // Percentage format (11.11 → 11.11)
  } else {
    // >= 100 - likely already a percentage but unusually high
    // Log warning but return as-is (could indicate error or hypergrowth)
    if (value >= 1000) {
      console.warn(
        `[normalizeGrowthValue] Suspiciously high growth value: ${value}%. ` +
        `This may indicate a data quality issue or calculation error.`
      );
    }
    return value; // Assume already percentage (1111.1 → 1111.1)
  }
}

/**
 * Format growth value for display
 * 
 * @param value Growth value from backend
 * @param formatPercent Function to format percentage
 * @returns Formatted string or 'N/A'
 */
export function formatGrowthRate(
  value: number | null | undefined,
  formatPercent: (value: number) => string
): string {
  const normalized = normalizeGrowthValue(value);
  return normalized !== null ? formatPercent(normalized) : 'N/A';
}

