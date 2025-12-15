/**
 * Formatting Utilities
 * 
 * Utilities for formatting currency, numbers, and version labels
 * 
 * @module utils/formatters
 */

import type { ValuationVersion } from '../types/ValuationVersion'

/**
 * Format currency with M/K suffixes
 * @example formatCurrency(2400000) => "€2.4M"
 * @example formatCurrency(450000) => "€450K"
 * @example formatCurrency(5000) => "€5K"
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`
  }
  return `€${value.toFixed(0)}`
}

/**
 * Format version dropdown label with valuation values
 * Format: "€2.4M - €3.8M (Ask: €3.4M)" or "Pending calculation"
 * 
 * @param version - Valuation version with optional valuationResult
 * @returns Formatted label for version dropdown
 */
export function formatVersionLabel(version: ValuationVersion): string {
  const result = version.valuationResult
  
  if (!result) {
    return 'Pending calculation'
  }
  
  const low = formatCurrency(result.equity_value_low)
  const high = formatCurrency(result.equity_value_high)
  const asking = formatCurrency(result.recommended_asking_price)
  
  return `${low} - ${high} (Ask: ${asking})`
}

