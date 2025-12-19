/**
 * Network Request Logger
 * 
 * Intercepts fetch calls to /api/auth/me and logs all request/response details
 * Uses console.error for maximum visibility
 */

/**
 * Intercept fetch calls to authentication endpoints
 */
export function setupNetworkLogger(): void {
  if (typeof window === 'undefined') return
  
  // Store original fetch
  const originalFetch = window.fetch
  
  // Override fetch
  window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
    const [input, init] = args
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url)
    
    // Only intercept auth endpoints
    if (url.includes('/api/auth/me')) {
      console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] ===========================================')
      console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Intercepted fetch request to /api/auth/me')
      console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] URL:', url)
      console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Method:', init?.method || 'GET')
      console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Timestamp:', new Date().toISOString())
      
      // Log request headers
      if (init?.headers) {
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Request headers:', init.headers)
      }
      
      // Log credentials
      if (init?.credentials) {
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Credentials:', init.credentials)
      }
      
      // Log cookies
      if (typeof document !== 'undefined') {
        const hasCookie = document.cookie.includes('upswitch_session')
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Cookie present:', hasCookie ? '✅ YES' : '❌ NO')
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] All cookies:', document.cookie || 'NONE')
      }
      
      const startTime = performance.now()
      
      try {
        // Make the actual request
        const response = await originalFetch.apply(this, args)
        const duration = Math.round(performance.now() - startTime)
        
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Response received')
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Status:', response.status, response.statusText)
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Duration:', duration, 'ms')
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] OK:', response.ok)
        
        // Log response headers
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Response headers:', responseHeaders)
        
        // Clone response to read body without consuming it
        const clonedResponse = response.clone()
        try {
          const data = await clonedResponse.json()
          console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Response data:', data)
          
          if (data.success && data.data?.user) {
            console.error('✅✅✅ [NETWORK INTERCEPTOR] Authentication SUCCESS!')
            console.error('✅✅✅ [NETWORK INTERCEPTOR] User:', data.data.user.email)
          } else if (response.status === 401 || response.status === 404) {
            console.error('❌❌❌ [NETWORK INTERCEPTOR] Authentication FAILED - No active session')
          }
        } catch (jsonError) {
          console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Could not parse response as JSON')
        }
        
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] ===========================================')
        
        return response
      } catch (error) {
        const duration = Math.round(performance.now() - startTime)
        console.error('❌❌❌ [NETWORK INTERCEPTOR] Request FAILED')
        console.error('❌❌❌ [NETWORK INTERCEPTOR] Error:', error)
        console.error('❌❌❌ [NETWORK INTERCEPTOR] Duration:', duration, 'ms')
        console.error('❌❌❌ [NETWORK INTERCEPTOR] Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('❌❌❌ [NETWORK INTERCEPTOR] Error stack:', error instanceof Error ? error.stack : 'N/A')
        console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] ===========================================')
        throw error
      }
    }
    
    // For non-auth endpoints, use original fetch
    return originalFetch.apply(this, args)
  }
  
  console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Network logger initialized')
  console.error('🌐🌐🌐 [NETWORK INTERCEPTOR] Will intercept all requests to /api/auth/me')
}

/**
 * Initialize network logger
 * Call this early in the app lifecycle
 */
export function initNetworkLogger(): void {
  if (typeof window === 'undefined') return
  
  // Only set up once
  if ((window as any).__NETWORK_LOGGER_INITIALIZED__) {
    return
  }
  
  setupNetworkLogger()
  ;(window as any).__NETWORK_LOGGER_INITIALIZED__ = true
}
