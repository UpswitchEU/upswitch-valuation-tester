/**
 * Auth Status Component
 * 
 * Displays authentication status with loading states, success indicators,
 * and user-friendly error messages
 */

import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthProvider'
import { useAuthStore } from '../store/useAuthStore'

export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, cookieHealth, refreshAuth } = useAuth()
  const checkSession = useAuthStore((state) => state.checkSession)
  const [manualCheckLoading, setManualCheckLoading] = useState(false)
  const [manualCheckResult, setManualCheckResult] = useState<string | null>(null)
  
  // Manual retry function
  const handleRetry = async () => {
    console.log('🔄 [MANUAL RETRY] User clicked retry - checking for cookie...')
    if (typeof document !== 'undefined') {
      const hasCookie = document.cookie.includes('upswitch_session')
      console.log('🔄 [MANUAL RETRY] Cookie present:', hasCookie ? '✅ YES' : '❌ NO')
      console.log('🔄 [MANUAL RETRY] All cookies:', document.cookie || 'none')
    }
    await refreshAuth()
  }

  // Manual authentication check - directly calls checkSession() bypassing initAuth()
  const handleManualAuthCheck = async () => {
    console.error('🔍🔍🔍 [MANUAL AUTH CHECK] ===========================================')
    console.error('🔍🔍🔍 [MANUAL AUTH CHECK] User clicked "Check Authentication Now"')
    console.error('🔍🔍🔍 [MANUAL AUTH CHECK] This bypasses initAuth() and calls checkSession() directly')
    console.error('🔍🔍🔍 [MANUAL AUTH CHECK] Timestamp:', new Date().toISOString())
    
    setManualCheckLoading(true)
    setManualCheckResult(null)
    
    try {
      // Check cookie first
      if (typeof document !== 'undefined') {
        const hasCookie = document.cookie.includes('upswitch_session')
        console.error('🔍🔍🔍 [MANUAL AUTH CHECK] Cookie present:', hasCookie ? '✅ YES' : '❌ NO')
        console.error('🔍🔍🔍 [MANUAL AUTH CHECK] All cookies:', document.cookie || 'NONE')
      }
      
      console.error('🔍🔍🔍 [MANUAL AUTH CHECK] Calling checkSession() now...')
      const authenticatedUser = await checkSession()
      
      if (authenticatedUser) {
        console.error('✅✅✅ [MANUAL AUTH CHECK] SUCCESS! User authenticated:', authenticatedUser.email)
        setManualCheckResult(`✅ Success! Authenticated as ${authenticatedUser.email}`)
        // Refresh auth state
        await refreshAuth()
      } else {
        console.error('❌❌❌ [MANUAL AUTH CHECK] No user returned - authentication failed')
        setManualCheckResult('❌ No active session found. Ensure you are logged into upswitch.biz')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌❌❌ [MANUAL AUTH CHECK] ERROR:', errorMessage)
      console.error('❌❌❌ [MANUAL AUTH CHECK] Error stack:', err instanceof Error ? err.stack : 'N/A')
      setManualCheckResult(`❌ Error: ${errorMessage}`)
    } finally {
      setManualCheckLoading(false)
      console.error('🔍🔍🔍 [MANUAL AUTH CHECK] ===========================================')
    }
  }

  if (isLoading) {
    return (
      <div className="auth-status auth-status-loading" role="status" aria-live="polite">
        <div className="auth-status-skeleton">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
        <span className="sr-only">Checking authentication...</span>
      </div>
    )
  }

  if (error) {
    // Check if error is related to cookie blocking
    const isCookieBlocked = error.includes('Cookies are blocked') || 
                           cookieHealth?.blocked ||
                           cookieHealth?.needsToken
    
    return (
      <div className="auth-status auth-status-error" role="alert">
        <div className="auth-status-icon error">⚠️</div>
        <div className="auth-status-content">
          <p className="auth-status-message">{error}</p>
          {isCookieBlocked && (
            <div className="auth-status-hint" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Solution:</strong> Navigate to{' '}
                <a 
                  href="https://upswitch.biz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', textDecoration: 'underline' }}
                >
                  upswitch.biz
                </a>
                {' '}and click the link to this tool. This will automatically authenticate you.
              </p>
              {cookieHealth?.browser === 'Safari' && (
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  💡 Safari blocks cross-subdomain cookies. Using the link from upswitch.biz will use token authentication instead.
                </p>
              )}
            </div>
          )}
          <button
            className="auth-status-retry"
            onClick={() => window.location.reload()}
            aria-label="Retry authentication"
            style={{ marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-status auth-status-success" role="status">
        <div className="auth-status-icon success">✅</div>
        <div className="auth-status-content">
          <p className="auth-status-message">
            Authenticated as {user.email || user.name || 'User'}
          </p>
        </div>
      </div>
    )
  }

  // Guest mode - Enhanced messaging for cookie detection
  const showCookieBlockingHint = cookieHealth?.blocked || cookieHealth?.needsToken
  const isSubdomain = typeof window !== 'undefined' && window.location.hostname.includes('valuation.')
  
  return (
    <div className="auth-status auth-status-guest" role="status">
      <div className="auth-status-content">
        <p className="auth-status-message">Continuing as guest</p>
        {isSubdomain && (
          <div className="auth-status-hint" style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem', border: '1px solid #fbbf24' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              🔍 <strong>Cookie Detection Status:</strong>
            </p>
            {typeof document !== 'undefined' && document.cookie.includes('upswitch_session') ? (
              <p style={{ color: '#059669', marginBottom: '0.5rem' }}>
                ✅ Cookie detected in browser - checking authentication...
              </p>
            ) : (
              <p style={{ color: '#dc2626', marginBottom: '0.5rem' }}>
                ❌ No cookie detected - ensure you're logged into{' '}
                <a 
                  href="https://upswitch.biz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}
                >
                  upswitch.biz
                </a>
              </p>
            )}
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.5rem' }}>
              💡 <strong>Tip:</strong> Open browser DevTools (F12) → Console tab to see detailed cookie detection logs
            </p>
          </div>
        )}
        {showCookieBlockingHint ? (
          <div className="auth-status-hint" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              ⚠️ Cookies are blocked by your browser ({cookieHealth?.browser || 'unknown'}).
            </p>
            <p>
              💡 <strong>To authenticate:</strong> Navigate here from{' '}
              <a 
                href="https://upswitch.biz" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                upswitch.biz
              </a>
              {' '}to get automatic token-based authentication.
            </p>
            {cookieHealth?.reason && (
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '0.25rem', fontStyle: 'italic' }}>
                {cookieHealth.reason}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="auth-status-hint" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              💡 To access your account: Navigate here from{' '}
              <a 
                href="https://upswitch.biz" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                upswitch.biz
              </a>
              {' '}to get automatic authentication
            </p>
            {isSubdomain && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={handleManualAuthCheck}
                  disabled={manualCheckLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: manualCheckLoading ? '#6b7280' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: manualCheckLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {manualCheckLoading ? '⏳ Checking...' : '🔍 Check Authentication Now'}
                </button>
                {manualCheckResult && (
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: manualCheckResult.startsWith('✅') ? '#059669' : '#dc2626',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: manualCheckResult.startsWith('✅') ? '#d1fae5' : '#fee2e2',
                    borderRadius: '0.375rem',
                  }}>
                    {manualCheckResult}
                  </p>
                )}
                <button
                  onClick={handleRetry}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  🔄 Retry Cookie Check
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Auth Loading Indicator
 * Simple loading spinner for auth operations
 */
export const AuthLoadingIndicator: React.FC<{ message?: string }> = ({ message = 'Authenticating...' }) => {
  return (
    <div className="auth-loading-indicator" role="status" aria-live="polite">
      <div className="auth-spinner" aria-hidden="true" />
      <span className="auth-loading-message">{message}</span>
      <span className="sr-only">{message}</span>
    </div>
  )
}

/**
 * Auth Error Message
 * User-friendly error display with retry option
 */
export const AuthErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => {
  return (
    <div className="auth-error-message" role="alert">
      <div className="auth-error-icon">⚠️</div>
      <div className="auth-error-content">
        <p className="auth-error-text">{error}</p>
        {onRetry && (
          <button
            className="auth-error-retry"
            onClick={onRetry}
            aria-label="Retry authentication"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

