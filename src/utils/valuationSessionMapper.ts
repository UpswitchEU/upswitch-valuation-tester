/**
 * Valuation Session Mapper Utilities
 * 
 * Maps ValuationSession data to BusinessInfo format for BusinessProfileCardV4
 */

import type { ValuationSession, ValuationResponse } from '../types/valuation'

export interface BusinessInfo {
  name: string
  industry: string
  description: string
  foundedYear: number
  teamSize: string
  revenue: number
  location: string
  isRemote: boolean
  status?: 'active' | 'inactive' | 'draft'
}

/**
 * Map ValuationSession to BusinessInfo
 * 
 * Comprehensive mapping that extracts all business card fields from:
 * - sessionData (complete ValuationRequest)
 * - partialData (incremental updates)
 * - valuationResult (completed valuation)
 * - Top-level fields from backend response
 */
export function mapValuationSessionToBusinessInfo(session: ValuationSession): BusinessInfo {
  // Get all data sources (handle both object and nested structures)
  const sessionData = session.sessionData || {}
  const partialData = session.partialData || {}
  const valuationResult = (session as any).valuationResult as ValuationResponse | undefined
  
  // Also check if data is nested in sessionData/partialData (backend may nest it)
  const nestedSessionData = (sessionData as any)?.sessionData || sessionData
  const nestedPartialData = (partialData as any)?.partialData || partialData

  // Extract company name (priority: valuationResult > sessionData > partialData > top-level)
  const name =
    valuationResult?.company_name ||
    nestedSessionData.company_name ||
    nestedPartialData.company_name ||
    sessionData.company_name ||
    partialData.company_name ||
    (session as any).company_name ||
    'Untitled Business'

  // Extract business type ID (industry) - check multiple possible field names
  const industry =
    nestedSessionData.business_type_id ||
    nestedPartialData.business_type_id ||
    sessionData.business_type_id ||
    partialData.business_type_id ||
    nestedSessionData.business_type ||
    nestedPartialData.business_type ||
    sessionData.business_type ||
    partialData.business_type ||
    nestedSessionData.business_model ||
    nestedPartialData.business_model ||
    sessionData.business_model ||
    partialData.business_model ||
    nestedSessionData.industry ||
    nestedPartialData.industry ||
    sessionData.industry ||
    partialData.industry ||
    ''

  // Extract description (check multiple field names)
  const descriptionValue =
    nestedSessionData.business_context ||
    nestedPartialData.business_context ||
    sessionData.business_context ||
    partialData.business_context ||
    nestedSessionData.business_description ||
    nestedPartialData.business_description ||
    sessionData.business_description ||
    partialData.business_description ||
    nestedSessionData.description ||
    nestedPartialData.description ||
    sessionData.description ||
    partialData.description ||
    nestedSessionData.company_description ||
    nestedPartialData.company_description ||
    sessionData.company_description ||
    partialData.company_description ||
    ''
  const description = typeof descriptionValue === 'string' ? descriptionValue : ''

  // Extract founding year
  const foundedYear =
    nestedSessionData.founding_year ||
    nestedPartialData.founding_year ||
    sessionData.founding_year ||
    partialData.founding_year ||
    nestedSessionData.founded_year ||
    nestedPartialData.founded_year ||
    sessionData.founded_year ||
    partialData.founded_year ||
    new Date().getFullYear()

  // Extract team size (check multiple field names)
  const employees =
    nestedSessionData.number_of_employees ||
    nestedPartialData.number_of_employees ||
    sessionData.number_of_employees ||
    partialData.number_of_employees ||
    nestedSessionData.employee_count ||
    nestedPartialData.employee_count ||
    sessionData.employee_count ||
    partialData.employee_count ||
    nestedSessionData.employees ||
    nestedPartialData.employees ||
    sessionData.employees ||
    partialData.employees ||
    null
  
  const teamSize = employees 
    ? (typeof employees === 'number' ? employees.toString() : String(employees))
    : 'N/A'

  // Extract revenue (check nested current_year_data structure)
  const revenue =
    nestedSessionData.current_year_data?.revenue ||
    nestedPartialData.current_year_data?.revenue ||
    sessionData.current_year_data?.revenue ||
    partialData.current_year_data?.revenue ||
    nestedSessionData.revenue ||
    nestedPartialData.revenue ||
    sessionData.revenue ||
    partialData.revenue ||
    0

  // Extract location (city preferred, fallback to country_code)
  const city =
    nestedSessionData.city ||
    nestedPartialData.city ||
    sessionData.city ||
    partialData.city ||
    ''
  
  const countryCode =
    nestedSessionData.country_code ||
    nestedPartialData.country_code ||
    sessionData.country_code ||
    partialData.country_code ||
    nestedSessionData.country ||
    nestedPartialData.country ||
    sessionData.country ||
    partialData.country ||
    ''
  
  // Combine city and country for location display
  const location = city 
    ? (countryCode ? `${city}, ${countryCode}` : city)
    : (countryCode || 'Unknown')

  // Determine if remote (check is_remote field)
  const isRemote =
    nestedSessionData.is_remote ||
    nestedPartialData.is_remote ||
    sessionData.is_remote ||
    partialData.is_remote ||
    nestedSessionData.isRemote ||
    nestedPartialData.isRemote ||
    sessionData.isRemote ||
    partialData.isRemote ||
    false

  // Determine status based on completion and data presence
  const status: 'active' | 'inactive' | 'draft' = 
    session.completedAt || session.calculatedAt
      ? 'active'
      : (session.partialData && Object.keys(session.partialData).length > 0) ||
        (session.sessionData && Object.keys(session.sessionData).length > 0)
        ? 'active'
        : 'draft'

  // Ensure all required fields have valid values
  const result: BusinessInfo = {
    name: name || 'Untitled Business',
    industry: industry || 'other', // Default to 'other' if no industry found
    description: description || '',
    foundedYear: typeof foundedYear === 'number' && foundedYear > 1900 && foundedYear <= new Date().getFullYear()
      ? foundedYear
      : new Date().getFullYear(),
    teamSize: teamSize || 'N/A',
    revenue: typeof revenue === 'number' && revenue >= 0 ? revenue : 0,
    location: location || 'Unknown',
    isRemote: Boolean(isRemote),
    status: status || 'draft',
  }

  return result
}

/**
 * Extract valuation amount from ValuationSession
 */
export function extractValuationAmount(session: ValuationSession): number | null {
  const valuationResult = (session as any).valuationResult as ValuationResponse | undefined

  if (!valuationResult) {
    return null
  }

  // Try equity_value_mid first (most common)
  if (valuationResult.equity_value_mid) {
    return valuationResult.equity_value_mid
  }

  // Fallback to recommended_asking_price
  if (valuationResult.recommended_asking_price) {
    return valuationResult.recommended_asking_price
  }

  // Fallback to equity_value_high
  if (valuationResult.equity_value_high) {
    return valuationResult.equity_value_high
  }

  return null
}

/**
 * Format valuation amount for display (e.g., "€500K")
 */
export function formatValuationAmount(amount: number): string {
  if (amount >= 1000000) {
    // Millions
    const millions = amount / 1000000
    return `€${millions.toFixed(millions >= 10 ? 0 : 1)}M`
  } else if (amount >= 1000) {
    // Thousands
    const thousands = amount / 1000
    return `€${thousands.toFixed(thousands >= 10 ? 0 : 1)}K`
  } else {
    return `€${Math.round(amount)}`
  }
}

/**
 * Extract profile data from session and user context
 * Returns null if no profile data available (will show profile prompt badge)
 */
export function extractProfileData(
  session: ValuationSession,
  user?: { id?: string; name?: string; email?: string; avatar?: string; profileImage?: string }
): { profileImage?: string; fullName?: string; location?: string } | null {
  if (!user) {
    return null
  }

  // Only return profile data if we have at least an image or name
  const profileImage = user.avatar || user.profileImage
  const fullName = user.name || user.email?.split('@')[0]

  if (!profileImage && !fullName) {
    return null
  }

  return {
    profileImage: profileImage || undefined,
    fullName: fullName || undefined,
    location: undefined, // Can be enhanced if user has location data
  }
}

