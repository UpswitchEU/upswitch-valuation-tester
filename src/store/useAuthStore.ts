/**
 * Auth Store (Zustand)
 * 
 * Single source of truth for authentication state.
 * Uses Zustand's atomic updates and promise caching to prevent race conditions.
 * 
 * Features:
 * - Atomic state updates (no race conditions via Zustand)
 * - Promise cache prevents concurrent initAuth calls
 * - Async-first operations (non-blocking, smooth)
 * - Cross-tab synchronization via BroadcastChannel
 * - Cookie health monitoring integration
 * 
 * Pattern: Follows useGuestSessionStore promise cache pattern
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '../contexts/AuthContextTypes'
import { backendAPI } from '../services/backendApi'
import { getAuthCache } from '../utils/auth/authCache'
import { authFlowLogger } from '../utils/auth/authFlowLogger'
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
       * Enhanced with comprehensive cookie detection and cross-subdomain logging
       */
      checkSession: async (): Promise<User | null> => {
        // CRITICAL: Log function entry
        console.log('🔍🔍🔍 [CHECK SESSION] ===========================================')
        console.log('🔍🔍🔍 [CHECK SESSION] checkSession() called!')
        console.log('🔍🔍🔍 [CHECK SESSION] Timestamp:', new Date().toISOString())
        console.log('🔍🔍🔍 [CHECK SESSION] ===========================================')
        
        const cache = getAuthCache()
        
        // Check cache first
        const cached = cache.get()
        if (cached && cached.user) {
          authLogger.debug('✅ [CheckSession] Using cached auth result', {
            userId: cached.user.id,
            email: cached.user.email,
          })
          get().setUser(cached.user)
          return cached.user
        }
        
        // Enhanced cookie detection before making request
        let cookieDiagnostics: any = {}
        let subdomain: string | null = null
        let isSubdomainRequest = false
        
        if (typeof document !== 'undefined') {
          const allCookies = document.cookie
          const hasUpswitchSession = allCookies.includes('upswitch_session')
          const hostname = window.location.hostname
          
          // Detect subdomain
          if (hostname.includes('.')) {
            const parts = hostname.split('.')
            if (parts.length > 2) {
              subdomain = parts[0]
              isSubdomainRequest = true
            }
          }
          
          // Extract cookie details if present
          let cookieDetails: any = {}
          if (hasUpswitchSession) {
            const cookieMatch = allCookies.match(/upswitch_session=([^;]+)/)
            if (cookieMatch) {
              cookieDetails = {
                cookiePresent: true,
                cookieLength: cookieMatch[1].length,
                cookiePrefix: cookieMatch[1].substring(0, 20) + '...',
              }
            }
          }
          
          cookieDiagnostics = {
            timestamp: new Date().toISOString(),
            action: 'CHECK_SESSION',
            currentOrigin: window.location.origin,
            hostname,
            subdomain: subdomain || 'main domain',
            isSubdomainRequest,
            cookieDetection: {
              documentCookies: allCookies || 'none',
              hasUpswitchSessionCookie: hasUpswitchSession,
              cookieCount: allCookies ? allCookies.split(';').length : 0,
              ...cookieDetails,
            },
            apiUrl: API_URL,
            crossSubdomainExpected: isSubdomainRequest && hasUpswitchSession,
          }
          
          // CRITICAL: Make cookie detection VERY visible in console
          console.log('🔍 [COOKIE CHECK] ===========================================')
          console.log('🔍 [COOKIE CHECK] Checking for cross-subdomain cookie...')
          console.log('🔍 [COOKIE CHECK] Hostname:', hostname)
          console.log('🔍 [COOKIE CHECK] Subdomain:', subdomain || 'main domain')
          console.log('🔍 [COOKIE CHECK] Is Subdomain Request:', isSubdomainRequest)
          console.log('🔍 [COOKIE CHECK] Cookie Found:', hasUpswitchSession ? '✅ YES' : '❌ NO')
          console.log('🔍 [COOKIE CHECK] All Cookies:', allCookies || 'none')
          console.log('🔍 [COOKIE CHECK] ===========================================')
          
          authLogger.debug('🍪 [CheckSession] Cookie diagnostics before auth check', JSON.stringify(cookieDiagnostics, null, 2))
          
          // Log cross-subdomain cookie detection - VERY VISIBLE
          if (isSubdomainRequest && hasUpswitchSession) {
            console.log('✅ [COOKIE DETECTED] Cross-subdomain cookie found!', {
              subdomain,
              hostname,
              cookiePresent: true,
              message: 'Cookie from main domain detected on subdomain - attempting authentication',
            })
            authLogger.info('🔍 [CheckSession] Cross-subdomain cookie detected', {
              subdomain,
              hostname,
              cookiePresent: true,
              message: 'Cookie from main domain detected on subdomain - attempting authentication',
            })
          } else if (isSubdomainRequest && !hasUpswitchSession) {
            console.warn('⚠️ [COOKIE MISSING] Subdomain request but NO cookie detected!', {
              subdomain,
              hostname,
              currentOrigin: window.location.origin,
              allCookies: allCookies || 'none',
              possibleReasons: [
                'Cookie not set on main domain',
                'Cookie domain mismatch (check .upswitch.biz)',
                'Browser blocking cross-subdomain cookies',
                'Cookie expired or cleared',
              ],
              troubleshooting: [
                '1. Check if logged into upswitch.biz',
                '2. Open DevTools → Application → Cookies → Check for upswitch_session',
                '3. Verify cookie domain is .upswitch.biz',
                '4. Check browser privacy settings',
              ],
            })
            authLogger.debug('ℹ️ [CheckSession] Subdomain request but no cookie detected', {
              subdomain,
              hostname,
              possibleReasons: [
                'Cookie not set on main domain',
                'Cookie domain mismatch (check .upswitch.biz)',
                'Browser blocking cross-subdomain cookies',
              ],
            })
          }
        }
        
        try {
          const requestLog = {
            timestamp: new Date().toISOString(),
            action: 'AUTH_REQUEST',
            apiUrl: API_URL,
            endpoint: `${API_URL}/api/auth/me`,
            method: 'GET',
            credentials: 'include',
            ...cookieDiagnostics,
          }
          authLogger.debug('🔍 [CheckSession] Checking session cookie...', JSON.stringify(requestLog, null, 2))
          
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
                  
                  const responseHeaders = Object.fromEntries(res.headers.entries())
                  const authStatus = res.headers.get('X-Auth-Status')
                  const cookieDomain = res.headers.get('X-Cookie-Domain')
                  const originHeader = res.headers.get('X-Origin')
                  const subdomainHeader = res.headers.get('X-Subdomain')
                  
                  authLogger.debug('📡 [CheckSession] Auth check response', {
                    timestamp: new Date().toISOString(),
                    status: res.status,
                    statusText: res.statusText,
                    ok: res.ok,
                    url: res.url,
                    headers: {
                      ...responseHeaders,
                      'X-Auth-Status': authStatus,
                      'X-Cookie-Domain': cookieDomain,
                      'X-Origin': originHeader,
                      'X-Subdomain': subdomainHeader,
                    },
                    cookieDiagnostics: {
                      authStatus,
                      cookieDomain,
                      origin: originHeader,
                      subdomain: subdomainHeader,
                    },
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
          
          authLogger.debug('📡 Session check response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url,
          })
          
          if (typeof document !== 'undefined') {
            authLogger.debug('🍪 [CheckSession] Document cookies after response', {
              allCookies: document.cookie,
              hasUpswitchSession: document.cookie.includes('upswitch_session'),
              cookieCount: document.cookie ? document.cookie.split(';').length : 0,
            })
          }

          // CRITICAL: Log response status immediately
          console.log('📡📡📡 [CHECK SESSION RESPONSE] ===========================================')
          console.log('📡📡📡 [CHECK SESSION RESPONSE] Response status:', response.status)
          console.log('📡📡📡 [CHECK SESSION RESPONSE] Response OK:', response.ok)
          console.log('📡📡📡 [CHECK SESSION RESPONSE] Response headers:', Object.fromEntries(response.headers.entries()))
          console.log('📡📡📡 [CHECK SESSION RESPONSE] X-Auth-Status:', response.headers.get('X-Auth-Status'))
          console.log('📡📡📡 [CHECK SESSION RESPONSE] X-Cookie-Domain:', response.headers.get('X-Cookie-Domain'))
          console.log('📡📡📡 [CHECK SESSION RESPONSE] ===========================================')
          
          if (response.ok) {
            const data = await response.json()
            console.log('📡📡📡 [CHECK SESSION] Response data received:', data.success ? 'SUCCESS' : 'FAILURE')
            
            let userData: User | null = null
            if (data.success && data.data) {
              userData = data.data.user || data.data
            } else if (data.success && data.user) {
              userData = data.user
            }
            
            if (userData) {
              // CRITICAL: Make success VERY visible in console
              console.log('✅✅✅ [AUTH SUCCESS] ===========================================')
              console.log('✅✅✅ [AUTH SUCCESS] Authentication successful!')
              console.log('✅✅✅ [AUTH SUCCESS] User:', userData.email)
              console.log('✅✅✅ [AUTH SUCCESS] User ID:', userData.id)
              console.log('✅✅✅ [AUTH SUCCESS] Cross-subdomain:', isSubdomainRequest ? 'YES ✅' : 'NO')
              console.log('✅✅✅ [AUTH SUCCESS] Cookie was detected:', cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie ? 'YES ✅' : 'NO')
              console.log('✅✅✅ [AUTH SUCCESS] ===========================================')
              
              // Show alert for testing (remove in production)
              if (typeof window !== 'undefined' && window.location.hostname.includes('valuation.')) {
                console.log('🎉🎉🎉 [SUCCESS ALERT] Cross-subdomain cookie authentication worked!')
              }
              
              const successLog = {
                timestamp: new Date().toISOString(),
                action: 'AUTH_SUCCESS',
                userId: userData.id,
                email: userData.email,
                origin: cookieDiagnostics.currentOrigin,
                subdomain: subdomain || 'main',
                isSubdomainRequest,
                cookieDetected: cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie,
                crossSubdomainAuth: isSubdomainRequest && cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie,
                message: isSubdomainRequest 
                  ? 'Cross-subdomain cookie authentication successful'
                  : 'Cookie authentication successful',
              }
              authLogger.info('✅ [CheckSession] Existing session found', JSON.stringify(successLog, null, 2))
              
              // Log cross-subdomain success prominently
              if (isSubdomainRequest && cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie) {
                console.log('🎉🎉🎉 [CROSS-SUBDOMAIN SUCCESS] Cookie from main domain authenticated on subdomain!')
                authLogger.info('✅ [CheckSession] Cross-subdomain cookie authentication successful', {
                  subdomain,
                  userId: userData.id,
                  email: userData.email,
                  cookieDomain: response.headers.get('X-Cookie-Domain'),
                  message: 'Cookie from main domain successfully authenticated on subdomain',
                })
              }
              
              get().setUser(userData)
              return userData
            }
            
            authLogger.debug('ℹ️ [CheckSession] No existing session - response', { data })
            get().setUser(null)
            return null
          } else if (response.status === 404 || response.status === 401) {
            // CRITICAL: Log 401/404 with details
            console.log('❌❌❌ [CHECK SESSION] ===========================================')
            console.log('❌❌❌ [CHECK SESSION] Response status:', response.status)
            console.log('❌❌❌ [CHECK SESSION] This means: No active session')
            console.log('❌❌❌ [CHECK SESSION] Cookie was detected:', cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie ? 'YES ✅' : 'NO ❌')
            console.log('❌❌❌ [CHECK SESSION] Origin:', cookieDiagnostics.currentOrigin)
            console.log('❌❌❌ [CHECK SESSION] Subdomain:', subdomain || 'main')
            if (!cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie && isSubdomainRequest) {
              console.error('❌❌❌ [CHECK SESSION] CRITICAL: Cookie NOT detected on subdomain!')
              console.error('❌❌❌ [CHECK SESSION] This is why authentication failed')
              console.error('❌❌❌ [CHECK SESSION] Cookie must be set with domain: .upswitch.biz')
            }
            console.log('❌❌❌ [CHECK SESSION] ===========================================')
            
            const noSessionLog = {
              timestamp: new Date().toISOString(),
              action: 'NO_SESSION',
              status: response.status,
              origin: cookieDiagnostics.currentOrigin,
              subdomain: subdomain || 'main',
              isSubdomainRequest,
              cookieDetected: cookieDiagnostics.cookieDetection.hasUpswitchSessionCookie,
              message: 'No active session (expected for guests)',
            }
            authLogger.debug('ℹ️ [CheckSession] No active session (expected for guests)', JSON.stringify(noSessionLog, null, 2))
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
            const userData = data.data.user || data.data
            get().setUser(userData)
            
            authLogger.info('Authentication successful via token exchange', { email: userData.email })

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
        // CRITICAL: Force log immediately - use console.log directly
        console.log('🚀🚀🚀 [INIT AUTH CALLED] ===========================================')
        console.log('🚀🚀🚀 [INIT AUTH CALLED] initAuth() function called!')
        console.log('🚀🚀🚀 [INIT AUTH CALLED] Timestamp:', new Date().toISOString())
        console.log('🚀🚀🚀 [INIT AUTH CALLED] ===========================================')
        
        const state = get()
        
        // If already initializing, return existing promise (promise cache pattern)
        if (state.initializationPromise) {
          console.log('⏸️ [INIT AUTH] Already running, waiting for completion...')
          authLogger.debug('⏸️ [InitAuth] Already running, waiting for completion...')
          return state.initializationPromise
        }
        
        // Generate correlation ID for this auth flow
        authFlowLogger.setCorrelationId()
        
        // Detect subdomain context
        let subdomain: string | null = null
        let isSubdomainRequest = false
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname
          console.log('🔍 [INIT AUTH] Hostname:', hostname)
          if (hostname.includes('.')) {
            const parts = hostname.split('.')
            console.log('🔍 [INIT AUTH] Hostname parts:', parts)
            if (parts.length > 2) {
              subdomain = parts[0]
              isSubdomainRequest = true
              console.log('🔍 [INIT AUTH] Subdomain detected:', subdomain)
            }
          }
        }
        
        console.log('🔍 [INIT AUTH] Subdomain:', subdomain || 'main domain')
        console.log('🔍 [INIT AUTH] Is Subdomain Request:', isSubdomainRequest)
        
        // Log auth flow start
        authFlowLogger.info({
          action: 'AUTH_FLOW_START',
          origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
          subdomain: subdomain || 'main domain',
          isSubdomainRequest,
          correlationId: authFlowLogger.getCorrelationId(),
        })
        
        console.log('📝 [INIT AUTH] Auth flow started, correlation ID:', authFlowLogger.getCorrelationId())
        
        // Create new initialization promise
        const initPromise = (async () => {
          console.log('🔄 [INIT AUTH] Creating initialization promise...')
          
          // Atomic state update
          set((state) => ({
            ...state,
            isLoading: true,
            error: null,
          }))

          try {
            // PRIORITY 0: Check cookie health
            console.log('🔍 [PRIORITY 0] ===========================================')
            console.log('🔍 [PRIORITY 0] Starting Priority 0: Cookie Health Check')
            console.log('🔍 [PRIORITY 0] ===========================================')
            
            authFlowLogger.logStep('COOKIE_HEALTH_CHECK', 0, {
              origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
              subdomain: subdomain || 'main',
              isSubdomainRequest,
            })
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

            // PRIORITY 1: Check for existing session cookie
            // CRITICAL: Make this VERY visible
            console.log('🚀🚀🚀 [PRIORITY 1] ===========================================')
            console.log('🚀🚀🚀 [PRIORITY 1] STARTING PRIORITY 1: COOKIE AUTHENTICATION CHECK')
            console.log('🚀🚀🚀 [PRIORITY 1] This is the CRITICAL step for cross-subdomain auth!')
            console.log('🚀🚀🚀 [PRIORITY 1] Origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown')
            console.log('🚀🚀🚀 [PRIORITY 1] Subdomain:', subdomain || 'main')
            console.log('🚀🚀🚀 [PRIORITY 1] Is Subdomain:', isSubdomainRequest)
            console.log('🚀🚀🚀 [PRIORITY 1] Cookie Health:', cookieHealth ? {
              accessible: cookieHealth.accessible,
              blocked: cookieHealth.blocked,
              browser: cookieHealth.browser,
            } : 'not checked')
            
            // CRITICAL: Check cookie IMMEDIATELY before API call
            if (typeof document !== 'undefined') {
              const cookieCheck = document.cookie.includes('upswitch_session')
              console.log('🚀🚀🚀 [PRIORITY 1] IMMEDIATE COOKIE CHECK:', cookieCheck ? '✅✅✅ FOUND!' : '❌❌❌ NOT FOUND!')
              console.log('🚀🚀🚀 [PRIORITY 1] All cookies:', document.cookie || 'NONE')
              if (!cookieCheck && isSubdomainRequest) {
                console.error('❌❌❌ [PRIORITY 1] CRITICAL: No cookie detected on subdomain!')
                console.error('❌❌❌ [PRIORITY 1] This means cookie from main domain is not accessible')
                console.error('❌❌❌ [PRIORITY 1] Check: DevTools → Application → Cookies → upswitch_session')
                console.error('❌❌❌ [PRIORITY 1] Cookie domain should be: .upswitch.biz')
              }
            }
            
            console.log('🚀🚀🚀 [PRIORITY 1] ===========================================')
            
            authFlowLogger.logStep('COOKIE_AUTH_CHECK', 1, {
              origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
              subdomain: subdomain || 'main',
              isSubdomainRequest,
              cookieHealth: cookieHealth ? {
                accessible: cookieHealth.accessible,
                blocked: cookieHealth.blocked,
                browser: cookieHealth.browser,
              } : null,
            })
            authLogger.warn('🔍 [Priority 1] Checking for existing session cookie...')
            let cookieAuthFailed = false
            let cookieErrorDetails: any = null
            
            try {
              const startTime = performance.now()
              console.log('📡📡📡 [PRIORITY 1] Calling checkSession() NOW to verify cookie...')
              console.log('📡📡📡 [PRIORITY 1] API URL:', API_URL)
              console.log('📡📡📡 [PRIORITY 1] Endpoint:', `${API_URL}/api/auth/me`)
              console.log('📡📡📡 [PRIORITY 1] Credentials: include')
              
              const authenticatedUser = await get().checkSession()
              const duration = Math.round(performance.now() - startTime)
              console.log('📡📡📡 [PRIORITY 1] checkSession() completed in', duration, 'ms')
              console.log('📡📡📡 [PRIORITY 1] Result:', authenticatedUser ? `✅✅✅ USER FOUND: ${authenticatedUser.email}` : '❌❌❌ NO USER')
              
              // Re-detect subdomain for logging (already detected above, but ensure we have it)
              if (!subdomain && typeof window !== 'undefined') {
                const hostname = window.location.hostname
                if (hostname.includes('.')) {
                  const parts = hostname.split('.')
                  if (parts.length > 2) {
                    subdomain = parts[0]
                    isSubdomainRequest = true
                  }
                }
              }

              if (authenticatedUser) {
                // CRITICAL: Make success VERY visible
                console.log('✅✅✅ [SUCCESS] ===========================================')
                console.log('✅✅✅ [SUCCESS] COOKIE AUTHENTICATION SUCCESSFUL!')
                console.log('✅✅✅ [SUCCESS] User:', authenticatedUser.email)
                console.log('✅✅✅ [SUCCESS] User ID:', authenticatedUser.id)
                console.log('✅✅✅ [SUCCESS] Duration:', duration, 'ms')
                console.log('✅✅✅ [SUCCESS] Cross-subdomain:', isSubdomainRequest ? 'YES ✅' : 'NO')
                console.log('✅✅✅ [SUCCESS] ===========================================')
                
                const cookieAuthLog = {
                  timestamp: new Date().toISOString(),
                  action: 'COOKIE_AUTH_SUCCESS',
                  priority: 1,
                  flowPath: 'cookie',
                  userId: authenticatedUser.id,
                  email: authenticatedUser.email,
                  duration: duration,
                  origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
                  subdomain: subdomain || 'main domain',
                  isSubdomainRequest,
                  cookieHealth: cookieHealth ? {
                    accessible: cookieHealth.accessible,
                    blocked: cookieHealth.blocked,
                    browser: cookieHealth.browser,
                    needsToken: cookieHealth.needsToken,
                  } : null,
                  crossSubdomainAuth: isSubdomainRequest,
                  message: isSubdomainRequest 
                    ? 'Cross-subdomain cookie authentication successful - seamless!'
                    : 'Cookie authentication successful - seamless!',
                }
                authLogger.warn('✅ [Priority 1] Authenticated via cookie - seamless!', JSON.stringify(cookieAuthLog, null, 2))
                
                // Log cross-subdomain success prominently
                if (isSubdomainRequest) {
                  console.log('🎉🎉🎉 [CROSS-SUBDOMAIN SUCCESS] Cookie from main domain authenticated on subdomain!')
                  authLogger.info('🎉 [Priority 1] Cross-subdomain cookie authentication successful', {
                    subdomain,
                    userId: authenticatedUser.id,
                    email: authenticatedUser.email,
                    duration: duration,
                    cookieHealth: cookieHealth?.browser,
                    message: 'Cookie from main domain successfully authenticated on subdomain',
                  })
                }
                
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
              
              // CRITICAL: Make failure visible
              console.log('❌ [PRIORITY 1] ===========================================')
              console.log('❌ [PRIORITY 1] No cookie session found')
              console.log('❌ [PRIORITY 1] This is expected for guest users')
              console.log('❌ [PRIORITY 1] Will continue to Priority 2 (token) or Priority 3 (guest)')
              console.log('❌ [PRIORITY 1] ===========================================')
              
              authLogger.debug('ℹ️ [Priority 1] No cookie session found (expected for guests)')
              cookieAuthFailed = true
            } catch (cookieError: any) {
              // CRITICAL: Make error VERY visible
              console.error('❌❌❌ [PRIORITY 1 ERROR] ===========================================')
              console.error('❌❌❌ [PRIORITY 1 ERROR] Cookie authentication check FAILED!')
              console.error('❌❌❌ [PRIORITY 1 ERROR] Error:', cookieError?.message || 'Unknown error')
              console.error('❌❌❌ [PRIORITY 1 ERROR] Status:', cookieError?.response?.status)
              console.error('❌❌❌ [PRIORITY 1 ERROR] Will try token exchange or guest mode')
              console.error('❌❌❌ [PRIORITY 1 ERROR] ===========================================')
              
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

            // PRIORITY 2: Check for token in URL
            authLogger.warn('🔍 [Priority 2] Checking for token in URL...')
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search)
              const token = params.get('token')

              if (token) {
                authLogger.warn('✅ [Priority 2] Token found in URL - exchanging for session')

                // Remove token from URL immediately
                const newUrl = window.location.pathname + window.location.hash
                window.history.replaceState({}, document.title, newUrl)

                try {
                  await get().exchangeToken(token)
                  
                  authLogger.warn('✅ [Priority 2] Token exchange complete - user authenticated', {
                    flowPath: 'token',
                    cookieHealth: cookieHealth ? {
                      accessible: cookieHealth.accessible,
                      blocked: cookieHealth.blocked,
                      needsToken: cookieHealth.needsToken,
                      browser: cookieHealth.browser,
                      reason: cookieHealth.reason,
                    } : null,
                    cookieAuthFailed,
                    finalState: 'authenticated',
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

            // PRIORITY 3: Continue as guest
            authLogger.warn('🔍 [Priority 3] Initializing guest session...')
            
            authLogger.warn('📊 Authentication flow summary', {
              flowPath: 'guest',
              cookieHealth: cookieHealth ? {
                accessible: cookieHealth.accessible,
                blocked: cookieHealth.blocked,
                needsToken: cookieHealth.needsToken,
                browser: cookieHealth.browser,
                reason: cookieHealth.reason,
              } : null,
              cookieAuthFailed,
              cookieErrorStatus: cookieErrorDetails?.response?.status,
              hadTokenInUrl: false,
              finalState: 'guest',
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

