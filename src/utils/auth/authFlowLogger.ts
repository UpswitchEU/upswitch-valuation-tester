/**
 * Structured Auth Flow Logger
 * 
 * Provides consistent, structured logging format for authentication flows.
 * Designed for testing and debugging cross-subdomain cookie authentication.
 * 
 * Features:
 * - Consistent log format across all auth flows
 * - Correlation IDs for request tracking
 * - Structured JSON logging for easy parsing
 * - Log levels (debug, info, warn, error)
 * - Cookie and subdomain context in all logs
 */

import { authLogger } from './authLogger'

export interface AuthFlowLogContext {
  timestamp?: string
  action: string
  step?: string
  priority?: number
  userId?: string
  email?: string
  origin?: string
  subdomain?: string | null
  isSubdomainRequest?: boolean
  cookieDetected?: boolean
  cookieDomain?: string
  cookieHealth?: any
  duration?: number
  error?: string
  errorType?: string
  [key: string]: any
}

class AuthFlowLogger {
  private correlationId: string | null = null

  /**
   * Generate correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Set correlation ID for current request flow
   */
  setCorrelationId(id?: string): void {
    this.correlationId = id || this.generateCorrelationId()
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: 'debug' | 'info' | 'warn' | 'error',
    context: AuthFlowLogContext
  ): void {
    const logEntry = {
      timestamp: context.timestamp || new Date().toISOString(),
      correlationId: this.correlationId,
      level,
      ...context,
    }

    // Use appropriate logger method based on level
    switch (level) {
      case 'debug':
        authLogger.debug(`[AuthFlow] ${context.action}`, logEntry)
        break
      case 'info':
        authLogger.info(`[AuthFlow] ${context.action}`, logEntry)
        break
      case 'warn':
        authLogger.warn(`[AuthFlow] ${context.action}`, logEntry)
        break
      case 'error':
        authLogger.error(`[AuthFlow] ${context.action}`, logEntry)
        break
    }
  }

  /**
   * Log debug message
   */
  debug(context: AuthFlowLogContext): void {
    this.createLogEntry('debug', context)
  }

  /**
   * Log info message
   */
  info(context: AuthFlowLogContext): void {
    this.createLogEntry('info', context)
  }

  /**
   * Log warning message
   */
  warn(context: AuthFlowLogContext): void {
    this.createLogEntry('warn', context)
  }

  /**
   * Log error message
   */
  error(context: AuthFlowLogContext): void {
    this.createLogEntry('error', context)
  }

  /**
   * Log cookie detection
   */
  logCookieDetection(detected: boolean, context: Partial<AuthFlowLogContext>): void {
    this.info({
      action: 'COOKIE_DETECTION',
      cookieDetected: detected,
      ...context,
    })
  }

  /**
   * Log cross-subdomain cookie authentication
   */
  logCrossSubdomainAuth(success: boolean, context: Partial<AuthFlowLogContext>): void {
    if (success) {
      this.info({
        action: 'CROSS_SUBDOMAIN_AUTH_SUCCESS',
        message: 'Cookie from main domain successfully authenticated on subdomain',
        ...context,
      })
    } else {
      this.warn({
        action: 'CROSS_SUBDOMAIN_AUTH_FAILED',
        message: 'Cross-subdomain cookie authentication failed',
        ...context,
      })
    }
  }

  /**
   * Log auth flow step
   */
  logStep(step: string, priority: number, context: Partial<AuthFlowLogContext>): void {
    this.info({
      action: 'AUTH_STEP',
      step,
      priority,
      ...context,
    })
  }

  /**
   * Log cookie health check
   */
  logCookieHealth(health: any, context: Partial<AuthFlowLogContext>): void {
    this.info({
      action: 'COOKIE_HEALTH_CHECK',
      cookieHealth: health,
      ...context,
    })
  }

  /**
   * Log authentication success
   */
  logAuthSuccess(userId: string, email: string, context: Partial<AuthFlowLogContext>): void {
    this.info({
      action: 'AUTH_SUCCESS',
      userId,
      email,
      ...context,
    })
  }

  /**
   * Log authentication failure
   */
  logAuthFailure(reason: string, context: Partial<AuthFlowLogContext>): void {
    this.warn({
      action: 'AUTH_FAILURE',
      reason,
      ...context,
    })
  }
}

// Export singleton instance
export const authFlowLogger = new AuthFlowLogger()

// Export class for testing
export { AuthFlowLogger }
