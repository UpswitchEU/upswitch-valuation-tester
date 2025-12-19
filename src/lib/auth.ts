/**
 * Simplified Authentication Module
 * 
 * World-class authentication following Stripe/Auth0 patterns:
 * - Simple, deterministic flow
 * - Minimal logging (errors only)
 * - Fast initialization (<100ms)
 * - No over-engineering
 * 
 * Flow:
 * 1. Check cookie (sync) → If exists, verify with backend
 * 2. Check token in URL → Exchange for cookie
 * 3. Guest mode → Continue without auth
 * 
 * @module lib/auth
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User } from '../contexts/AuthContextTypes'
import { logAuthError, trackAuthSuccess, trackAuthFailure, authMetrics } from './authLogger'

// Backend API URL
const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-8d00b.up.railway.app'

/**
 * Auth state interface
 */
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  checkSession: () => Promise<User | null>
  exchangeToken: (token: string) => Promise<User | null>
  logout: () => void
}

/**
 * Auth Store - Single source of truth
 * Using Zustand for atomic updates and React integration
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      loading: true,
      error: null,

      // Set user
      setUser: (user: User | null) => {
        set({ user, loading: false, error: null })
      },

      // Set loading
      setLoading: (loading: boolean) => {
        set({ loading })
      },

      // Set error
      setError: (error: string | null) => {
        set({ error, loading: false })
      },

      // Check session with cookie
      checkSession: async (): Promise<User | null> => {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            credentials: 'include', // Send cookies
            headers: {
              'Accept': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            const user = data.success ? (data.data?.user || data.data) : data.user
            
            if (user) {
              get().setUser(user)
              trackAuthSuccess(user.id, 'cookie')
              authMetrics.recordSuccess()
              return user
            }
          }
          
          // No active session - not an error, just guest mode
          get().setUser(null)
          return null
        } catch (error) {
          // Log and track errors
          const errorMessage = error instanceof Error ? error.message : 'Network error'
          logAuthError('Session check failed', { error: errorMessage })
          trackAuthFailure(errorMessage, { method: 'cookie' })
          authMetrics.recordFailure()
          
          get().setError(errorMessage)
          get().setUser(null)
          return null
        }
      },

      // Exchange token for session
      exchangeToken: async (token: string): Promise<User | null> => {
        try {
          // Exchange token for cookie
          const exchangeResponse = await fetch(`${API_URL}/api/auth/exchange-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ token }),
          })

          if (!exchangeResponse.ok) {
            throw new Error('Token exchange failed')
          }

          // Verify session was set
          const user = await get().checkSession()
          if (user) {
            trackAuthSuccess(user.id, 'token')
            authMetrics.recordSuccess()
          }
          return user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Token exchange failed'
          logAuthError('Token exchange failed', { error: errorMessage })
          trackAuthFailure(errorMessage, { method: 'token' })
          authMetrics.recordFailure()
          
          get().setError('Invalid authentication token')
          get().setUser(null)
          return null
        }
      },

      // Logout
      logout: () => {
        set({ user: null, loading: false, error: null })
      },
    }),
    { name: 'AuthStore' }
  )
)

/**
 * Initialize authentication
 * Called once on app load
 */
async function initializeAuth(): Promise<void> {
  const { setLoading, checkSession, exchangeToken, setUser } = useAuthStore.getState()

  try {
    setLoading(true)

    // 1. Check for cookie (fast path)
    const hasCookie = document.cookie.includes('upswitch_session')

    if (hasCookie) {
      await checkSession()
      return
    }

    // 2. Check for token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      await exchangeToken(token)
      // Clean URL after token exchange
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      return
    }

    // 3. Guest mode (no cookie, no token)
    setUser(null)
  } catch (error) {
    console.error('[Auth] Initialization failed:', error)
    setUser(null) // Continue as guest on error
  }
}

// Initialize on module load (browser only)
if (typeof window !== 'undefined') {
  initializeAuth()
}

/**
 * Helper to compute business card from user
 */
function getIndustry(user: User): string {
  if (user.industry) return user.industry
  
  const businessTypeToIndustry: Record<string, string> = {
    restaurant: 'hospitality',
    saas: 'technology',
    software: 'technology',
    ecommerce: 'retail',
    retail: 'retail',
    consulting: 'services',
    // Add more mappings as needed
  }
  
  return businessTypeToIndustry[user.business_type?.toLowerCase() || ''] || 'services'
}

function parseEmployeeCount(range?: string): number | undefined {
  if (!range) return undefined
  const match = range.match(/(\d+)-(\d+)/)
  if (match) {
    return Math.floor((parseInt(match[1]) + parseInt(match[2])) / 2)
  }
  return undefined
}

/**
 * Simple auth hook
 * Use this instead of useAuthStore directly
 * Provides backward compatible API
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const checkSession = useAuthStore((state) => state.checkSession)
  const exchangeToken = useAuthStore((state) => state.exchangeToken)
  const logout = useAuthStore((state) => state.logout)

  // Compute business card from user
  const businessCard = user && (user.company_name || user.business_type || user.industry)
    ? {
        company_name: user.company_name || 'Your Company',
        industry: getIndustry(user),
        business_model: user.business_type || 'other',
        founding_year: user.founded_year || new Date().getFullYear() - (user.years_in_operation || 5),
        country_code: user.country || 'BE',
        employee_count: parseEmployeeCount(user.employee_count_range),
      }
    : null

  return {
    user,
    loading,
    isLoading: loading, // Backward compatible alias
    error,
    isAuthenticated: user !== null,
    businessCard,
    checkSession,
    exchangeToken,
    logout,
    refreshAuth: checkSession, // Alias for compatibility
    cookieHealth: null, // Removed complexity, always null
  }
}
