/**
 * Business Data Types
 *
 * Shared type definitions for business data services
 *
 * @module services/businessData/businessDataTypes
 */


export interface BusinessProfileData {
  user_id: string
  company_name?: string
  industry?: string
  business_type?: string
  business_model?: string
  business_type_id?: string
  years_in_operation?: number
  founded_year?: number
  company_age?: number
  employee_count_range?: string
  revenue_range?: string
  asking_price_range?: string
  company_description?: string
  business_highlights?: string
  reason_for_selling?: string
  city?: string
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
