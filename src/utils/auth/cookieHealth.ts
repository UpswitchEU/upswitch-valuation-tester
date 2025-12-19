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
  diagnostics?: {
    browser: string
    browserVersion: string
    isSafari: boolean
    isChrome: boolean
    isFirefox: boolean
    isEdge: boolean
    supportsThirdPartyCookies: boolean
    cookieExists: boolean
    currentOrigin: string
    apiUrl: string
    isSubdomain?: boolean
    hostname?: string
    responseTime?: number
    status?: number
    statusText?: string
    ok?: boolean
    authStatus?: string
    cookieDomain?: string
    error?: {
      name: string
      message: string
      isTimeout: boolean
      isNetworkError: boolean
    }
  }
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
 * Enhanced cookie health check with comprehensive diagnostics
 * Tests actual cookie accessibility with API call
 * Detects Safari ITP and third-party cookie blocking
 * Returns actionable browser-specific diagnostics
 */
export async function checkCookieHealth(): Promise<CookieHealthStatus> {
  const browser = detectBrowser()
  const cookieExists = checkCookieExists()
  
  // Detect subdomain
  let subdomain: string | null = null
  let isSubdomain = false
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.includes('.')) {
      const parts = hostname.split('.')
      if (parts.length > 2) {
        subdomain = parts[0]
        isSubdomain = true
      }
    }
  }
  
  // Enhanced diagnostics with subdomain detection
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    action: 'COOKIE_HEALTH_CHECK',
    browser: browser.name,
    browserVersion: browser.version,
    isSafari: browser.isSafari,
    isChrome: browser.isChrome,
    isFirefox: browser.isFirefox,
    isEdge: browser.isEdge,
    supportsThirdPartyCookies: browser.supportsThirdPartyCookies,
    cookieExists,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    subdomain: subdomain || 'main domain',
    isSubdomain,
    apiUrl: API_URL,
    crossSubdomainTest: isSubdomain,
  }
  
  // Log cookie health check start
  console.log('🔍 [CookieHealth] Starting cookie health check', JSON.stringify({
    ...diagnostics,
    cookieDetected: cookieExists,
    crossSubdomainContext: isSubdomain,
  }, null, 2))
  
  try {
    // Use GET request instead of HEAD for better compatibility and diagnostics
    // Some servers don't handle HEAD requests properly for auth endpoints
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2s timeout for health check
    
    const startTime = performance.now()
    
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // CRITICAL: Must include credentials for cross-subdomain cookies
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    const duration = performance.now() - startTime
    
    diagnostics.responseTime = Math.round(duration)
    diagnostics.status = response.status
    diagnostics.statusText = response.statusText
    diagnostics.ok = response.ok
    
    // Check response headers for cookie diagnostics
    const authStatus = response.headers.get('X-Auth-Status')
    const cookieDomain = response.headers.get('X-Cookie-Domain')
    const originHeader = response.headers.get('X-Origin')
    const subdomainHeader = response.headers.get('X-Subdomain')
    
    if (authStatus) diagnostics.authStatus = authStatus
    if (cookieDomain) diagnostics.cookieDomain = cookieDomain
    if (originHeader) diagnostics.originHeader = originHeader
    if (subdomainHeader) diagnostics.subdomainHeader = subdomainHeader
    
    // Log cookie health check result
    const healthResult = {
      accessible: response.ok,
      blocked: response.status === 0,
      status: response.status,
      responseTime: diagnostics.responseTime,
      cookieDomain,
      authStatus,
      isSubdomain,
      subdomain: subdomain || 'main',
    }
    console.log('📊 [CookieHealth] Cookie health check result', JSON.stringify(healthResult, null, 2))
    
    // Status 0 typically means network error (CORS blocked, cookie blocked, etc.)
    if (response.status === 0) {
      const blockedResult = {
        accessible: false,
        blocked: true,
        needsToken: true,
        browser: browser.name,
        reason: 'Network error - cookies may be blocked (CORS or browser privacy settings)',
        cookieExists,
        diagnostics,
        crossSubdomainIssue: isSubdomain,
        troubleshooting: isSubdomain ? [
          'Check if cookie domain is set to .upswitch.biz',
          'Verify CORS credentials are enabled',
          'Check browser privacy settings',
          'Safari ITP may block cross-subdomain cookies',
        ] : [],
      }
      console.warn('⚠️ [CookieHealth] Cookies blocked', JSON.stringify(blockedResult, null, 2))
      return blockedResult
    }
    
    // 200 OK means cookie is accessible and user is authenticated
    if (response.ok) {
      const successResult = {
        accessible: true,
        blocked: false,
        needsToken: false,
        browser: browser.name,
        reason: 'Cookies accessible and user authenticated',
        cookieExists,
        diagnostics,
        crossSubdomainSuccess: isSubdomain && cookieExists,
        message: isSubdomain 
          ? 'Cross-subdomain cookie authentication working'
          : 'Cookie authentication working',
      }
      console.log('✅ [CookieHealth] Cookies accessible', JSON.stringify(successResult, null, 2))
      return successResult
    }
    
    // 401/404 means no session, but cookies work (this is expected for guest users)
    if (response.status === 401 || response.status === 404) {
      // Check if this might be a cookie blocking issue
      // If we're on a subdomain and got 401, it could mean cookies aren't being sent
      const mightBeBlocked = diagnostics.isSubdomain && !cookieExists && browser.isSafari
      
      return {
        accessible: true, // Cookies work, just no session
        blocked: false,
        needsToken: false,
        browser: browser.name,
        reason: mightBeBlocked 
          ? 'No active session - cookies may not be shared across subdomains (Safari ITP?)'
          : 'No active session (expected for guest users)',
        cookieExists,
        diagnostics,
      }
    }
    
    // Other status codes might indicate server issues
    return {
      accessible: false,
      blocked: false,
      needsToken: true,
      browser: browser.name,
      reason: `Unexpected status: ${response.status} ${response.statusText}`,
      cookieExists,
      diagnostics,
    }
  } catch (error: any) {
    // Network errors, timeouts, or CORS issues
    const isTimeout = error.name === 'AbortError'
    const isNetworkError = error.message?.includes('Failed to fetch') || 
                          error.message?.includes('NetworkError') ||
                          error.message?.includes('Network request failed') ||
                          error.message?.includes('CORS')
    
    let reason = 'Unknown error'
    if (isTimeout) {
      reason = 'Request timeout - cookies may be blocked or server unreachable'
    } else if (isNetworkError) {
      // Check if it's likely a CORS issue
      const isCorsIssue = error.message?.includes('CORS') || 
                         (diagnostics.isSubdomain && browser.isSafari)
      reason = isCorsIssue
        ? 'CORS error - cookies may be blocked by browser privacy settings (Safari ITP, Firefox ETP)'
        : 'Network error - cookies may be blocked by browser privacy settings'
    } else {
      reason = error.message || 'Unknown error'
    }
    
    diagnostics.error = {
      name: error.name,
      message: error.message,
      isTimeout,
      isNetworkError,
    }
    
    return {
      accessible: false,
      blocked: true,
      needsToken: true,
      browser: browser.name,
      reason,
      cookieExists,
      diagnostics,
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

