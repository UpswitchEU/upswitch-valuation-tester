import { createContext } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface BusinessCard {
  company_name: string
  industry: string
  business_model: string
  founding_year: number
  employee_count: number
  country_code: string
  website?: string
  description?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  email_verified?: boolean

  // Profile fields
  avatar_url?: string
  avatar?: string

  // Business card fields
  company_name?: string
  business_type?: string
  industry?: string
  founded_year?: number
  years_in_operation?: number
  employee_count_range?: string
  city?: string
  country?: string
  company_description?: string
}

/**
 * Authentication Context Type
 * 
 * Defines the contract for the authentication system.
 * This interface matches the return type of useAuth() hook.
 * 
 * Note: cookieHealth is deprecated and always returns null.
 * The simplified authentication system no longer tracks cookie health status.
 */
export interface AuthContextType {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // Loading state (dual aliases for backward compatibility)
  loading: boolean
  isLoading: boolean
  
  // Error state
  error: string | null
  
  // Business card (computed from user data)
  businessCard: {
    company_name: string
    industry: string
    business_model: string
    founding_year: number
    country_code: string
    employee_count?: number
  } | null
  
  // Authentication actions
  checkSession: () => Promise<User | null>
  exchangeToken: (token: string) => Promise<User | null>
  logout: () => void
  refreshAuth: () => Promise<void>  // Alias for checkSession
  
  // Deprecated: Cookie health tracking removed for simplicity
  // Always returns null, kept for backward compatibility
  cookieHealth: null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
