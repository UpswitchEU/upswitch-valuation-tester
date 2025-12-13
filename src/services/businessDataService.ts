/**
 * Business Data Service
 *
 * Fetches and transforms business card/profile data from the backend
 * for pre-populating the intelligent conversation flow.
 *
 * Author: Upswitch Engineering Team
 * Date: October 2025
 */

import type {
  BusinessModel,
  BusinessTypeAnalysis,
  ConversationStartRequest,
  ValuationRequest,
} from '../types/valuation'
import {
  inferBusinessModelFromIndustry,
  inferBusinessModelFromType,
  isValidYear,
  mapToBusinessModel,
} from '../utils/businessExtractionUtils'
import { serviceLogger } from '../utils/logger'

export interface BusinessProfileData {
  user_id: string
  company_name?: string
  industry?: string
  business_type?: string
  business_model?: string // ADD: Business model field
  business_type_id?: string // NEW: PostgreSQL business type ID
  years_in_operation?: number
  founded_year?: number
  company_age?: number // ADD: Company age field
  employee_count_range?: string
  revenue_range?: string
  asking_price_range?: string
  company_description?: string
  business_highlights?: string
  reason_for_selling?: string
  city?: string
  // Add financial data properties for intelligent triage
  revenue?: number
  ebitda?: number
  employees?: number
  country?: string
  business_verified?: boolean
  listing_status?: string
  created_at: string
  updated_at: string
}

export interface BusinessCardData {
  company_name?: string
  industry?: string
  business_type?: string
  years_in_operation?: number
  founded_year?: number
  employee_count_range?: string
  revenue_range?: string
  asking_price_range?: string
  company_description?: string
  business_highlights?: string
  reason_for_selling?: string
  city?: string
  country?: string
}

class BusinessDataService {
  private backendUrl: string

  constructor() {
    this.backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'https://web-production-8d00b.up.railway.app'
  }

  /**
   * Fetch user's business profile data from backend
   */
  async fetchUserBusinessData(userId: string): Promise<BusinessProfileData | null> {
    try {
      serviceLogger.debug('Fetching business profile for user', { userId })

      const response = await fetch(`${this.backendUrl}/api/users/${userId}/business-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send authentication cookie
      })

      if (!response.ok) {
        if (response.status === 404) {
          serviceLogger.info('No business profile found for user', { userId })
          return null
        }
        throw new Error(`Failed to fetch business profile: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch business profile')
      }

      serviceLogger.info('Business profile fetched successfully', { data: result.data })
      return result.data
    } catch (error) {
      serviceLogger.error('Failed to fetch business data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Transform business profile data to valuation request format
   */
  transformToValuationRequest(businessData: BusinessProfileData): Partial<ValuationRequest> {
    const valuationRequest: Partial<ValuationRequest> = {}

    // Map basic company information
    if (businessData.company_name) {
      valuationRequest.company_name = businessData.company_name
    }

    if (businessData.industry) {
      valuationRequest.industry = businessData.industry
    }

    if (businessData.business_type) {
      valuationRequest.business_type = businessData.business_type
    }

    if (businessData.country) {
      valuationRequest.country_code = businessData.country
    }

    if (businessData.founded_year) {
      valuationRequest.founding_year = businessData.founded_year
    }

    // Map revenue range to numeric value (if available)
    if (businessData.revenue_range) {
      const revenueValue = this.parseRevenueRange(businessData.revenue_range)
      if (revenueValue) {
        valuationRequest.revenue = revenueValue
      }
    }

    // Map employee count range
    if (businessData.employee_count_range) {
      const employeeCount = this.parseEmployeeRange(businessData.employee_count_range)
      if (employeeCount) {
        valuationRequest.employee_count = employeeCount
      }
    }

    // Add business context
    if (businessData.company_description) {
      valuationRequest.business_description = businessData.company_description
    }

    if (businessData.business_highlights) {
      valuationRequest.business_highlights = businessData.business_highlights
    }

    if (businessData.reason_for_selling) {
      valuationRequest.reason_for_selling = businessData.reason_for_selling
    }

    if (businessData.city) {
      valuationRequest.city = businessData.city
    }

    return valuationRequest
  }

  /**
   * Transform business profile data to conversation start request
   */
  /**
   * Extract business model from business profile data
   */
  extractBusinessModel(businessData: BusinessProfileData): BusinessModel | string {
    // Priority 1: Explicit business model from data
    if (businessData.business_model) {
      return mapToBusinessModel(businessData.business_model)
    }

    // Priority 2: Infer from industry
    if (businessData.industry) {
      return inferBusinessModelFromIndustry(businessData.industry)
    }

    // Priority 3: Infer from business type
    if (businessData.business_type) {
      return inferBusinessModelFromType(businessData.business_type)
    }

    // Fallback
    return 'services'
  }

  /**
   * Extract founding year from business profile data
   */
  extractFoundingYear(businessData: BusinessProfileData): number {
    // Priority 1: Explicit founding year
    if (businessData.founded_year && isValidYear(businessData.founded_year)) {
      return businessData.founded_year
    }

    // Priority 2: Calculate from years in operation
    if (businessData.years_in_operation) {
      return new Date().getFullYear() - businessData.years_in_operation
    }

    // Priority 3: Extract from company age
    if (businessData.company_age) {
      return new Date().getFullYear() - businessData.company_age
    }

    // Fallback: 5 years ago
    return new Date().getFullYear() - 5
  }

  // Note: mapToBusinessModel, inferBusinessModelFromIndustry, inferBusinessModelFromType, and isValidYear
  // are now imported from businessExtractionUtils to eliminate code duplication

  transformToConversationStartRequest(
    businessData: BusinessProfileData,
    userPreferences?: {
      preferred_methodology?: string
      time_commitment?: 'quick' | 'detailed' | 'comprehensive'
      focus_area?: 'valuation' | 'growth' | 'risk' | 'all'
    }
  ): ConversationStartRequest {
    const conversationRequest: ConversationStartRequest = {
      business_context: {
        company_name: businessData.company_name,
        industry: businessData.industry,
        business_model: businessData.business_type,
        country_code: businessData.country || 'BE',
        founding_year: businessData.founded_year,
        business_type_id: businessData.business_type_id, // NEW: Pass business_type_id through
      },
      user_preferences: userPreferences,
    }

    // Add pre-filled data for fields we already know
    const preFilledData: Record<string, any> = {}

    if (businessData.company_name) {
      preFilledData.company_name = businessData.company_name
    }

    if (businessData.industry) {
      preFilledData.industry = businessData.industry
    }

    if (businessData.business_type) {
      preFilledData.business_type = businessData.business_type
    }

    if (businessData.country) {
      preFilledData.country_code = businessData.country
    }

    if (businessData.founded_year) {
      preFilledData.founding_year = businessData.founded_year
    }

    if (businessData.business_type_id) {
      preFilledData.business_type_id = businessData.business_type_id
      serviceLogger.info('AI Flow: business_type_id included in pre-filled data', {
        business_type_id: businessData.business_type_id,
      })
    }

    if (businessData.years_in_operation) {
      preFilledData.years_in_operation = businessData.years_in_operation
    }

    if (businessData.revenue_range) {
      const revenueValue = this.parseRevenueRange(businessData.revenue_range)
      if (revenueValue) {
        preFilledData.revenue = revenueValue
      }
    }

    if (businessData.employee_count_range) {
      const employeeCount = this.parseEmployeeRange(businessData.employee_count_range)
      if (employeeCount) {
        preFilledData.employee_count = employeeCount
      }
    }

    if (businessData.company_description) {
      preFilledData.business_description = businessData.company_description
    }

    if (businessData.business_highlights) {
      preFilledData.business_highlights = businessData.business_highlights
    }

    if (businessData.city) {
      preFilledData.city = businessData.city
    }

    conversationRequest.pre_filled_data = preFilledData

    return conversationRequest
  }

  /**
   * Parse revenue range string to numeric value
   */
  private parseRevenueRange(revenueRange: string): number | null {
    const range = revenueRange.toLowerCase()

    if (range.includes('<€100k') || range.includes('<100k')) {
      return 50000 // Mid-point of <€100K
    } else if (range.includes('€100k-€500k') || range.includes('100k-500k')) {
      return 300000 // Mid-point of €100K-€500K
    } else if (range.includes('€500k-€1m') || range.includes('500k-1m')) {
      return 750000 // Mid-point of €500K-€1M
    } else if (range.includes('€1m-€5m') || range.includes('1m-5m')) {
      return 3000000 // Mid-point of €1M-€5M
    } else if (range.includes('€5m+') || range.includes('5m+')) {
      return 7500000 // Representative value for €5M+
    }

    return null
  }

  /**
   * Parse employee count range to numeric value
   */
  private parseEmployeeRange(employeeRange: string): number | null {
    const range = employeeRange.toLowerCase()

    if (range.includes('1-5')) {
      return 3 // Mid-point of 1-5
    } else if (range.includes('6-20')) {
      return 13 // Mid-point of 6-20
    } else if (range.includes('21-50')) {
      return 35 // Mid-point of 21-50
    } else if (range.includes('51-100')) {
      return 75 // Mid-point of 51-100
    } else if (range.includes('100+')) {
      return 150 // Representative value for 100+
    }

    return null
  }

  /**
   * Get business type analysis for methodology recommendation
   */
  async getBusinessTypeAnalysis(businessType: string): Promise<BusinessTypeAnalysis | null> {
    try {
      // Use Node.js backend instead of direct Python engine calls
      // FIX: Fallback should be Node.js backend (proxy), not Python engine directly
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        'https://web-production-8d00b.up.railway.app'

      const response = await fetch(`${backendUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_type: businessType,
          country_code: 'BE',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze business type: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      serviceLogger.error('Error analyzing business type', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Check if user has complete business profile
   */
  hasCompleteBusinessProfile(businessData: BusinessProfileData): boolean {
    const requiredFields = ['company_name', 'industry', 'business_type', 'revenue_range']

    return requiredFields.every(
      (field) =>
        businessData[field as keyof BusinessProfileData] &&
        businessData[field as keyof BusinessProfileData] !== ''
    )
  }

  /**
   * Get missing fields for business profile with detailed analysis
   */
  getMissingFields(businessData: BusinessProfileData): string[] {
    const requiredFields = ['company_name', 'industry', 'business_type', 'revenue_range']

    return requiredFields.filter(
      (field) =>
        !businessData[field as keyof BusinessProfileData] ||
        businessData[field as keyof BusinessProfileData] === ''
    )
  }

  /**
   * Get detailed field analysis with priority and importance
   */
  getFieldAnalysis(businessData: BusinessProfileData): {
    missing: string[]
    complete: string[]
    priority: string[]
    estimatedTime: number
    completeness: number
  } {
    const allFields = [
      'company_name',
      'industry',
      'business_type',
      'revenue_range',
      'employee_count_range',
      'company_description',
      'business_highlights',
      'city',
      'country',
    ]

    const criticalFields = ['company_name', 'industry', 'business_type', 'revenue_range']
    const optionalFields = ['company_description', 'business_highlights', 'city']

    const complete = allFields.filter(
      (field) =>
        businessData[field as keyof BusinessProfileData] &&
        businessData[field as keyof BusinessProfileData] !== ''
    )

    const missing = allFields.filter(
      (field) =>
        !businessData[field as keyof BusinessProfileData] ||
        businessData[field as keyof BusinessProfileData] === ''
    )

    const priority = missing.filter((field) => criticalFields.includes(field))

    // Estimate time based on missing fields
    const criticalMissing = missing.filter((field) => criticalFields.includes(field)).length
    const optionalMissing = missing.filter((field) => optionalFields.includes(field)).length
    const estimatedTime = criticalMissing * 1.5 + optionalMissing * 0.5 // minutes

    return {
      missing,
      complete,
      priority,
      estimatedTime: Math.max(1, Math.round(estimatedTime)),
      completeness: Math.round((complete.length / allFields.length) * 100),
    }
  }

  /**
   * Generate targeted questions for missing fields
   */
  generateTargetedQuestions(businessData: BusinessProfileData): {
    questions: Array<{ field: string; question: string; priority: 'high' | 'medium' | 'low' }>
    summary: string
    estimatedTime: number
  } {
    const analysis = this.getFieldAnalysis(businessData)

    const questionTemplates: Record<string, string> = {
      company_name: 'What is your company name?',
      industry: 'What industry is your company in?',
      business_type: 'What type of business structure do you have?',
      revenue_range: 'What is your annual revenue range?',
      employee_count_range: 'How many employees do you have?',
      company_description: 'Can you briefly describe your business?',
      business_highlights: 'What are your key business highlights?',
      city: 'What city is your business located in?',
      country: 'What country is your business in?',
    }

    const questions = analysis.missing.map((field) => ({
      field,
      question: questionTemplates[field] || `Please provide ${field.replace('_', ' ')}`,
      priority: analysis.priority.includes(field)
        ? ('high' as const)
        : ['company_description', 'business_highlights'].includes(field)
          ? ('medium' as const)
          : ('low' as const),
    }))

    const summary = `We have ${analysis.complete.length}/${analysis.missing.length + analysis.complete.length} fields. We'll ask ${analysis.priority.length} critical questions (${analysis.estimatedTime} minutes).`

    return {
      questions,
      summary,
      estimatedTime: analysis.estimatedTime,
    }
  }

  /**
   * Get data completeness percentage
   */
  getDataCompleteness(businessData: BusinessProfileData): number {
    const allFields = [
      'company_name',
      'industry',
      'business_type',
      'years_in_operation',
      'revenue_range',
      'employee_count_range',
      'company_description',
      'business_highlights',
      'city',
      'country',
    ]

    const filledFields = allFields.filter(
      (field) =>
        businessData[field as keyof BusinessProfileData] &&
        businessData[field as keyof BusinessProfileData] !== ''
    )

    return Math.round((filledFields.length / allFields.length) * 100)
  }
}

export const businessDataService = new BusinessDataService()
export default businessDataService
