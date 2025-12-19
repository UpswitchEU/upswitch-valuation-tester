/**
 * Authentication Context for Valuation Tester
 *
 * Handles cross-domain authentication via token exchange
 * Integrates with main platform (upswitch.biz) authentication
 */

'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { backendAPI } from '../services/backendApi'
import { useGuestSessionStore } from '../store/useGuestSessionStore'
import { getAuthCache } from '../utils/auth/authCache'
import { checkCookieHealth, CookieHealthStatus } from '../utils/auth/cookieHealth'
import { getCookieMonitor } from '../utils/auth/cookieMonitor'
import { classifyAuthError, isRetryableAuthError, RecoveryStrategy } from '../utils/auth/errorRecovery'
import { getSessionSyncManager } from '../utils/auth/sessionSync'
import { CircuitBreaker } from '../utils/circuitBreaker'
import { authLogger } from '../utils/logger'
import { deduplicateRequest } from '../utils/requestDeduplication'
import { retryWithBackoff } from '../utils/retryWithBackoff'
import { AuthContext, AuthContextType, User } from './AuthContextTypes'

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

// Backend URL for authentication (Node.js backend, not the valuation tester itself)
const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-8d00b.up.railway.app'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert employee_count_range string to approximate number
 * Examples: "1-10" -> 5, "11-50" -> 30, "51-200" -> 125
 */
const parseEmployeeCount = (range?: string): number | undefined => {
  if (!range) return undefined

  // Handle common range formats
  const rangeMatch = range.match(/(\d+)-(\d+)/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    // Return middle of range
    return Math.floor((min + max) / 2)
  }

  // Handle "200+" or "500+" formats
  const plusMatch = range.match(/(\d+)\+/)
  if (plusMatch) {
    return parseInt(plusMatch[1], 10)
  }

  // Try to parse as direct number
  const directNumber = parseInt(range, 10)
  if (!isNaN(directNumber)) {
    return directNumber
  }

  return undefined
}

// =============================================================================
// PROVIDER
// =============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cookieHealth, setCookieHealth] = useState<CookieHealthStatus | null>(null)
  
  // Circuit breaker for auth operations
  const authCircuitBreaker = useRef(
    new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      successThreshold: 2,
      name: 'AuthAPI',
    })
  ).current

  // Helper to map business_type to industry category if industry is not set
  const getIndustry = useCallback((user: User): string | undefined => {
    if (user.industry) return user.industry

    // Map common business types to industry categories
    // This ensures pre-fill works even if user only set business_type
    const businessTypeToIndustry: Record<string, string> = {
      // Food & Beverage
      chef: 'services',
      catering: 'services',
      restaurant: 'hospitality',
      meals: 'services',

      // Beauty & Wellness
      hairstyling: 'services',
      makeup: 'services',
      massage: 'services',
      nailcare: 'services',
      wellness: 'services',

      // Fitness & Health
      personaltraining: 'services',
      gym: 'services',
      healthcare: 'healthcare',

      // Creative & Media
      photography: 'services',
      videography: 'services',
      design: 'services',
      marketing: 'services',

      // Tech & Digital
      saas: 'technology',
      software: 'technology',
      webdev: 'technology',
      itsupport: 'technology',
      b2b_saas: 'technology',

      // E-commerce & Retail
      ecommerce: 'retail',
      retail: 'retail',
      subscription: 'retail',

      // Home & Property
      cleaning: 'services',
      realestate: 'real_estate',
      construction: 'construction',
      landscaping: 'services',

      // Professional Services
      consulting: 'services',
      legal: 'services',
      accounting: 'services',
      hr: 'services',

      // Education & Training
      education: 'services',
      coaching: 'services',

      // Transportation & Logistics
      logistics: 'services',
      automotive: 'services',

      // Events & Entertainment
      events: 'services',
      entertainment: 'services',

      // Legacy types
      manufacturing: 'manufacturing',
      marketplace: 'technology',
      b2c: 'retail',
    }

    const mapped = businessTypeToIndustry[user.business_type?.toLowerCase() || '']
    return mapped || 'services' // Default to services if no mapping found
  }, [])

  // Compute business card data from user
  const businessCard = React.useMemo(() => {
    if (!user) {
      authLogger.info('No business card: continuing as guest user')
      return null
    }

    // Check if user has any business profile data
    const hasBusinessData = user.company_name || user.business_type || user.industry
    if (!hasBusinessData) {
      authLogger.warn('No business card: no business profile data', {
        hasUser: !!user,
        companyName: user?.company_name,
        businessType: user?.business_type,
        industry: user?.industry,
        allUserKeys: user ? Object.keys(user) : [],
        fullUserObject: user,
      })
      return null
    }

    const card = {
      company_name: user.company_name || 'Your Company', // Fallback if missing
      industry: getIndustry(user) || 'services',
      business_model: user.business_type || 'other',
      founding_year: user.founded_year || new Date().getFullYear() - (user.years_in_operation || 5),
      country_code: user.country || 'BE', // Already a 2-letter code (BE, NL, etc.)
      employee_count: parseEmployeeCount(user.employee_count_range),
    }

    authLogger.debug('Business card computed', { card })
    return card
  }, [user, getIndustry])

  /**
   * Check for existing session with retry logic, circuit breaker, caching, and deduplication
   *
   * SILENT BY DEFAULT: This function is called optimistically to check if
   * there's an existing auth session. 401/404 responses are EXPECTED for guest
   * users and should not be treated as errors.
   * 
   * @returns User data if authenticated, null otherwise
   */
  const checkSession = useCallback(async (): Promise<User | null> => {
    const cache = getAuthCache()
    const cacheKey = 'session_check'
    
    // Check cache first
    const cached = cache.get()
    if (cached && cached.user) {
      authLogger.debug('✅ Using cached auth result')
      setUser(cached.user)
      return cached.user
    }
    
    try {
      authLogger.debug('🔍 Checking session cookie...', {
        apiUrl: API_URL,
        endpoint: `${API_URL}/api/auth/me`,
        credentials: 'include',
      })
      
      // Deduplicate concurrent requests
      const response = await deduplicateRequest(cacheKey, async () => {
        return await authCircuitBreaker.execute(async () => {
          return await retryWithBackoff(
            async () => {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout
              
              try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                  method: 'GET',
                  credentials: 'include',
                  signal: controller.signal,
                })
                clearTimeout(timeoutId)
                return res
              } catch (error: any) {
                clearTimeout(timeoutId)
                // Check if error is retryable
                if (isRetryableAuthError(error)) {
                  throw error // Retry will handle it
                }
                throw error
              }
            },
            {
              maxRetries: 3,
              initialDelay: 100,
              maxDelay: 1000,
              onRetry: (attempt, error, delay) => {
                authLogger.debug('Retrying session check', {
                  attempt,
                  delay,
                  error: error.message,
                })
              },
            }
          )
        })
      })
      
      authLogger.debug('📡 Session check response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      })
      
      // Log cookie information for debugging
      if (typeof document !== 'undefined') {
        authLogger.debug('🍪 Document cookies:', {
          allCookies: document.cookie,
          hasUpswitchSession: document.cookie.includes('upswitch_session'),
        })
      }

      if (response.ok) {
        const data = await response.json()

        authLogger.debug('Session response', { data })
        authLogger.debug('Session response structure', {
          success: data.success,
          hasData: !!data.data,
          hasUser: !!data.user,
          dataKeys: data.data ? Object.keys(data.data) : [],
          userKeys: data.user ? Object.keys(data.user) : [],
        })

        let userData: User | null = null

        if (data.success && data.data) {
          // Check if user data is nested in data.data.user
          userData = data.data.user || data.data

          if (userData) {
            authLogger.debug('User data fields (data.data)', {
              id: userData.id,
              email: userData.email,
              company_name: userData.company_name,
              business_type: userData.business_type,
              industry: userData.industry,
              founded_year: userData.founded_year,
              employee_count_range: userData.employee_count_range,
              country: userData.country,
            })
            authLogger.debug('Full user object (data.data)', { userData: data.data })
            setUser(userData)
            
            // Cache successful auth result
            cache.set(userData, userData.id)
            
            // Broadcast session update
            const syncManager = getSessionSyncManager()
            syncManager.broadcastSessionUpdate(window.location.hostname, userData.id)
            
            authLogger.info('Existing session found (data.data)', { userData })
          }
        } else if (data.success && data.user) {
          // Alternative response format
          userData = data.user
          authLogger.debug('User data fields (data.user)', {
            id: data.user.id,
            email: data.user.email,
            company_name: data.user.company_name,
            business_type: data.user.business_type,
            industry: data.user.industry,
            founded_year: data.user.founded_year,
            employee_count_range: data.user.employee_count_range,
            country: data.user.country,
          })
          setUser(data.user)
          
          // Cache successful auth result
          cache.set(data.user, data.user.id)
          
          // Broadcast session update
          const syncManager = getSessionSyncManager()
          syncManager.broadcastSessionUpdate(window.location.hostname, data.user.id)
          
          authLogger.info('Existing session found (data.user)', { userData: data.user })
        } else {
          authLogger.debug('No existing session - response', { data })
          setUser(null)
        }
        
        return userData
      } else if (response.status === 404 || response.status === 401) {
        // EXPECTED: No session exists (guest user or not authenticated)
        // This is NOT an error - it's the normal guest flow
        authLogger.debug('No active session (expected for guests)')
        setUser(null)
        return null
      } else {
        // Unexpected status code - classify error
        const error = new Error(`Unexpected status: ${response.status}`)
        const classified = classifyAuthError(error)
        
        if (classified.recoveryStrategy === RecoveryStrategy.CONTINUE_AS_GUEST) {
          authLogger.debug('Unexpected session check response, continuing as guest', {
            status: response.status,
            errorType: classified.type,
          })
          setUser(null)
          return null
        }
        
        throw error
      }
    } catch (err) {
      // Classify error and handle appropriately
      const classified = classifyAuthError(err)
      
      authLogger.debug('Session check failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        errorType: classified.type,
        retryable: classified.retryable,
        recoveryStrategy: classified.recoveryStrategy,
      })
      
      // For guest flow, continue silently
      if (classified.recoveryStrategy === RecoveryStrategy.CONTINUE_AS_GUEST) {
        setUser(null)
        return null
      }
      
      // For other errors, log but continue as guest
      setUser(null)
      return null
    }
  }, [authCircuitBreaker])

  /**
   * Exchange subdomain token for session cookie
   * Wrapped in useCallback to prevent stale closures in initAuth
   */
  const exchangeToken = useCallback(async (token: string) => {
    try {
      authLogger.debug('Attempting token exchange', {
        apiUrl: API_URL,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
      })

      const response = await fetch(`${API_URL}/api/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Critical for cookies
        body: JSON.stringify({ token }),
      })

      authLogger.debug('Token exchange response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        let errorMessage = 'Token exchange failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage

          // Log specific error for debugging
          if (response.status === 401) {
            authLogger.error('Token validation failed - token may be expired or already used', {
              status: 401,
              error: errorData.error,
            })
          }

          authLogger.error('Token exchange API error', {
            status: response.status,
            error: errorData.error,
            timestamp: errorData.timestamp,
          })
        } catch (parseError) {
          authLogger.error('Failed to parse error response', { parseError })
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      authLogger.debug('Token exchange response data', { success: data.success })

      if (data.success && data.data) {
        // Handle nested user structure (data.data.user or data.data)
        const userData = data.data.user || data.data
        setUser(userData)
        authLogger.info('User state updated', {
          userId: userData.id,
          email: userData.email,
          name: userData.name,
        })
        authLogger.info('Authentication successful via token exchange', { email: userData.email })
        authLogger.debug('Token exchange - user data', {
          id: userData.id,
          email: userData.email,
          company_name: userData.company_name,
          business_type: userData.business_type,
          industry: userData.industry,
        })

        // Migrate guest session data to authenticated user
        try {
          const { getSessionId, clearSession } = useGuestSessionStore.getState()
          const guestSessionId = getSessionId()
          if (guestSessionId) {
            authLogger.info('Attempting to migrate guest data', { guestSessionId })

            const migrationResult = await backendAPI.migrateGuestData(guestSessionId)

            authLogger.info('Guest data migration completed', {
              migratedReports: migrationResult.migratedReports,
              migratedSessions: migrationResult.migratedSessions,
              hasErrors: migrationResult.errors && migrationResult.errors.length > 0,
            })

            // Clear guest session after successful migration (uses Zustand store)
            clearSession()
            authLogger.info('Guest session cleared after migration')
          } else {
            authLogger.info('No guest session to migrate')
          }

          // Ensure authenticated user has a session (for API tracking consistency)
          // Authenticated users also need session IDs for backend tracking
          const { ensureSession } = useGuestSessionStore.getState()
          try {
            const authenticatedSessionId = await ensureSession()
            authLogger.info('Authenticated session ensured', {
              session_id: authenticatedSessionId
                ? authenticatedSessionId.substring(0, 15) + '...'
                : null,
            })
          } catch (sessionError) {
            // Don't fail authentication if session creation fails
            authLogger.warn(
              'Failed to ensure authenticated session, but authentication succeeded',
              {
                error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
              }
            )
            // Continue - backend will use user_id from auth cookie if session fails
          }
        } catch (migrationError) {
          // Don't fail authentication if migration fails
          authLogger.warn('Guest data migration failed, but authentication succeeded', {
            error: migrationError instanceof Error ? migrationError.message : 'Unknown error',
          })
          // Continue with authentication - user can still use the app

          // Still try to ensure session even if migration failed
          try {
            const { ensureSession } = useGuestSessionStore.getState()
            await ensureSession()
          } catch (sessionError) {
            authLogger.warn('Failed to ensure authenticated session', {
              error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
            })
          }
        }
      } else {
        throw new Error('Invalid response from token exchange')
      }
    } catch (err) {
      authLogger.error('Token exchange error', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      })
      // Don't set error state - let the app continue as guest
      throw err
    }
  }, []) // Empty deps: setUser is stable, API_URL is constant

  /**
   * Initialize authentication flow
   * Priority-based approach for seamless cross-subdomain auth
   *
   * PRIORITY ORDER (Industry Best Practice - Airbnb/Stripe Pattern):
   * 1. Check cookie health (fast detection)
   * 2. Check for existing cookie (seamless - fastest, no URL manipulation)
   * 3. Check for token in URL (fallback - for new windows or cookie failures)
   * 4. Continue as guest (always works)
   *
   * This ensures users logged into upswitch.biz are automatically
   * authenticated on valuation.upswitch.biz without requiring a token.
   */
  const initAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // PRIORITY 0: Check cookie health (fast path detection)
      authLogger.info('🔍 [Priority 0] Checking cookie health...')
      try {
        const health = await checkCookieHealth()
        setCookieHealth(health)
        
        authLogger.debug('Cookie health check result', {
          accessible: health.accessible,
          blocked: health.blocked,
          needsToken: health.needsToken,
          browser: health.browser,
          reason: health.reason,
        })
        
        if (health.blocked && health.needsToken) {
          authLogger.info('⚠️ [Priority 0] Cookies blocked, will use token fallback')
        }
      } catch (healthError) {
        authLogger.debug('Cookie health check failed, continuing', {
          error: healthError instanceof Error ? healthError.message : 'Unknown error',
        })
      }

      // PRIORITY 1: Check for existing session cookie (SEAMLESS AUTH)
      // This is the fastest path and provides the best UX
      // Works when user is already logged into upswitch.biz
      authLogger.info('🔍 [Priority 1] Checking for existing session cookie...')
      let cookieAuthFailed = false
      let cookieErrorDetails: any = null
      
      try {
        const authenticatedUser = await checkSession()

        if (authenticatedUser) {
          authLogger.info('✅ [Priority 1] Authenticated via cookie - seamless!', {
            userId: authenticatedUser.id,
            email: authenticatedUser.email,
          })
          
          // Ensure authenticated user has a guest session (for API tracking consistency)
          const { ensureSession } = useGuestSessionStore.getState()
          try {
            await ensureSession()
          } catch (sessionError) {
            // Silent failure - don't block auth flow
            authLogger.debug('Failed to ensure authenticated session', {
              error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
            })
          }
          setIsLoading(false)
          return
        }
        
        authLogger.debug('ℹ️ [Priority 1] No cookie session found (expected for guests)')
        cookieAuthFailed = true
      } catch (cookieError: any) {
        cookieAuthFailed = true
        cookieErrorDetails = cookieError
        // Classify error and handle appropriately
        const classified = classifyAuthError(cookieError)
        
        authLogger.debug('ℹ️ [Priority 1] Cookie auth check failed', {
          error: cookieError instanceof Error ? cookieError.message : 'Unknown error',
          errorType: classified.type,
          recoveryStrategy: classified.recoveryStrategy,
          responseStatus: cookieError?.response?.status,
          responseData: cookieError?.response?.data,
        })
        
        // Log additional debugging info for cookie issues
        if (cookieError?.response?.status === 401 || cookieError?.response?.status === 403) {
          authLogger.warn('⚠️ [Priority 1] Auth check returned 401/403 - cookie may not be shared across subdomains', {
            status: cookieError.response.status,
            origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
            apiUrl: API_URL,
            hint: 'If user is logged in on upswitch.biz, they should navigate via the main site to get a token',
          })
        }
        
        // If cookies are blocked, skip to token exchange
        if (classified.recoveryStrategy === RecoveryStrategy.FALLBACK_TO_TOKEN) {
          authLogger.info('ℹ️ [Priority 1] Cookies blocked, skipping to token exchange')
        }
      }

      // PRIORITY 2: Check for token in URL (FALLBACK AUTH)
      // Used when user clicks link from upswitch.biz or cookie auth fails
      authLogger.info('🔍 [Priority 2] Checking for token in URL...')
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (token) {
        authLogger.info('✅ [Priority 2] Token found in URL - exchanging for session')

        // Remove token from URL immediately to prevent multiple attempts
        const newUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, newUrl)

        try {
          await exchangeToken(token)
          authLogger.info('✅ [Priority 2] Token exchange complete - user authenticated')
          setIsLoading(false)
          return
        } catch (tokenError) {
          authLogger.error('❌ [Priority 2] Token exchange failed', {
            error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
          })
          // Don't set error state for token exchange failures - continue as guest
          authLogger.info('ℹ️ [Priority 2] Continuing as guest after token exchange failure')
        }
      } else {
        authLogger.debug('ℹ️ [Priority 2] No token in URL')
        
        // If cookie auth failed and no token, provide helpful message
        if (cookieAuthFailed) {
          authLogger.info('💡 [Priority 2] Tip: Navigate to valuation.upswitch.biz from upswitch.biz to get automatic authentication')
          
          // Log detailed debugging info for troubleshooting
          authLogger.debug('🔍 [Priority 2] Cookie auth debugging info', {
            cookieError: cookieErrorDetails ? {
              message: cookieErrorDetails instanceof Error ? cookieErrorDetails.message : String(cookieErrorDetails),
              status: cookieErrorDetails?.response?.status,
              statusText: cookieErrorDetails?.response?.statusText,
            } : null,
            documentCookies: typeof document !== 'undefined' ? document.cookie : 'N/A',
            hasUpswitchSessionCookie: typeof document !== 'undefined' ? document.cookie.includes('upswitch_session') : false,
            currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
            apiUrl: API_URL,
            recommendation: 'To authenticate: 1) Go to upswitch.biz, 2) Click link to valuation tool, 3) Token will be auto-generated',
          })
        }
      }

      // PRIORITY 3: Continue as guest (ALWAYS WORKS)
      authLogger.info('🔍 [Priority 3] Initializing guest session...')
      const { getSessionId, initializeSession } = useGuestSessionStore.getState()
      const existingGuestSession = getSessionId()

      if (!existingGuestSession) {
        // No guest session - initialize new one
        authLogger.info('ℹ️ [Priority 3] Creating new guest session')
        try {
          const sessionId = await initializeSession()
          authLogger.info('✅ [Priority 3] Guest session initialized', {
            session_id: sessionId ? sessionId.substring(0, 15) + '...' : null,
          })
        } catch (guestError) {
          authLogger.warn('⚠️ [Priority 3] Failed to initialize guest session', {
            error: guestError instanceof Error ? guestError.message : 'Unknown error',
          })
          // Continue anyway - guest session is not critical
        }
      } else {
        // Existing guest session - verify validity
        authLogger.info('✅ [Priority 3] Using existing guest session', {
          guestSessionId: existingGuestSession.substring(0, 15) + '...',
        })
        try {
          // This will return immediately if session expires in >1 hour (trusts localStorage)
          const sessionId = await initializeSession()
          authLogger.debug('✅ [Priority 3] Guest session verified', {
            session_id: sessionId ? sessionId.substring(0, 15) + '...' : null,
          })
        } catch (guestError) {
          authLogger.warn('⚠️ [Priority 3] Failed to verify guest session', {
            error: guestError instanceof Error ? guestError.message : 'Unknown error',
          })
          // Continue anyway - session will be recreated on next API call if needed
        }
      }
    } catch (err) {
      authLogger.error('❌ Auth initialization error', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError('Failed to initialize authentication')
    } finally {
      setIsLoading(false)
    }
  }, [checkSession, exchangeToken]) // Fixed: Removed user dependency, using return value from checkSession

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    initAuth()
    
    // Start cookie monitoring
    const cookieMonitor = getCookieMonitor({
      onCookieBlocked: (health) => {
        authLogger.warn('Cookies blocked', { health })
        setCookieHealth(health)
      },
      onCookieRestored: (health) => {
        authLogger.info('Cookies restored', { health })
        setCookieHealth(health)
        // Retry auth check when cookies are restored
        checkSession()
      },
      onHealthChange: (health) => {
        setCookieHealth(health)
      },
    })
    cookieMonitor.start()
    
    // Set up session synchronization
    const syncManager = getSessionSyncManager()
    const unsubscribe = syncManager.onSessionSync((message) => {
      authLogger.info('Session sync event received', { message })
      
      if (message.type === 'SESSION_UPDATED' || message.type === 'SESSION_REFRESHED') {
        // Refresh auth state when session is updated in another tab
        checkSession()
      } else if (message.type === 'SESSION_INVALIDATED') {
        // Clear user state when session is invalidated
        setUser(null)
        const cache = getAuthCache()
        cache.clear()
      }
    })
    
    return () => {
      cookieMonitor.stop()
      unsubscribe()
    }
  }, [initAuth, checkSession])

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    await checkSession()
    setIsLoading(false)
  }, [checkSession])

  /**
   * Listen for authentication events from parent window
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = ['https://upswitch.biz', 'http://localhost:5173']

      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      if (event.data.type === 'AUTH_REFRESH') {
        authLogger.info('Auth refresh requested by parent window')
        refreshAuth()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [refreshAuth])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    refreshAuth,
    businessCard,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
