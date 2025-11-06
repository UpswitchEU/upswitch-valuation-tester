/**
 * Growth Format Helper Utilities
 * 
 * Backend now consistently returns all growth rates in DECIMAL format:
 * - CAGR: 0.0037 = 0.37%, 0.111 = 11.1%
 * - Revenue Growth: 0.20 = 20%, -0.15 = -15%
 * 
 * Frontend always converts decimal to percentage for display.
 */

/**
 * Normalize growth value from backend to percentage
 * 
 * Backend always returns growth values as decimal format (0.0037 = 0.37%).
 * This function converts decimal to percentage for display.
 * 
 * @param value Growth value from backend in decimal format (0.0037 = 0.37%)
 * @returns Percentage value for display (0.37), or null if invalid
 */
export function normalizeGrowthValue(
  value: number | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle NaN or invalid values
  if (isNaN(value) || !isFinite(value)) {
    console.warn(`[normalizeGrowthValue] Invalid growth value: ${value}`);
    return null;
  }

  // Backend always returns decimal format - convert to percentage
  // Example: 0.0037 → 0.37%, 0.111 → 11.1%
  const percentage = value * 100;
  
  // Sanity check: Flag unrealistic values (>1000% or <-500% likely indicate errors)
  if (percentage > 1000 || percentage < -500) {
    console.warn(
      `[normalizeGrowthValue] Suspiciously extreme growth value: ${percentage}%. ` +
      `This may indicate a data quality issue or calculation error.`
    );
  }
  
  return percentage;
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

