/**
 * Error Recovery System for Authentication
 * 
 * Classifies errors by type and implements recovery strategies
 */

export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  COOKIE_BLOCKED = 'COOKIE_BLOCKED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AuthError {
  type: AuthErrorType
  message: string
  originalError?: any
  retryable: boolean
  recoveryStrategy: RecoveryStrategy
}

export enum RecoveryStrategy {
  RETRY_WITH_BACKOFF = 'RETRY_WITH_BACKOFF',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  FALLBACK_TO_TOKEN = 'FALLBACK_TO_TOKEN',
  REDIRECT_TO_LOGIN = 'REDIRECT_TO_LOGIN',
  CONTINUE_AS_GUEST = 'CONTINUE_AS_GUEST',
  NO_RECOVERY = 'NO_RECOVERY',
}

/**
 * Classify authentication error
 */
export function classifyAuthError(error: any): AuthError {
  // Network errors
  if (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('Network request failed') ||
    error?.name === 'NetworkError' ||
    error?.code === 'NETWORK_ERROR'
  ) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: 'Network error - please check your connection',
      originalError: error,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
    }
  }

  // Timeout errors
  if (
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('aborted')
  ) {
    return {
      type: AuthErrorType.TIMEOUT_ERROR,
      message: 'Request timeout - please try again',
      originalError: error,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
    }
  }

  // Authentication errors (401, 403)
  if (
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    error?.status === 401 ||
    error?.status === 403
  ) {
    return {
      type: AuthErrorType.AUTH_ERROR,
      message: 'Authentication failed - please log in again',
      originalError: error,
      retryable: false,
      recoveryStrategy: RecoveryStrategy.REFRESH_TOKEN,
    }
  }

  // Server errors (5xx)
  if (
    error?.response?.status >= 500 ||
    error?.status >= 500 ||
    error?.response?.status === 502 ||
    error?.response?.status === 503 ||
    error?.response?.status === 504
  ) {
    return {
      type: AuthErrorType.SERVER_ERROR,
      message: 'Server error - please try again later',
      originalError: error,
      retryable: true,
      recoveryStrategy: RecoveryStrategy.RETRY_WITH_BACKOFF,
    }
  }

  // Cookie blocked errors
  if (
    error?.message?.includes('cookie') ||
    error?.message?.includes('Cookie') ||
    error?.code === 'COOKIE_BLOCKED'
  ) {
    return {
      type: AuthErrorType.COOKIE_BLOCKED,
      message: 'Cookies are blocked - using token authentication',
      originalError: error,
      retryable: false,
      recoveryStrategy: RecoveryStrategy.FALLBACK_TO_TOKEN,
    }
  }

  // Unknown errors
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: error?.message || 'An unexpected error occurred',
    originalError: error,
    retryable: false,
    recoveryStrategy: RecoveryStrategy.CONTINUE_AS_GUEST,
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableAuthError(error: any): boolean {
  const classified = classifyAuthError(error)
  return classified.retryable
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error: any): string {
  const classified = classifyAuthError(error)
  return classified.message
}

/**
 * Get recovery strategy for error
 */
export function getRecoveryStrategy(error: any): RecoveryStrategy {
  const classified = classifyAuthError(error)
  return classified.recoveryStrategy
}

/**
 * Check if error indicates cookie blocking
 */
export function isCookieBlockedError(error: any): boolean {
  const classified = classifyAuthError(error)
  return classified.type === AuthErrorType.COOKIE_BLOCKED
}

/**
 * Check if error indicates network issues
 */
export function isNetworkError(error: any): boolean {
  const classified = classifyAuthError(error)
  return (
    classified.type === AuthErrorType.NETWORK_ERROR ||
    classified.type === AuthErrorType.TIMEOUT_ERROR
  )
}

/**
 * Check if error indicates server issues
 */
export function isServerError(error: any): boolean {
  const classified = classifyAuthError(error)
  return classified.type === AuthErrorType.SERVER_ERROR
}

/**
 * Check if error indicates authentication failure
 */
export function isAuthError(error: any): boolean {
  const classified = classifyAuthError(error)
  return classified.type === AuthErrorType.AUTH_ERROR
}

