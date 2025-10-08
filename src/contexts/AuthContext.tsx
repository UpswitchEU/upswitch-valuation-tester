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

const API_URL = import.meta.env.VITE_API_URL || 'https://api.upswitch.biz';

// =============================================================================
// PROVIDER
// =============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Compute business card data from user
  const businessCard = user && user.company_name && user.industry
    ? {
        company_name: user.company_name,
        industry: user.industry,
        business_model: user.business_type || 'other',
        founding_year: user.founded_year || new Date().getFullYear() - (user.years_in_operation || 5),
        country_code: user.country === 'Belgium' ? 'BE' : user.country === 'Netherlands' ? 'NL' : 'BE',
      }
    : null;

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
        
        if (data.success && data.data) {
          setUser(data.data);
          console.log('✅ Existing session found:', data.data.email);
        } else {
          console.log('ℹ️ No existing session');
          setUser(null);
        }
      } else {
        console.log('ℹ️ No valid session');
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

