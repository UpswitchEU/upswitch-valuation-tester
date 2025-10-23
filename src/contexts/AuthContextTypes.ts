import { createContext } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface BusinessCard {
  company_name: string;
  industry: string;
  business_model: string;
  founding_year: number;
  employee_count: number;
  country_code: string;
  website?: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified?: boolean;
  
  // Profile fields
  avatar_url?: string;
  avatar?: string;
  
  // Business card fields
  company_name?: string;
  business_type?: string;
  industry?: string;
  founded_year?: number;
  years_in_operation?: number;
  employee_count_range?: string;
  city?: string;
  country?: string;
  company_description?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
  businessCard: {
    company_name: string;
    industry: string;
    business_model: string;
    founding_year: number;
    country_code: string;
    employee_count?: number;
  } | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
