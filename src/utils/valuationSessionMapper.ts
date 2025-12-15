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
 */
export function mapValuationSessionToBusinessInfo(session: ValuationSession): BusinessInfo {
  const sessionData = session.sessionData || {}
  const partialData = session.partialData || {}
  const valuationResult = (session as any).valuationResult as ValuationResponse | undefined

  // Extract company name
  const name =
    sessionData.company_name ||
    partialData.company_name ||
    valuationResult?.company_name ||
    'Untitled Business'

  // Extract business type ID (industry)
  const industry =
    sessionData.business_type_id ||
    partialData.business_type_id ||
    sessionData.business_model ||
    partialData.business_model ||
    ''

  // Extract description
  const descriptionValue =
    sessionData.business_context ||
    sessionData.business_description ||
    partialData.business_description ||
    ''
  const description = typeof descriptionValue === 'string' ? descriptionValue : ''

  // Extract founding year
  const foundedYear =
    sessionData.founding_year ||
    partialData.founding_year ||
    new Date().getFullYear()

  // Extract team size
  const employees =
    sessionData.number_of_employees ||
    partialData.number_of_employees ||
    sessionData.employee_count ||
    partialData.employee_count
  const teamSize = employees ? employees.toString() : 'N/A'

  // Extract revenue
  const revenue =
    sessionData.current_year_data?.revenue ||
    partialData.current_year_data?.revenue ||
    sessionData.revenue ||
    partialData.revenue ||
    0

  // Extract location
  const location =
    sessionData.country_code ||
    partialData.country_code ||
    (sessionData as any).location ||
    (partialData as any).city ||
    'Unknown'

  // Determine if remote (can be enhanced later)
  const isRemote = false

  // Determine status
  const status: 'active' | 'inactive' | 'draft' = session.completedAt
    ? 'active'
    : session.partialData && Object.keys(session.partialData).length > 0
      ? 'active'
      : 'draft'

  return {
    name,
    industry,
    description,
    foundedYear,
    teamSize,
    revenue,
    location,
    isRemote,
    status,
  }
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

