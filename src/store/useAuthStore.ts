/**
 * Auth Store (Zustand) - World-Class Cross-Subdomain Authentication Engine
 * 
 * Single source of truth for authentication state.
 * Uses Zustand's atomic updates and promise caching to prevent race conditions.
 * 
 * Architecture:
 * - Priority 0: Cookie health detection (browser compatibility check)
 * - Priority 1: Cookie authentication (seamless cross-subdomain from upswitch.biz)
 * - Priority 2: Token exchange (fallback when cookies blocked)
 * - Priority 3: Guest mode (always works)
 * 
 * Features:
 * - Atomic state updates (no race conditions via Zustand)
 * - Promise cache prevents concurrent initAuth calls
 * - Async-first operations (non-blocking, smooth UX)
 * - Cross-tab synchronization via BroadcastChannel
 * - Cookie health monitoring integration
 * - Comprehensive logging for testing and debugging
 * - Background token refresh (proactive, 5min intervals + tab focus)
 * - Error recovery with exponential backoff
 * 
 * Cross-Subdomain Cookie Flow:
 * 1. User logs into upswitch.biz → Cookie set with domain: '.upswitch.biz'
 * 2. User navigates to valuation.upswitch.biz → Cookie automatically sent
 * 3. /api/auth/me validates cookie → User authenticated seamlessly
 * 4. If cookies blocked → Token exchange fallback (Priority 2)
 * 
 * Pattern: Follows useGuestSessionStore promise cache pattern for consistency
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '../contexts/AuthContextTypes'
import { backendAPI } from '../services/backendApi'
import { getAuthCache } from '../utils/auth/authCache'
import { checkCookieHealth, CookieHealthStatus } from '../utils/auth/cookieHealth'
import { AuthErrorType, classifyAuthError, isRetryableAuthError, RecoveryStrategy } from '../utils/auth/errorRecovery'
import { getSessionSyncManager } from '../utils/auth/sessionSync'
import { CircuitBreaker } from '../utils/circuitBreaker'
import { authLogger } from '../utils/logger'
import { retryWithBackoff } from '../utils/retryWithBackoff'
import { useGuestSessionStore } from './useGuestSessionStore'

// Background refresh interval (5 minutes)
const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000

// Backend URL for authentication
const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-8d00b.up.railway.app'

// Circuit breaker for auth operations
const authCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
  name: 'AuthAPI',
})

/**
 * Convert employee_count_range string to approximate number
 */
const parseEmployeeCount = (range?: string): number | undefined => {
  if (!range) return undefined
  const rangeMatch = range.match(/(\d+)-(\d+)/)
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10)
    const max = parseInt(rangeMatch[2], 10)
    return Math.floor((min + max) / 2)
  }
  const plusMatch = range.match(/(\d+)\+/)
  if (plusMatch) {
    return parseInt(plusMatch[1], 10)
  }
  const directNumber = parseInt(range, 10)
  if (!isNaN(directNumber)) {
    return directNumber
  }
  return undefined
}

interface AuthStore {
  // State
  user: User | null
  isLoading: boolean
  error: string | null
  cookieHealth: CookieHealthStatus | null
  initializationPromise: Promise<void> | null
  backgroundRefreshInterval: NodeJS.Timeout | null
  visibilityHandler: ((e: Event) => void) | null
  
  // Actions
  initAuth: () => Promise<void>
  checkSession: () => Promise<User | null>
  refreshAuth: () => Promise<void>
  exchangeToken: (token: string) => Promise<void>
  setUser: (user: User | null) => void
  setError: (error: string | null) => void
  setCookieHealth: (health: CookieHealthStatus | null) => void
  reset: () => void
  startBackgroundRefresh: () => void
  stopBackgroundRefresh: () => void
}

/**
 * Helper to map business_type to industry category if industry is not set
 */
const getIndustry = (user: User): string | undefined => {
  if (user.industry) return user.industry

  const businessTypeToIndustry: Record<string, string> = {
    chef: 'services',
    catering: 'services',
    restaurant: 'hospitality',
    meals: 'services',
    hairstyling: 'services',
    makeup: 'services',
    massage: 'services',
    nailcare: 'services',
    wellness: 'services',
    personaltraining: 'services',
    gym: 'services',
    healthcare: 'healthcare',
    photography: 'services',
    videography: 'services',
    design: 'services',
    marketing: 'services',
    saas: 'technology',
    software: 'technology',
    webdev: 'technology',
    itsupport: 'technology',
    b2b_saas: 'technology',
    ecommerce: 'retail',
    retail: 'retail',
    subscription: 'retail',
    cleaning: 'services',
    realestate: 'real_estate',
    construction: 'construction',
    landscaping: 'services',
    consulting: 'services',
    legal: 'services',
    accounting: 'services',
    hr: 'services',
    education: 'services',
    coaching: 'services',
    logistics: 'services',
    automotive: 'services',
    events: 'services',
    entertainment: 'services',
    manufacturing: 'manufacturing',
    marketplace: 'technology',
    b2c: 'retail',
  }

  const mapped = businessTypeToIndustry[user.business_type?.toLowerCase() || '']
  return mapped || 'services'
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: true,
      error: null,
      cookieHealth: null,
      initializationPromise: null,
      backgroundRefreshInterval: null,
      visibilityHandler: null as ((e: Event) => void) | null,

      // Computed properties are accessed via selectors (not getters)

      /**
       * Set user atomically
       * Optimistic update: updates UI immediately for smooth UX
       */
      setUser: (user: User | null) => {
        // Optimistic update: set user immediately
        set((state) => ({
          ...state,
          user,
          isLoading: false,
          error: null,
        }))
        
        // Cache successful auth result
        if (user) {
          const cache = getAuthCache()
          cache.set(user, user.id)
          
          // Broadcast session update (non-blocking)
          const syncManager = getSessionSyncManager()
          syncManager.broadcastSessionUpdate(
            typeof window !== 'undefined' ? window.location.hostname : 'unknown',
            user.id
          )
          
          // Start background refresh if not already running
          if (typeof window !== 'undefined') {
            // Use setTimeout to avoid blocking
            setTimeout(() => {
              get().startBackgroundRefresh()
            }, 0)
          }
        } else {
          // Stop background refresh when user logs out
          get().stopBackgroundRefresh()
        }
      },

      /**
       * Set error atomically
       */
      setError: (error: string | null) => {
        set((state) => ({
          ...state,
          error,
          isLoading: false,
        }))
      },

      /**
       * Set cookie health atomically
       */
      setCookieHealth: (health: CookieHealthStatus | null) => {
        set((state) => ({
          ...state,
          cookieHealth: health,
        }))
      },

      /**
       * Reset auth state atomically
       */
      reset: () => {
        // Stop background refresh
        get().stopBackgroundRefresh()
        
        set({
          user: null,
          isLoading: false,
          error: null,
          cookieHealth: null,
          initializationPromise: null,
          backgroundRefreshInterval: null,
          visibilityHandler: null,
        })
        
        const cache = getAuthCache()
        cache.clear()
      },

      /**
       * Start background token refresh (proactive, non-blocking)
       */
      startBackgroundRefresh: () => {
        const state = get()
        
        // Don't start if already running or no user
        if (state.backgroundRefreshInterval || !state.user) {
          return
        }
        
        authLogger.debug('🔄 [BackgroundRefresh] Starting background refresh')
        
        // Refresh on interval
        const interval = setInterval(async () => {
          const currentState = get()
          // Only refresh if user is authenticated and not currently loading
          if (currentState.user && !currentState.isLoading && !currentState.initializationPromise) {
            authLogger.debug('🔄 [BackgroundRefresh] Proactive refresh triggered')
            try {
              await get().refreshAuth()
            } catch (error) {
              authLogger.debug('🔄 [BackgroundRefresh] Refresh failed, will retry', {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        }, BACKGROUND_REFRESH_INTERVAL)
        
        // Refresh on tab focus (visibilitychange)
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            const currentState = get()
            if (currentState.user && !currentState.isLoading && !currentState.initializationPromise) {
              authLogger.debug('🔄 [BackgroundRefresh] Tab focused, refreshing')
              // Small delay to avoid race conditions
              setTimeout(() => {
                get().refreshAuth().catch(() => {
                  // Silent failure - background refresh shouldn't block
                })
              }, 500)
            }
          }
        }
        
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', handleVisibilityChange)
        }
        
        set((state) => ({
          ...state,
          backgroundRefreshInterval: interval as any,
          visibilityHandler: handleVisibilityChange as any,
        }))
      },

      /**
       * Stop background token refresh
       */
      stopBackgroundRefresh: () => {
        const state = get()
        
        if (state.backgroundRefreshInterval) {
          clearInterval(state.backgroundRefreshInterval)
          authLogger.debug('🔄 [BackgroundRefresh] Stopped background refresh')
        }
        
        if (state.visibilityHandler && typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', state.visibilityHandler)
        }
        
        set((state) => ({
          ...state,
          backgroundRefreshInterval: null,
          visibilityHandler: null,
        }))
      },

      /**
       * Check for existing session
       * No deduplication - Zustand handles concurrency via promise cache
       */
      checkSession: async (): Promise<User | null> => {
        const cache = getAuthCache()
        
        // Check cache first
        const cached = cache.get()
        if (cached && cached.user) {
          authLogger.debug('✅ Using cached auth result')
          get().setUser(cached.user)
          return cached.user
        }
        
        // Enhanced cookie detection before making request (comprehensive logging for testing)
        let cookieDiagnostics: any = {}
        if (typeof document !== 'undefined') {
          const allCookies = document.cookie
          const hasUpswitchSession = allCookies.includes('upswitch_session')
          const hostname = window.location.hostname
          const isSubdomain = hostname.includes('.') && hostname !== 'localhost'
          const isMainDomain = hostname === 'upswitch.biz'
          const isValuationSubdomain = hostname === 'valuation.upswitch.biz'
          
          // Parse cookies to check for upswitch_session specifically
          const cookiePairs = allCookies.split(';').map(c => c.trim())
          const upswitchSessionCookie = cookiePairs.find(c => c.startsWith('upswitch_session='))
          
          cookieDiagnostics = {
            documentCookies: allCookies || 'none',
            hasUpswitchSessionCookie: hasUpswitchSession,
            upswitchSessionCookieValue: upswitchSessionCookie ? upswitchSessionCookie.substring(0, 50) + '...' : 'not found',
            currentOrigin: window.location.origin,
            hostname,
            isSubdomain,
            isMainDomain,
            isValuationSubdomain,
            apiUrl: API_URL,
            cookieCount: cookiePairs.length,
            timestamp: new Date().toISOString(),
          }
          
          authLogger.info('🍪 [CookieDetection] Comprehensive cookie diagnostics', cookieDiagnostics)
          
          // Log specific cross-subdomain cookie detection
          if (isValuationSubdomain && hasUpswitchSession) {
            authLogger.info('✅ [CookieDetection] Cross-subdomain cookie detected! Cookie from main domain is accessible', {
              hostname,
              cookieFound: true,
              cookieValue: upswitchSessionCookie ? 'present' : 'missing',
            })
          } else if (isValuationSubdomain && !hasUpswitchSession) {
            authLogger.warn('⚠️ [CookieDetection] No cookie found on subdomain - will try token exchange', {
              hostname,
              cookieFound: false,
              reason: 'Cookie may not be shared or user not logged in',
            })
          }
        }
        
        try {
          authLogger.info('🔍 [AuthFlow] Checking session cookie (Priority 1)', {
            apiUrl: API_URL,
            endpoint: `${API_URL}/api/auth/me`,
            credentials: 'include',
            method: 'GET',
            flowStep: 'cookie-check',
            ...cookieDiagnostics,
          })
          
          // No deduplication - Zustand atomic updates handle concurrency
          const response = await authCircuitBreaker.execute(async () => {
            return await retryWithBackoff(
              async () => {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 3000)
                
                try {
                  const res = await fetch(`${API_URL}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                    signal: controller.signal,
                    headers: {
                      'Accept': 'application/json',
                    },
                  })
                  clearTimeout(timeoutId)
                  
                  // Extract cookie-related headers for debugging
                  const responseHeaders = Object.fromEntries(res.headers.entries())
                  const setCookieHeader = res.headers.get('set-cookie')
                  const authStatus = res.headers.get('x-auth-status')
                  const cookieDomain = res.headers.get('x-cookie-domain')
                  
                  authLogger.info('📡 [AuthFlow] Auth check response received', {
                    status: res.status,
                    statusText: res.statusText,
                    ok: res.ok,
                    url: res.url,
                    authStatus,
                    cookieDomain,
                    setCookieHeader: setCookieHeader ? 'present' : 'not set',
                    responseHeaders: {
                      'x-auth-status': authStatus,
                      'x-cookie-domain': cookieDomain,
                      'content-type': responseHeaders['content-type'],
                    },
                    flowStep: 'cookie-check-response',
                  })
                  
                  return res
                } catch (error: any) {
                  clearTimeout(timeoutId)
                  if (isRetryableAuthError(error)) {
                    throw error
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
          
          // Log response after retry/backoff completes
          const finalHeaders = Object.fromEntries(response.headers.entries())
          authLogger.info('📡 [AuthFlow] Final session check response', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url,
            authStatus: response.headers.get('x-auth-status'),
            cookieDomain: response.headers.get('x-cookie-domain'),
            flowStep: 'cookie-check-final',
          })
          
          // Log cookies after request (may have changed)
          if (typeof document !== 'undefined') {
            const cookiesAfterRequest = document.cookie
            const hasCookieAfterRequest = cookiesAfterRequest.includes('upswitch_session')
            
            authLogger.info('🍪 [AuthFlow] Cookies after request', {
              allCookies: cookiesAfterRequest || 'none',
              hasUpswitchSession: hasCookieAfterRequest,
              cookieChanged: hasCookieAfterRequest !== cookieDiagnostics.hasUpswitchSessionCookie,
              flowStep: 'cookie-check-after-request',
            })
          }

          if (response.ok) {
            const data = await response.json()
            
            let userData: User | null = null
            if (data.success && data.data) {
              userData = data.data.user || data.data
            } else if (data.success && data.user) {
              userData = data.user
            }
            
            if (userData) {
              authLogger.info('✅ [AuthFlow] Authentication successful via cookie!', {
                userId: userData.id,
                email: userData.email,
                name: userData.name,
                flowPath: 'cookie-seamless',
                authenticationMethod: 'cross-subdomain-cookie',
                cookieWorked: true,
                timestamp: new Date().toISOString(),
              })
              get().setUser(userData)
              return userData
            }
            
            authLogger.debug('No existing session - response', { data })
            get().setUser(null)
            return null
          } else if (response.status === 404 || response.status === 401) {
            authLogger.info('ℹ️ [AuthFlow] No active session (expected for guests)', {
              status: response.status,
              flowStep: 'cookie-check-no-session',
              nextStep: 'will-try-token-exchange',
            })
            get().setUser(null)
            return null
          } else {
            const error = new Error(`Unexpected status: ${response.status}`)
            const classified = classifyAuthError(error)
            
            if (classified.recoveryStrategy === RecoveryStrategy.CONTINUE_AS_GUEST) {
              authLogger.debug('Unexpected session check response, continuing as guest', {
                status: response.status,
                errorType: classified.type,
              })
              get().setUser(null)
              return null
            }
            
            throw error
          }
        } catch (err) {
          const classified = classifyAuthError(err)
          
          authLogger.debug('Session check failed', {
            error: err instanceof Error ? err.message : 'Unknown error',
            errorType: classified.type,
            retryable: classified.retryable,
            recoveryStrategy: classified.recoveryStrategy,
          })
          
          if (classified.recoveryStrategy === RecoveryStrategy.CONTINUE_AS_GUEST) {
            get().setUser(null)
            return null
          }
          
          get().setUser(null)
          return null
        }
      },

      /**
       * Exchange subdomain token for session cookie
       */
      exchangeToken: async (token: string): Promise<void> => {
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
            credentials: 'include',
            body: JSON.stringify({ token }),
          })

          // Check if cookie was set in response
          const setCookieHeader = response.headers.get('set-cookie')
          const authStatus = response.headers.get('x-auth-status')
          const cookieDomain = response.headers.get('x-cookie-domain')
          
          authLogger.info('📡 [AuthFlow] Token exchange response', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            authStatus,
            cookieDomain,
            setCookieHeader: setCookieHeader ? 'present (cookie set)' : 'not set',
            flowStep: 'token-exchange-response',
          })

          if (!response.ok) {
            let errorMessage = 'Token exchange failed'
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage

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
          
          if (data.success && data.data) {
            const userData = data.data.user || data.data
            get().setUser(userData)
            
            // Log cookies after token exchange (should have cookie now)
            if (typeof document !== 'undefined') {
              const cookiesAfterExchange = document.cookie
              const hasCookieAfterExchange = cookiesAfterExchange.includes('upswitch_session')
              
              authLogger.info('✅ [AuthFlow] Authentication successful via token exchange!', {
                userId: userData.id,
                email: userData.email,
                name: userData.name,
                flowPath: 'token-exchange',
                authenticationMethod: 'token-to-cookie',
                cookieSet: hasCookieAfterExchange,
                cookiesAfterExchange: cookiesAfterExchange || 'none',
                timestamp: new Date().toISOString(),
              })
            } else {
              authLogger.info('✅ [AuthFlow] Authentication successful via token exchange!', {
                userId: userData.id,
                email: userData.email,
                name: userData.name,
                flowPath: 'token-exchange',
                authenticationMethod: 'token-to-cookie',
                timestamp: new Date().toISOString(),
              })
            }

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

                clearSession()
                authLogger.info('Guest session cleared after migration')
              } else {
                authLogger.info('No guest session to migrate')
              }

              // Ensure authenticated user has a session
              const { ensureSession } = useGuestSessionStore.getState()
              try {
                const authenticatedSessionId = await ensureSession()
                authLogger.info('Authenticated session ensured', {
                  session_id: authenticatedSessionId
                    ? authenticatedSessionId.substring(0, 15) + '...'
                    : null,
                })
              } catch (sessionError) {
                authLogger.warn(
                  'Failed to ensure authenticated session, but authentication succeeded',
                  {
                    error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
                  }
                )
              }
            } catch (migrationError) {
              authLogger.warn('Guest data migration failed, but authentication succeeded', {
                error: migrationError instanceof Error ? migrationError.message : 'Unknown error',
              })

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
          throw err
        }
      },

      /**
       * Initialize authentication flow
       * Promise cache pattern prevents concurrent calls
       */
      initAuth: async (): Promise<void> => {
        const state = get()
        
        // If already initializing, return existing promise (promise cache pattern)
        if (state.initializationPromise) {
          authLogger.debug('⏸️ [InitAuth] Already running, waiting for completion...')
          return state.initializationPromise
        }
        
        // Create new initialization promise
        const initPromise = (async () => {
          // Atomic state update
          set((state) => ({
            ...state,
            isLoading: true,
            error: null,
          }))

          try {
            // PRIORITY 0: Check cookie health
            authLogger.warn('🔍 [Priority 0] Checking cookie health...')
            let cookieHealth: CookieHealthStatus | null = null
            try {
              const health = await checkCookieHealth()
              get().setCookieHealth(health)
              cookieHealth = health
              
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

            // PRIORITY 1: Check for existing session cookie (SEAMLESS CROSS-SUBDOMAIN AUTH)
            authLogger.info('🔍 [AuthFlow] Priority 1: Checking for existing session cookie...', {
              flowStep: 'cookie-auth-check',
              expectedBehavior: 'Cookie from upswitch.biz should be accessible on valuation.upswitch.biz',
              timestamp: new Date().toISOString(),
            })
            
            let cookieAuthFailed = false
            let cookieErrorDetails: any = null
            
            try {
              const authenticatedUser = await get().checkSession()

              if (authenticatedUser) {
                authLogger.info('🎉 [AuthFlow] ✅ SUCCESS: Authenticated via cookie - seamless cross-subdomain auth!', {
                  userId: authenticatedUser.id,
                  email: authenticatedUser.email,
                  name: authenticatedUser.name,
                  flowPath: 'cookie-seamless',
                  authenticationMethod: 'cross-subdomain-cookie',
                  cookieHealth: cookieHealth ? {
                    accessible: cookieHealth.accessible,
                    blocked: cookieHealth.blocked,
                    browser: cookieHealth.browser,
                    reason: cookieHealth.reason,
                  } : null,
                  success: true,
                  timestamp: new Date().toISOString(),
                })
                
                // Ensure authenticated user has a guest session
                const { ensureSession } = useGuestSessionStore.getState()
                try {
                  await ensureSession()
                } catch (sessionError) {
                  authLogger.debug('Failed to ensure authenticated session', {
                    error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
                  })
                }
                
                // Clear promise and return
                set((state) => ({
                  ...state,
                  initializationPromise: null,
                }))
                return
              }
              
              authLogger.debug('ℹ️ [Priority 1] No cookie session found (expected for guests)')
              cookieAuthFailed = true
            } catch (cookieError: any) {
              cookieAuthFailed = true
              cookieErrorDetails = cookieError
              const classified = classifyAuthError(cookieError)
              
              authLogger.debug('ℹ️ [Priority 1] Cookie auth check failed', {
                error: cookieError instanceof Error ? cookieError.message : 'Unknown error',
                errorType: classified.type,
                recoveryStrategy: classified.recoveryStrategy,
                responseStatus: cookieError?.response?.status,
                responseData: cookieError?.response?.data,
              })
              
              const is401Or403 = cookieError?.response?.status === 401 || cookieError?.response?.status === 403
              const isNetworkError = classified.type === AuthErrorType.NETWORK_ERROR || classified.type === AuthErrorType.TIMEOUT_ERROR
              const isCorsError = cookieError?.message?.includes('CORS') || cookieError?.message?.includes('Failed to fetch')
              
              const cookiesBlocked = isNetworkError || isCorsError || 
                                    (is401Or403 && cookieHealth?.blocked) ||
                                    classified.recoveryStrategy === RecoveryStrategy.FALLBACK_TO_TOKEN
              
              if (is401Or403) {
                authLogger.warn('⚠️ [Priority 1] Auth check returned 401/403', {
                  status: cookieError.response.status,
                  origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
                  apiUrl: API_URL,
                  cookiesBlocked,
                  cookieHealth: cookieHealth ? {
                    accessible: cookieHealth.accessible,
                    blocked: cookieHealth.blocked,
                    needsToken: cookieHealth.needsToken,
                    browser: cookieHealth.browser,
                  } : null,
                  hint: cookiesBlocked 
                    ? 'Cookies may be blocked by browser privacy settings. User should navigate from upswitch.biz to get a token.'
                    : 'No active session found (expected for guest users).',
                  documentCookies: typeof document !== 'undefined' ? document.cookie : 'N/A',
                  hasUpswitchSessionCookie: typeof document !== 'undefined' ? document.cookie.includes('upswitch_session') : false,
                })
              }
              
              if (cookiesBlocked) {
                authLogger.info('ℹ️ [Priority 1] Cookies blocked, skipping to token exchange', {
                  reason: cookieHealth?.reason || classified.message,
                  browser: cookieHealth?.browser || 'unknown',
                })
                get().setError(
                  'Cookies are blocked by your browser. Please navigate here from upswitch.biz to authenticate.'
                )
              }
            }

            // PRIORITY 2: Check for token in URL (FALLBACK METHOD)
            authLogger.info('🔍 [AuthFlow] Priority 2: Checking for token in URL...', {
              flowStep: 'token-url-check',
              url: typeof window !== 'undefined' ? window.location.href : 'N/A',
            })
            
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search)
              const token = params.get('token')

              if (token) {
                authLogger.info('✅ [AuthFlow] Token found in URL - exchanging for session cookie', {
                  tokenLength: token.length,
                  tokenPrefix: token.substring(0, 20) + '...',
                  flowStep: 'token-found-in-url',
                })

                // Remove token from URL immediately
                const newUrl = window.location.pathname + window.location.hash
                window.history.replaceState({}, document.title, newUrl)

                try {
                  await get().exchangeToken(token)
                  
                  authLogger.info('🎉 [AuthFlow] ✅ SUCCESS: Token exchange complete - user authenticated!', {
                    flowPath: 'token-exchange-success',
                    authenticationMethod: 'token-to-cookie',
                    cookieHealth: cookieHealth ? {
                      accessible: cookieHealth.accessible,
                      blocked: cookieHealth.blocked,
                      needsToken: cookieHealth.needsToken,
                      browser: cookieHealth.browser,
                      reason: cookieHealth.reason,
                    } : null,
                    cookieAuthFailed,
                    finalState: 'authenticated',
                    success: true,
                    timestamp: new Date().toISOString(),
                  })
                  
                  // Clear promise and return
                  set((state) => ({
                    ...state,
                    initializationPromise: null,
                  }))
                  return
                } catch (tokenError) {
                  authLogger.error('❌ [Priority 2] Token exchange failed', {
                    error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                  })
                  authLogger.info('ℹ️ [Priority 2] Continuing as guest after token exchange failure')
                }
              } else {
                authLogger.debug('ℹ️ [Priority 2] No token in URL')
                
                if (cookieAuthFailed) {
                  authLogger.info('💡 [Priority 2] Tip: Navigate to valuation.upswitch.biz from upswitch.biz to get automatic authentication')
                  
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
            }

            // PRIORITY 3: Continue as guest (ALWAYS WORKS)
            authLogger.info('🔍 [AuthFlow] Priority 3: Initializing guest session...', {
              flowStep: 'guest-mode',
            })
            
            authLogger.info('📊 [AuthFlow] Authentication flow summary', {
              flowPath: 'guest',
              cookieHealth: cookieHealth ? {
                accessible: cookieHealth.accessible,
                blocked: cookieHealth.blocked,
                needsToken: cookieHealth.needsToken,
                browser: cookieHealth.browser,
                reason: cookieHealth.reason,
                cookieExists: cookieHealth.cookieExists,
              } : null,
              cookieAuthFailed,
              cookieErrorStatus: cookieErrorDetails?.response?.status,
              cookieErrorType: cookieErrorDetails ? (cookieErrorDetails instanceof Error ? cookieErrorDetails.message : String(cookieErrorDetails)) : null,
              hadTokenInUrl: false,
              finalState: 'guest',
              success: true,
              timestamp: new Date().toISOString(),
            })
            
            // Atomic state update for guest mode
            set((state) => ({
              ...state,
              user: null,
              isLoading: false,
              error: null,
            }))
            
            const { getSessionId, initializeSession } = useGuestSessionStore.getState()
            const existingGuestSession = getSessionId()

            if (!existingGuestSession) {
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
              }
            } else {
              authLogger.info('✅ [Priority 3] Using existing guest session', {
                guestSessionId: existingGuestSession.substring(0, 15) + '...',
              })
              try {
                const sessionId = await initializeSession()
                authLogger.debug('✅ [Priority 3] Guest session verified', {
                  session_id: sessionId ? sessionId.substring(0, 15) + '...' : null,
                })
              } catch (guestError) {
                authLogger.warn('⚠️ [Priority 3] Failed to verify guest session', {
                  error: guestError instanceof Error ? guestError.message : 'Unknown error',
                })
              }
            }
            
            // Clear promise
            set((state) => ({
              ...state,
              initializationPromise: null,
            }))
            
            // Start background refresh after successful initialization
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                get().startBackgroundRefresh()
              }, 1000) // Start after 1 second delay
            }
          } catch (err) {
            authLogger.error('❌ [InitAuth] Authentication initialization failed', {
              error: err instanceof Error ? err.message : 'Unknown error',
            })
            
            // Atomic error state update with error recovery
            const error = err instanceof Error ? err.message : 'Authentication failed'
            set((state) => ({
              ...state,
              error,
              isLoading: false,
              initializationPromise: null,
            }))
            
            // Error recovery: retry after delay (exponential backoff)
            if (typeof window !== 'undefined') {
              const retryDelay = 5000 // 5 seconds
              setTimeout(() => {
                const currentState = get()
                // Only retry if still in error state and not already initializing
                if (currentState.error && !currentState.initializationPromise) {
                  authLogger.debug('🔄 [InitAuth] Error recovery: retrying initialization')
                  get().initAuth().catch(() => {
                    // Silent failure - error already logged
                  })
                }
              }, retryDelay)
            }
          }
        })()
        
        // Store promise in state (promise cache pattern)
        set((state) => ({
          ...state,
          initializationPromise: initPromise,
        }))
        
        return initPromise
      },

      /**
       * Refresh authentication state
       * Checks if initAuth is running and waits if needed
       * Non-blocking, async-first operation
       */
      refreshAuth: async (): Promise<void> => {
        const state = get()
        
        // If initAuth is running, wait for it (prevents race conditions)
        if (state.initializationPromise) {
          authLogger.debug('⏸️ [RefreshAuth] InitAuth in progress, waiting...')
          await state.initializationPromise
          return
        }
        
        // Optimistic update: set loading immediately for smooth UX
        set((state) => ({
          ...state,
          isLoading: true,
        }))
        
        try {
          const refreshedUser = await get().checkSession()
          if (refreshedUser) {
            // setUser already called in checkSession (atomic update)
            authLogger.debug('✅ [RefreshAuth] Auth refreshed successfully')
          } else {
            // No user found - clear loading state
            set((state) => ({
              ...state,
              isLoading: false,
            }))
          }
        } catch (error) {
          // Error recovery: set error but don't block
          get().setError(
            error instanceof Error ? error.message : 'Refresh failed'
          )
          set((state) => ({
            ...state,
            isLoading: false,
          }))
        }
      },
    }),
    { name: 'AuthStore' }
  )
)
