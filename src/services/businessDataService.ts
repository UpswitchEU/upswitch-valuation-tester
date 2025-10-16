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
  ValuationRequest, 
  ConversationStartRequest,
  BusinessTypeAnalysis 
} from '../types/valuation';

export interface BusinessProfileData {
  user_id: string;
  company_name?: string;
  industry?: string;
  business_type?: string;
  years_in_operation?: number;
  founded_year?: number;
  employee_count_range?: string;
  revenue_range?: string;
  asking_price_range?: string;
  company_description?: string;
  business_highlights?: string;
  reason_for_selling?: string;
  city?: string;
  // Add financial data properties for intelligent triage
  revenue?: number;
  ebitda?: number;
  employees?: number;
  country?: string;
  business_verified?: boolean;
  listing_status?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessCardData {
  company_name?: string;
  industry?: string;
  business_type?: string;
  years_in_operation?: number;
  founded_year?: number;
  employee_count_range?: string;
  revenue_range?: string;
  asking_price_range?: string;
  company_description?: string;
  business_highlights?: string;
  reason_for_selling?: string;
  city?: string;
  country?: string;
}

class BusinessDataService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 
                     import.meta.env.VITE_API_BASE_URL || 
                     'https://web-production-8d00b.up.railway.app';
  }

  /**
   * Fetch user's business profile data from backend
   */
  async fetchUserBusinessData(userId: string): Promise<BusinessProfileData | null> {
    try {
      console.log(`📋 Fetching business profile for user: ${userId}`);
      
      const response = await fetch(`${this.backendUrl}/api/users/${userId}/business-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send authentication cookie
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No business profile found for user');
          return null;
        }
        throw new Error(`Failed to fetch business profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch business profile');
      }

      console.log('✅ Business profile fetched successfully:', result.data);
      return result.data;
      
    } catch (error) {
      console.error('❌ Error fetching business profile:', error);
      return null;
    }
  }

  /**
   * Transform business profile data to valuation request format
   */
  transformToValuationRequest(businessData: BusinessProfileData): Partial<ValuationRequest> {
    const valuationRequest: Partial<ValuationRequest> = {};

    // Map basic company information
    if (businessData.company_name) {
      valuationRequest.company_name = businessData.company_name;
    }

    if (businessData.industry) {
      valuationRequest.industry = businessData.industry;
    }

    if (businessData.business_type) {
      valuationRequest.business_type = businessData.business_type;
    }

    if (businessData.country) {
      valuationRequest.country_code = businessData.country;
    }

    if (businessData.founded_year) {
      valuationRequest.founding_year = businessData.founded_year;
    }

    // Map revenue range to numeric value (if available)
    if (businessData.revenue_range) {
      const revenueValue = this.parseRevenueRange(businessData.revenue_range);
      if (revenueValue) {
        valuationRequest.revenue = revenueValue;
      }
    }

    // Map employee count range
    if (businessData.employee_count_range) {
      const employeeCount = this.parseEmployeeRange(businessData.employee_count_range);
      if (employeeCount) {
        valuationRequest.employee_count = employeeCount;
      }
    }

    // Add business context
    if (businessData.company_description) {
      valuationRequest.business_description = businessData.company_description;
    }

    if (businessData.business_highlights) {
      valuationRequest.business_highlights = businessData.business_highlights;
    }

    if (businessData.reason_for_selling) {
      valuationRequest.reason_for_selling = businessData.reason_for_selling;
    }

    if (businessData.city) {
      valuationRequest.city = businessData.city;
    }

    return valuationRequest;
  }

  /**
   * Transform business profile data to conversation start request
   */
  transformToConversationStartRequest(
    businessData: BusinessProfileData,
    userPreferences?: {
      preferred_methodology?: string;
      time_commitment?: 'quick' | 'detailed' | 'comprehensive';
      focus_area?: 'valuation' | 'growth' | 'risk' | 'all';
    }
  ): ConversationStartRequest {
    const conversationRequest: ConversationStartRequest = {
      business_context: {
        company_name: businessData.company_name,
        industry: businessData.industry,
        business_model: businessData.business_type,
        country_code: businessData.country || 'BE',
        founding_year: businessData.founded_year,
      },
      user_preferences: userPreferences,
    };

    // Add pre-filled data for fields we already know
    const preFilledData: Record<string, any> = {};

    if (businessData.company_name) {
      preFilledData.company_name = businessData.company_name;
    }

    if (businessData.industry) {
      preFilledData.industry = businessData.industry;
    }

    if (businessData.business_type) {
      preFilledData.business_type = businessData.business_type;
    }

    if (businessData.country) {
      preFilledData.country_code = businessData.country;
    }

    if (businessData.founded_year) {
      preFilledData.founding_year = businessData.founded_year;
    }

    if (businessData.years_in_operation) {
      preFilledData.years_in_operation = businessData.years_in_operation;
    }

    if (businessData.revenue_range) {
      const revenueValue = this.parseRevenueRange(businessData.revenue_range);
      if (revenueValue) {
        preFilledData.revenue = revenueValue;
      }
    }

    if (businessData.employee_count_range) {
      const employeeCount = this.parseEmployeeRange(businessData.employee_count_range);
      if (employeeCount) {
        preFilledData.employee_count = employeeCount;
      }
    }

    if (businessData.company_description) {
      preFilledData.business_description = businessData.company_description;
    }

    if (businessData.business_highlights) {
      preFilledData.business_highlights = businessData.business_highlights;
    }

    if (businessData.city) {
      preFilledData.city = businessData.city;
    }

    conversationRequest.pre_filled_data = preFilledData;

    return conversationRequest;
  }

  /**
   * Parse revenue range string to numeric value
   */
  private parseRevenueRange(revenueRange: string): number | null {
    const range = revenueRange.toLowerCase();
    
    if (range.includes('<€100k') || range.includes('<100k')) {
      return 50000; // Mid-point of <€100K
    } else if (range.includes('€100k-€500k') || range.includes('100k-500k')) {
      return 300000; // Mid-point of €100K-€500K
    } else if (range.includes('€500k-€1m') || range.includes('500k-1m')) {
      return 750000; // Mid-point of €500K-€1M
    } else if (range.includes('€1m-€5m') || range.includes('1m-5m')) {
      return 3000000; // Mid-point of €1M-€5M
    } else if (range.includes('€5m+') || range.includes('5m+')) {
      return 7500000; // Representative value for €5M+
    }
    
    return null;
  }

  /**
   * Parse employee count range to numeric value
   */
  private parseEmployeeRange(employeeRange: string): number | null {
    const range = employeeRange.toLowerCase();
    
    if (range.includes('1-5')) {
      return 3; // Mid-point of 1-5
    } else if (range.includes('6-20')) {
      return 13; // Mid-point of 6-20
    } else if (range.includes('21-50')) {
      return 35; // Mid-point of 21-50
    } else if (range.includes('51-100')) {
      return 75; // Mid-point of 51-100
    } else if (range.includes('100+')) {
      return 150; // Representative value for 100+
    }
    
    return null;
  }

  /**
   * Get business type analysis for methodology recommendation
   */
  async getBusinessTypeAnalysis(businessType: string): Promise<BusinessTypeAnalysis | null> {
    try {
      const valuationEngineUrl = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                                import.meta.env.VITE_VALUATION_API_URL || 
                                'https://upswitch-valuation-engine-production.up.railway.app';

      const response = await fetch(`${valuationEngineUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_type: businessType,
          country_code: 'BE'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze business type: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('❌ Error analyzing business type:', error);
      return null;
    }
  }

  /**
   * Check if user has complete business profile
   */
  hasCompleteBusinessProfile(businessData: BusinessProfileData): boolean {
    const requiredFields = [
      'company_name',
      'industry', 
      'business_type',
      'revenue_range'
    ];

    return requiredFields.every(field => 
      businessData[field as keyof BusinessProfileData] && 
      businessData[field as keyof BusinessProfileData] !== ''
    );
  }

  /**
   * Get missing fields for business profile
   */
  getMissingFields(businessData: BusinessProfileData): string[] {
    const requiredFields = [
      'company_name',
      'industry',
      'business_type', 
      'revenue_range'
    ];

    return requiredFields.filter(field => 
      !businessData[field as keyof BusinessProfileData] || 
      businessData[field as keyof BusinessProfileData] === ''
    );
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
      'country'
    ];

    const filledFields = allFields.filter(field => 
      businessData[field as keyof BusinessProfileData] && 
      businessData[field as keyof BusinessProfileData] !== ''
    );

    return Math.round((filledFields.length / allFields.length) * 100);
  }
}

export const businessDataService = new BusinessDataService();
export default businessDataService;
