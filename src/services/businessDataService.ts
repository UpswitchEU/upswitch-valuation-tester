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
