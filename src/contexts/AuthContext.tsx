/**
 * Authentication Context for Valuation Tester
 * 
 * Handles cross-domain authentication via token exchange
 * Integrates with main platform (upswitch.biz) authentication
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified?: boolean;
  
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

interface AuthContextType {
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

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// =============================================================================
// CONFIGURATION
// =============================================================================

// Backend URL for authentication (Node.js backend, not the valuation tester itself)
const API_URL = import.meta.env.VITE_BACKEND_URL || 
                import.meta.env.VITE_API_BASE_URL || 
                'http://localhost:5001';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert employee_count_range string to approximate number
 * Examples: "1-10" -> 5, "11-50" -> 30, "51-200" -> 125
 */
const parseEmployeeCount = (range?: string): number | undefined => {
  if (!range) return undefined;
  
  // Handle common range formats
  const rangeMatch = range.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    // Return middle of range
    return Math.floor((min + max) / 2);
  }
  
  // Handle "200+" or "500+" formats
  const plusMatch = range.match(/(\d+)\+/);
  if (plusMatch) {
    return parseInt(plusMatch[1], 10);
  }
  
  // Try to parse as direct number
  const directNumber = parseInt(range, 10);
  if (!isNaN(directNumber)) {
    return directNumber;
  }
  
  return undefined;
};

// =============================================================================
// PROVIDER
// =============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper to map business_type to industry category if industry is not set
  const getIndustry = (user: User): string | undefined => {
    if (user.industry) return user.industry;
    
    // Map common business types to industry categories
    // This ensures pre-fill works even if user only set business_type
    const businessTypeToIndustry: Record<string, string> = {
      // Food & Beverage
      'chef': 'services',
      'catering': 'services',
      'restaurant': 'hospitality',
      'meals': 'services',
      
      // Beauty & Wellness
      'hairstyling': 'services',
      'makeup': 'services',
      'massage': 'services',
      'nailcare': 'services',
      'wellness': 'services',
      
      // Fitness & Health
      'personaltraining': 'services',
      'gym': 'services',
      'healthcare': 'healthcare',
      
      // Creative & Media
      'photography': 'services',
      'videography': 'services',
      'design': 'services',
      'marketing': 'services',
      
      // Tech & Digital
      'saas': 'technology',
      'software': 'technology',
      'webdev': 'technology',
      'itsupport': 'technology',
      'b2b_saas': 'technology',
      
      // E-commerce & Retail
      'ecommerce': 'retail',
      'retail': 'retail',
      'subscription': 'retail',
      
      // Home & Property
      'cleaning': 'services',
      'realestate': 'real_estate',
      'construction': 'construction',
      'landscaping': 'services',
      
      // Professional Services
      'consulting': 'services',
      'legal': 'services',
      'accounting': 'services',
      'hr': 'services',
      
      // Education & Training
      'education': 'services',
      'coaching': 'services',
      
      // Transportation & Logistics
      'logistics': 'services',
      'automotive': 'services',
      
      // Events & Entertainment
      'events': 'services',
      'entertainment': 'services',
      
      // Legacy types
      'manufacturing': 'manufacturing',
      'marketplace': 'technology',
      'b2c': 'retail',
    };
    
    const mapped = businessTypeToIndustry[user.business_type?.toLowerCase() || ''];
    return mapped || 'services'; // Default to services if no mapping found
  };
  
  // Compute business card data from user
  const businessCard = React.useMemo(() => {
    if (!user) {
      console.log('❌ No business card: user missing');
      return null;
    }
    
    // Check if user has any business profile data
    const hasBusinessData = user.company_name || user.business_type || user.industry;
    if (!hasBusinessData) {
      console.log('❌ No business card: no business profile data', { 
        hasUser: !!user, 
        companyName: user?.company_name,
        businessType: user?.business_type,
        industry: user?.industry
      });
      return null;
    }
    
    const card = {
      company_name: user.company_name || 'Your Company', // Fallback if missing
      industry: getIndustry(user) || 'services',
      business_model: user.business_type || 'other',
      founding_year: user.founded_year || new Date().getFullYear() - (user.years_in_operation || 5),
      country_code: user.country || 'BE', // Already a 2-letter code (BE, NL, etc.)
      employee_count: parseEmployeeCount(user.employee_count_range),
    };
    
    console.log('✅ Business card computed:', card);
    return card;
  }, [user]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    initAuth();
  }, []);

  /**
   * Initialize authentication flow
   * Checks for token in URL or existing session
   */
  const initAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for token in URL parameters
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (token) {
        console.log('🔑 Token found in URL, exchanging for session...');
        await exchangeToken(token);
        
        // Remove token from URL for security
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        // Check for existing session cookie
        console.log('🔍 Checking for existing session...');
        await checkSession();
      }
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Exchange subdomain token for session cookie
   */
  const exchangeToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical for cookies
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const data = await response.json();

      if (data.success && data.data?.user) {
        setUser(data.data.user);
        console.log('✅ Authentication successful:', data.data.user.email);
      } else {
        throw new Error('Invalid response from token exchange');
      }
    } catch (err) {
      console.error('❌ Token exchange error:', err);
      setError(err instanceof Error ? err.message : 'Token exchange failed');
      throw err;
    }
  };

  /**
   * Check for existing session
   */
  const checkSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('🔍 Session response:', data);
        console.log('🔍 Session response structure:', {
          success: data.success,
          hasData: !!data.data,
          hasUser: !!data.user,
          dataKeys: data.data ? Object.keys(data.data) : [],
          userKeys: data.user ? Object.keys(data.user) : []
        });
        
        if (data.success && data.data) {
          console.log('🔍 User data fields (data.data):', {
            id: data.data.id,
            email: data.data.email,
            company_name: data.data.company_name,
            business_type: data.data.business_type,
            industry: data.data.industry,
            founded_year: data.data.founded_year,
            employee_count_range: data.data.employee_count_range,
            country: data.data.country
          });
          setUser(data.data);
          console.log('✅ Existing session found (data.data):', data.data);
        } else if (data.success && data.user) {
          // Alternative response format
          console.log('🔍 User data fields (data.user):', {
            id: data.user.id,
            email: data.user.email,
            company_name: data.user.company_name,
            business_type: data.user.business_type,
            industry: data.user.industry,
            founded_year: data.user.founded_year,
            employee_count_range: data.user.employee_count_range,
            country: data.user.country
          });
          setUser(data.user);
          console.log('✅ Existing session found (data.user):', data.user);
        } else {
          console.log('ℹ️ No existing session - response:', JSON.stringify(data));
          setUser(null);
        }
      } else {
        console.log('ℹ️ No valid session - status:', response.status);
        setUser(null);
      }
    } catch (err) {
      console.error('❌ Session check error:', err);
      setUser(null);
    }
  };

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    await checkSession();
    setIsLoading(false);
  }, []);

  /**
   * Listen for authentication events from parent window
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = [
        'https://upswitch.biz',
        'http://localhost:5173',
      ];

      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data.type === 'AUTH_REFRESH') {
        console.log('🔄 Auth refresh requested by parent window');
        refreshAuth();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    refreshAuth,
    businessCard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to require authentication
 * Redirects or shows message if not authenticated
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.warn('⚠️ Authentication required');
      // Could redirect or show login prompt here
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
};

