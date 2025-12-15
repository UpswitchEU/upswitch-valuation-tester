/**
 * Type-Safe Error Guards
 *
 * Single Responsibility: Type guards for instanceof error checking.
 * Enables specific error handling without generic catch blocks.
 *
 * @module utils/errors/errorGuards
 */

import {
  ApplicationError,
  CalculationError,
  DatabaseError,
  DataQualityError,
  IntegrationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  RestorationError,
  SessionConflictError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from './ApplicationErrors'

/**
 * Type guard for ValidationError
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (isValidationError(error)) {
 *     console.log('Validation failed:', error.message)
 *   }
 * }
 * ```
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Type guard for SessionConflictError
 */
export function isSessionConflictError(error: unknown): error is SessionConflictError {
  return error instanceof SessionConflictError
}

/**
 * Type guard for NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

/**
 * Type guard for RestorationError
 */
export function isRestorationError(error: unknown): error is RestorationError {
  return error instanceof RestorationError
}

/**
 * Type guard for RateLimitError
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}

/**
 * Type guard for NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

/**
 * Type guard for UnauthorizedError
 */
export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError
}

/**
 * Type guard for DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}

/**
 * Type guard for CalculationError
 */
export function isCalculationError(error: unknown): error is CalculationError {
  return error instanceof CalculationError
}

/**
 * Type guard for DataQualityError
 */
export function isDataQualityError(error: unknown): error is DataQualityError {
  return error instanceof DataQualityError
}

/**
 * Type guard for IntegrationError
 */
export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError
}

/**
 * Type guard for TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

/**
 * Type guard for any ApplicationError
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

/**
 * Check if error is retryable (transient failure)
 *
 * Retryable errors:
 * - NetworkError (network glitch)
 * - RateLimitError (temporary throttle)
 * - TimeoutError (slow response)
 * - IntegrationError (external service down)
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (isRetryable(error)) {
 *     await retryWithBackoff(() => operation())
 *   } else {
 *     throw error // Don't retry validation errors, etc.
 *   }
 * }
 * ```
 */
export function isRetryable(error: unknown): boolean {
  return (
    isNetworkError(error) ||
    isRateLimitError(error) ||
    isTimeoutError(error) ||
    isIntegrationError(error)
  )
}

/**
 * Check if error is recoverable (user can fix or system can handle)
 *
 * Recoverable errors:
 * - ValidationError (user can correct input)
 * - SessionConflictError (load existing session)
 * - NetworkError (retry)
 * - RateLimitError (wait and retry)
 *
 * Non-recoverable errors:
 * - CalculationError (logic bug)
 * - DataQualityError (data corruption)
 */
export function isRecoverable(error: unknown): boolean {
  return (
    isValidationError(error) ||
    isSessionConflictError(error) ||
    isNetworkError(error) ||
    isRateLimitError(error) ||
    isRestorationError(error) ||
    isTimeoutError(error) ||
    isIntegrationError(error)
  )
}
