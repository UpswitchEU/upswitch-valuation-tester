/**
 * Business Data Validation Service
 *
 * Single Responsibility: Validate business data completeness and quality
 * SOLID Principles: SRP - Only handles validation operations
 *
 * @module services/businessData/businessDataValidationService
 */

import type { BusinessProfileData } from './businessDataTypes'

export class BusinessDataValidationService {
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

export const businessDataValidationService = new BusinessDataValidationService()
