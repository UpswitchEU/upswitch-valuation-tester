/**
 * Session Data Utilities
 *
 * Single Responsibility: Utilities for detecting and working with session data
 * Shared across restoration hooks to ensure consistency
 *
 * @module utils/sessionDataUtils
 */

/**
 * Check if sessionData has meaningful data (not just empty object from NEW report)
 *
 * NEW reports are created optimistically with empty sessionData: {}
 * EXISTING reports have populated sessionData with form fields, results, etc.
 *
 * This is the single source of truth for detecting NEW vs EXISTING reports
 * based on sessionData content.
 *
 * @param sessionData - Session data to check
 * @returns true if sessionData has meaningful fields, false if empty (NEW report)
 *
 * @example
 * ```typescript
 * const sessionData = getSessionData()
 * if (hasMeaningfulSessionData(sessionData)) {
 *   // EXISTING report - restore data
 * } else {
 *   // NEW report - skip restoration
 * }
 * ```
 */
export function hasMeaningfulSessionData(sessionData: any): boolean {
  if (!sessionData || typeof sessionData !== 'object') {
    return false
  }

  const keys = Object.keys(sessionData)
  // Empty object means NEW report
  if (keys.length === 0) {
    return false
  }

  // Check if it has actual form fields (not just metadata)
  // These fields indicate the report has been worked on and has data to restore
  const meaningfulFields = [
    // Core financial data
    'company_name',
    'revenue',
    'ebitda',
    'current_year_data',
    'historical_years_data',
    
    // Business identification
    'business_type',
    'business_type_id',
    'business_structure',
    'business_model',
    'industry',
    
    // Business details
    'business_description',
    'business_highlights',
    'reason_for_selling',
    
    // Location & basic info
    'country_code',
    'city',
    'founding_year',
    
    // Ownership
    'number_of_employees',
    'number_of_owners',
    'shares_for_sale',
    
    // Generated content
    'html_report',
    'info_tab_html',
    'valuation_result',
    
    // Other user-entered data
    'comparables',
    'business_context',
    'recurring_revenue_percentage',
    'owner_role',
    'owner_hours',
    'delegation_capability',
    'succession_plan',
  ]

  return keys.some((key) => meaningfulFields.includes(key))
}

