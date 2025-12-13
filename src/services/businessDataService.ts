/**
 * Business Data Service (Legacy - Deprecated)
 *
 * @deprecated This service has been split into focused services:
 * - businessDataFetchingService: Data fetching operations
 * - businessDataTransformationService: Data transformation operations
 * - businessDataValidationService: Data validation operations
 *
 * This file is kept for backward compatibility and delegates to the new services.
 * Please migrate to the new services for better maintainability.
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
    businessDataFetchingService,
    businessDataTransformationService,
    businessDataValidationService,
    type BusinessCardData,
    type BusinessProfileData,
} from './businessData'

// Re-export types for backward compatibility
export type { BusinessCardData, BusinessProfileData }

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

/**
 * Legacy BusinessDataService class - delegates to new focused services
 * Maintains backward compatibility while using the new modular architecture
 */
class BusinessDataService {
  // Fetching operations delegate to fetching service
  async fetchUserBusinessData(userId: string): Promise<BusinessProfileData | null> {
    return businessDataFetchingService.fetchUserBusinessData(userId)
  }

  async getBusinessTypeAnalysis(businessType: string): Promise<BusinessTypeAnalysis | null> {
    return businessDataFetchingService.getBusinessTypeAnalysis(businessType)
  }

  // Transformation operations delegate to transformation service
  transformToValuationRequest(businessData: BusinessProfileData): Partial<ValuationRequest> {
    return businessDataTransformationService.transformToValuationRequest(businessData)
  }

  transformToConversationStartRequest(
    businessData: BusinessProfileData,
    userPreferences?: {
      preferred_methodology?: string
      time_commitment?: 'quick' | 'detailed' | 'comprehensive'
      focus_area?: 'valuation' | 'growth' | 'risk' | 'all'
    }
  ): ConversationStartRequest {
    return businessDataTransformationService.transformToConversationStartRequest(
      businessData,
      userPreferences
    )
  }

  extractBusinessModel(businessData: BusinessProfileData): BusinessModel | string {
    return businessDataTransformationService.extractBusinessModel(businessData)
  }

  extractFoundingYear(businessData: BusinessProfileData): number {
    return businessDataTransformationService.extractFoundingYear(businessData)
  }

  // Validation operations delegate to validation service
  hasCompleteBusinessProfile(businessData: BusinessProfileData): boolean {
    return businessDataValidationService.hasCompleteBusinessProfile(businessData)
  }

  getMissingFields(businessData: BusinessProfileData): string[] {
    return businessDataValidationService.getMissingFields(businessData)
  }

  getFieldAnalysis(businessData: BusinessProfileData) {
    return businessDataValidationService.getFieldAnalysis(businessData)
  }

  generateTargetedQuestions(businessData: BusinessProfileData) {
    return businessDataValidationService.generateTargetedQuestions(businessData)
  }

  getDataCompleteness(businessData: BusinessProfileData): number {
    return businessDataValidationService.getDataCompleteness(businessData)
  }
}

export const businessDataService = new BusinessDataService()
export default businessDataService
