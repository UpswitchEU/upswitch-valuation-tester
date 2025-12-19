/**
 * Auth Status Component
 * 
 * Displays authentication status with loading states, success indicators,
 * and user-friendly error messages
 */

import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth()

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
    return (
      <div className="auth-status auth-status-error" role="alert">
        <div className="auth-status-icon error">⚠️</div>
        <div className="auth-status-content">
          <p className="auth-status-message">{error}</p>
          <button
            className="auth-status-retry"
            onClick={() => window.location.reload()}
            aria-label="Retry authentication"
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

  // Guest mode
  return (
    <div className="auth-status auth-status-guest" role="status">
      <div className="auth-status-content">
        <p className="auth-status-message">Continuing as guest</p>
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
