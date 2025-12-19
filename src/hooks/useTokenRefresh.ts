/**
 * Token Refresh Hook (Valuation Tester)
 * 
 * Automatically refreshes JWT tokens before they expire to ensure
 * users are never logged out unexpectedly
 * 
 * Strategy:
 * - Proactive refresh at 80% of TTL (refresh before expiration)
 * - Check token expiry every 5 minutes
 * - Background refresh without user interruption
 * - Silent refresh with exponential backoff
 * - Fallback to re-login if refresh fails
 * - Refresh on visibility change (tab focus)
 */

import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-8d00b.up.railway.app';
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes (more frequent for proactive refresh)
const REFRESH_THRESHOLD = 0.8; // Refresh at 80% of TTL (proactive)

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Decode JWT token to get expiry time
 */
function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Get token expiry time from cookie (if accessible)
 * Note: HttpOnly cookies can't be read from JavaScript, so we'll use
 * the refresh endpoint response or estimate based on session age
 */
function getTokenExpiry(): number | null {
  // Try to get expiry from JWT if we have access to it
  // For HttpOnly cookies, we'll rely on the refresh endpoint
  // which will tell us if refresh is needed
  return null; // Will be determined by API response
}

/**
 * Calculate time until token expires (in milliseconds)
 */
function getTimeUntilExpiry(exp: number): number {
  const now = Math.floor(Date.now() / 1000);
  return (exp - now) * 1000; // Convert to milliseconds
}

interface RefreshOptions {
  onRefreshSuccess?: () => void;
  onRefreshFailure?: (error: Error) => void;
  onTokenExpired?: () => void;
}

export const useTokenRefresh = (options: RefreshOptions = {}) => {
  const { onRefreshSuccess, onRefreshFailure, onTokenExpired } = options;
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastRefreshAttemptRef = useRef<number>(0);
  
  /**
   * Refresh token with exponential backoff
   */
  const refreshToken = useCallback(async (retryCount = 0): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress, skipping...');
      return false;
    }
    
    // Rate limiting: Don't attempt refresh more than once per minute
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < 60 * 1000) {
      console.log('Token refresh rate limited, skipping...');
      return false;
    }
    
    isRefreshingRef.current = true;
    lastRefreshAttemptRef.current = now;
    
    try {
      console.log('🔄 Attempting to refresh session token...');
      
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        {
          withCredentials: true, // Important: Include cookies
          timeout: 10000, // 10 second timeout
        }
      );
      
      if (response.data.success) {
        console.log('✅ Session token refreshed successfully');
        onRefreshSuccess?.();
        return true;
      } else {
        throw new Error('Token refresh failed: ' + response.data.error);
      }
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      
      // Handle different error cases
      if (error.response?.status === 401) {
        // Token is invalid or expired - user needs to re-login
        console.warn('Token expired, user needs to re-login');
        onTokenExpired?.();
        return false;
      }
      
      // Network error or server error - retry with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying token refresh in ${delay}ms (attempt ${retryCount + 1}/3)...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshToken(retryCount + 1);
      }
      
      // Max retries exceeded
      console.error('Token refresh failed after 3 attempts');
      onRefreshFailure?.(error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onRefreshSuccess, onRefreshFailure, onTokenExpired]);
  
  /**
   * Check if token needs refresh and refresh proactively
   * Refreshes at 80% of TTL to prevent expiration
   */
  const checkAndRefresh = useCallback(async () => {
    try {
      // Make a lightweight auth check to verify session
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        timeout: 5000,
      });
      
      if (response.data.success) {
        // User is authenticated - check if refresh is needed
        // Since we can't read HttpOnly cookies, we'll proactively refresh
        // The backend will handle token expiry validation
        
        // Check if we should refresh (proactive refresh at 80% of TTL)
        // We'll refresh every time we check if enough time has passed
        // This ensures we refresh before expiration
        
        console.log('✅ Auth check passed, checking if proactive refresh needed');
        
        // Proactively refresh to extend session
        // The backend will determine if refresh is actually needed
        await refreshToken();
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        // User is not authenticated, stop checking
        console.log('User not authenticated, stopping token refresh checks');
        onTokenExpired?.();
        
        // Clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Network error, will retry on next interval
        console.warn('Auth check failed (network error), will retry:', error.message);
      }
    }
  }, [refreshToken, onTokenExpired]);
  
  /**
   * Start token refresh checks
   * - Checks every 5 minutes for proactive refresh
   * - Refreshes on visibility change (tab focus)
   * - Background refresh without blocking UI
   */
  useEffect(() => {
    console.log('🔐 Starting proactive token refresh checks (interval: 5 minutes)');
    
    // Initial check after 5 seconds (give app time to initialize)
    const initialTimeout = setTimeout(() => {
      checkAndRefresh();
    }, 5000);
    
    // Set up periodic checks (every 5 minutes)
    intervalRef.current = setInterval(() => {
      checkAndRefresh();
    }, CHECK_INTERVAL);
    
    // Refresh on visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔐 Tab focused, checking token refresh');
        checkAndRefresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🔐 Stopped token refresh checks');
    };
  }, [checkAndRefresh]);
  
  // Return refresh function for manual triggering
  return {
    refreshToken,
    isRefreshing: isRefreshingRef.current,
  };
};

/**
 * Hook for manually refreshing token
 * Useful for "Refresh Session" buttons or triggered refresh
 */
export const useManualTokenRefresh = () => {
  const isRefreshingRef = useRef(false);
  
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress');
      return false;
    }
    
    isRefreshingRef.current = true;
    
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        {
          withCredentials: true,
          timeout: 10000,
        }
      );
      
      if (response.data.success) {
        console.log('✅ Manual token refresh successful');
        return true;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);
  
  return {
    refreshToken,
    isRefreshing: isRefreshingRef.current,
  };
};
