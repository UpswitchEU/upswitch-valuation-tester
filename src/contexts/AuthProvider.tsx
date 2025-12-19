/**
 * Auth Provider (Zustand-based)
 * 
 * Wraps Zustand auth store in React Context for backward compatibility.
 * Provides useAuth hook that accesses Zustand store directly.
 * 
 * Features:
 * - Single source of truth (Zustand store)
 * - Backward compatible API (same useAuth hook)
 * - Cross-tab synchronization via BroadcastChannel
 * - Cookie health monitoring integration
 */

'use client'

import React, { useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { getCookieMonitor } from '../utils/auth/cookieMonitor'
import { getSessionSyncManager } from '../utils/auth/sessionSync'
import { authLogger } from '../utils/logger'
import { AuthContext, AuthContextType, User } from './AuthContextTypes'

/**
 * Helper to map business_type to industry category
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access Zustand store directly
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const cookieHealth = useAuthStore((state) => state.cookieHealth)
  const initAuth = useAuthStore((state) => state.initAuth)
  const checkSession = useAuthStore((state) => state.checkSession)
  const refreshAuth = useAuthStore((state) => state.refreshAuth)
  const setCookieHealth = useAuthStore((state) => state.setCookieHealth)
  const reset = useAuthStore((state) => state.reset)

  // Compute business card from user
  const businessCard = useMemo(() => {
    if (!user) {
      return null
    }

    const hasBusinessData = user.company_name || user.business_type || user.industry
    if (!hasBusinessData) {
      return null
    }

    return {
      company_name: user.company_name || 'Your Company',
      industry: getIndustry(user) || 'services',
      business_model: user.business_type || 'other',
      founding_year: user.founded_year || new Date().getFullYear() - (user.years_in_operation || 5),
      country_code: user.country || 'BE',
      employee_count: parseEmployeeCount(user.employee_count_range),
    }
  }, [user])

  // Initialize authentication on mount
  useEffect(() => {
    // CRITICAL: Log initialization start - VERY VISIBLE
    console.log('🚀 [AUTH INIT] ===========================================')
    console.log('🚀 [AUTH INIT] Starting authentication initialization...')
    console.log('🚀 [AUTH INIT] Origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown')
    console.log('🚀 [AUTH INIT] Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'unknown')
    console.log('🚀 [AUTH INIT] Checking for cookie from main domain...')
    console.log('🚀 [AUTH INIT] ===========================================')
    
    // Immediate cookie check before initAuth
    if (typeof document !== 'undefined') {
      const hasCookie = document.cookie.includes('upswitch_session')
      console.log('🔍 [IMMEDIATE CHECK] Cookie present:', hasCookie ? '✅ YES' : '❌ NO')
      console.log('🔍 [IMMEDIATE CHECK] All cookies:', document.cookie || 'none')
    }
    
    initAuth()
    
    // Start cookie monitoring
    const cookieMonitor = getCookieMonitor({
      onCookieBlocked: (health) => {
        console.warn('⚠️ [COOKIE MONITOR] Cookies blocked', health)
        authLogger.warn('Cookies blocked', { health })
        setCookieHealth(health)
      },
      onCookieRestored: (health) => {
        console.log('✅ [COOKIE MONITOR] Cookies restored! Retrying auth...', health)
        authLogger.info('Cookies restored', { health })
        setCookieHealth(health)
        // Retry auth check when cookies are restored (non-blocking)
        console.log('🔄 [COOKIE MONITOR] Retrying authentication check...')
        checkSession().then((user) => {
          if (user) {
            console.log('✅ [COOKIE MONITOR] Authentication successful after cookie restore!')
          }
        }).catch(() => {
          // Silent failure - will retry on next check
        })
      },
      onHealthChange: (health) => {
        setCookieHealth(health)
      },
    })
    cookieMonitor.start()
    
    // Set up session synchronization
    const syncManager = getSessionSyncManager()
    const unsubscribe = syncManager.onSessionSync(async (message) => {
      authLogger.info('Session sync event received', { message })
      
      if (message.type === 'SESSION_UPDATED' || message.type === 'SESSION_REFRESHED') {
        // Refresh auth state when session is updated in another tab (non-blocking)
        checkSession().then((refreshedUser) => {
          if (refreshedUser) {
            authLogger.debug('✅ [SessionSync] Auth refreshed from other tab')
          }
        }).catch((error) => {
          authLogger.error('Failed to refresh auth on session sync', {
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
      } else if (message.type === 'SESSION_INVALIDATED') {
        // Clear user state when session is invalidated (non-blocking)
        try {
          reset()
          authLogger.debug('✅ [SessionSync] Auth reset from other tab')
        } catch (error) {
          authLogger.error('Failed to reset auth on session invalidation', {
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    })
    
    return () => {
      cookieMonitor.stop()
      unsubscribe()
      // Stop background refresh on unmount
      const store = useAuthStore.getState()
      store.stopBackgroundRefresh()
    }
  }, [initAuth, checkSession, setCookieHealth, reset])

  // Create context value (backward compatible API)
  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user, // Computed from user
      isLoading,
      error,
      cookieHealth,
      refreshAuth,
      businessCard, // Computed from user
    }),
    [user, isLoading, error, cookieHealth, refreshAuth, businessCard]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context (backward compatible)
 */
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

