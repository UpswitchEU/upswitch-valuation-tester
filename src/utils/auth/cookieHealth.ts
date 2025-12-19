/**
 * Cookie Health Detection System
 * 
 * Detects cookie accessibility, browser compatibility, and cookie blocking
 * Provides automatic fallback when cookies are unavailable
 */

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://web-production-8d00b.up.railway.app'

export interface CookieHealthStatus {
  accessible: boolean
  blocked: boolean
  needsToken: boolean
  browser: string
  reason?: string
  cookieExists?: boolean
}

export interface BrowserInfo {
  name: string
  version: string
  isSafari: boolean
  isChrome: boolean
  isFirefox: boolean
  isEdge: boolean
  supportsThirdPartyCookies: boolean
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase()
  
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent)
  const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent)
  const isFirefox = /firefox/.test(userAgent)
  const isEdge = /edg/.test(userAgent)
  
  // Safari ITP (Intelligent Tracking Prevention) blocks third-party cookies
  // Chrome is phasing out third-party cookies
  // Firefox blocks third-party cookies by default
  const supportsThirdPartyCookies = !isSafari && !isFirefox
  
  // Extract version numbers
  const getVersion = (regex: RegExp): string => {
    const match = userAgent.match(regex)
    return match ? match[1] : 'unknown'
  }
  
  let name = 'unknown'
  let version = 'unknown'
  
  if (isSafari) {
    name = 'Safari'
    version = getVersion(/version\/(\d+\.\d+)/)
  } else if (isChrome) {
    name = 'Chrome'
    version = getVersion(/chrome\/(\d+\.\d+)/)
  } else if (isFirefox) {
    name = 'Firefox'
    version = getVersion(/firefox\/(\d+\.\d+)/)
  } else if (isEdge) {
    name = 'Edge'
    version = getVersion(/edg\/(\d+\.\d+)/)
  }
  
  return {
    name,
    version,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    supportsThirdPartyCookies,
  }
}

/**
 * Check if cookie exists in document.cookie
 * Note: This only works for non-HttpOnly cookies
 * HttpOnly cookies (like our auth cookie) won't be visible here
 */
export function checkCookieExists(cookieName: string = 'upswitch_session'): boolean {
  if (typeof document === 'undefined') return false
  
  const cookies = document.cookie.split(';')
  return cookies.some(cookie => cookie.trim().startsWith(`${cookieName}=`))
}

/**
 * Fast cookie health check (< 100ms timeout)
 * Uses HEAD request to minimize bandwidth
 */
export async function checkCookieHealth(): Promise<CookieHealthStatus> {
  const browser = detectBrowser()
  const cookieExists = checkCookieExists()
  
  try {
    // Fast health check with short timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 100)
    
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'HEAD', // Lightweight check
      credentials: 'include',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    // Status 0 typically means network error (CORS blocked, cookie blocked, etc.)
    if (response.status === 0) {
      return {
        accessible: false,
        blocked: true,
        needsToken: true,
        browser: browser.name,
        reason: 'Network error - cookies may be blocked',
        cookieExists,
      }
    }
    
    // 200 OK means cookie is accessible
    if (response.ok) {
      return {
        accessible: true,
        blocked: false,
        needsToken: false,
        browser: browser.name,
        cookieExists,
      }
    }
    
    // 401/404 means no session, but cookies work
    if (response.status === 401 || response.status === 404) {
      return {
        accessible: true,
        blocked: false,
        needsToken: false,
        browser: browser.name,
        reason: 'No active session',
        cookieExists,
      }
    }
    
    // Other status codes might indicate server issues
    return {
      accessible: false,
      blocked: false,
      needsToken: true,
      browser: browser.name,
      reason: `Unexpected status: ${response.status}`,
      cookieExists,
    }
  } catch (error: any) {
    // Network errors, timeouts, or CORS issues
    const isTimeout = error.name === 'AbortError'
    const isNetworkError = error.message?.includes('Failed to fetch') || 
                          error.message?.includes('NetworkError') ||
                          error.message?.includes('Network request failed')
    
    let reason = 'Unknown error'
    if (isTimeout) {
      reason = 'Request timeout - cookies may be blocked'
    } else if (isNetworkError) {
      reason = 'Network error - cookies may be blocked by browser privacy settings'
    } else {
      reason = error.message || 'Unknown error'
    }
    
    return {
      accessible: false,
      blocked: true,
      needsToken: true,
      browser: browser.name,
      reason,
      cookieExists,
    }
  }
}

/**
 * Detect Safari ITP (Intelligent Tracking Prevention) blocking
 */
export function detectSafariITP(): boolean {
  const browser = detectBrowser()
  if (!browser.isSafari) return false
  
  // Safari ITP blocks third-party cookies in certain scenarios
  // We can't directly detect this, but we can infer from cookie health check
  return false // Will be determined by checkCookieHealth
}

/**
 * Detect third-party cookie blocking
 */
export async function detectThirdPartyCookieBlocking(): Promise<boolean> {
  const browser = detectBrowser()
  
  // Known browsers that block third-party cookies
  if (browser.isSafari || browser.isFirefox) {
    // Check if cookies are actually blocked via health check
    const health = await checkCookieHealth()
    return health.blocked
  }
  
  return false
}

/**
 * Get user-friendly error message for cookie issues
 */
export function getCookieErrorMessage(status: CookieHealthStatus): string | null {
  if (status.accessible) return null
  
  if (status.blocked) {
    if (status.browser === 'Safari') {
      return 'Safari is blocking cookies. Please enable cookies in Safari settings or use Chrome/Firefox.'
    }
    if (status.browser === 'Firefox') {
      return 'Firefox is blocking cookies. Please enable cookies in Firefox settings.'
    }
    return 'Your browser is blocking cookies. Please enable cookies in your browser settings.'
  }
  
  if (status.needsToken) {
    return 'Cookie authentication unavailable. Using token authentication instead.'
  }
  
  return null
}
