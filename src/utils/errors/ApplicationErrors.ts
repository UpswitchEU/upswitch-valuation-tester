/**
 * Application Error Classes
 * 
 * Single Responsibility: Define comprehensive error hierarchy for type-safe error handling.
 * Follows BANK_GRADE_EXCELLENCE_FRAMEWORK.md (lines 902-930) error architecture.
 * 
 * @module utils/errors/ApplicationErrors
 */

/**
 * Base application error
 * 
 * All custom errors extend this class for consistent error handling.
 * Includes error code, context, and timestamp for debugging and audit trails.
 */
export class ApplicationError extends Error {
  public readonly timestamp: Date
  
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
  
  /**
   * Serialize error for logging/transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * Input validation error
 * 
 * Use when: User input fails validation rules
 * HTTP Status: 400 Bad Request
 * Recoverable: Yes (user can correct input)
 * 
 * @example
 * ```typescript
 * if (!email.includes('@')) {
 *   throw new ValidationError('Invalid email format', { email })
 * }
 * ```
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context)
  }
}

/**
 * Session conflict error (409 Conflict)
 * 
 * Use when: Session already exists (concurrent creation attempts)
 * HTTP Status: 409 Conflict
 * Recoverable: Yes (load existing session)
 * 
 * @example
 * ```typescript
 * throw new SessionConflictError('Session already exists', { reportId: 'val_123' })
 * ```
 */
export class SessionConflictError extends ApplicationError {
  constructor(message: string, public readonly reportId: string, context?: Record<string, unknown>) {
    super(message, 'SESSION_CONFLICT', { ...context, reportId })
  }
}

/**
 * Network error
 * 
 * Use when: Network request fails (fetch, axios)
 * HTTP Status: 0 (no response)
 * Recoverable: Yes (retry with backoff)
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof TypeError && error.message.includes('fetch')) {
 *     throw new NetworkError('Failed to connect to server')
 *   }
 * }
 * ```
 */
export class NetworkError extends ApplicationError {
  constructor(message: string = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context)
  }
}

/**
 * Conversation restoration error
 * 
 * Use when: Cannot restore conversation from Python backend
 * HTTP Status: N/A
 * Recoverable: Yes (start new conversation)
 * 
 * @example
 * ```typescript
 * throw new RestorationError('Failed to restore conversation', { 
 *   sessionId: 'val_123',
 *   messageCount: 0 
 * })
 * ```
 */
export class RestorationError extends ApplicationError {
  constructor(message: string, public readonly sessionId: string, context?: Record<string, unknown>) {
    super(message, 'RESTORATION_ERROR', { ...context, sessionId })
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * 
 * Use when: Backend rate limit exceeded
 * HTTP Status: 429
 * Recoverable: Yes (retry with exponential backoff)
 * 
 * @example
 * ```typescript
 * if (response.status === 429) {
 *   throw new RateLimitError('Rate limit exceeded', { 
 *     endpoint: '/api/sessions',
 *     retryAfter: response.headers.get('Retry-After') 
 *   })
 * }
 * ```
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', context)
  }
}

/**
 * Resource not found error (404)
 * 
 * Use when: Requested resource doesn't exist
 * HTTP Status: 404
 * Recoverable: No (resource doesn't exist)
 * 
 * @example
 * ```typescript
 * if (!session) {
 *   throw new NotFoundError('Session', reportId)
 * }
 * ```
 */
export class NotFoundError extends ApplicationError {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${resourceType} not found: ${resourceId}`,
      'NOT_FOUND',
      { ...context, resourceType, resourceId }
    )
  }
}

/**
 * Unauthorized error (401)
 * 
 * Use when: Authentication required or failed
 * HTTP Status: 401
 * Recoverable: Yes (redirect to login)
 * 
 * @example
 * ```typescript
 * if (!authToken) {
 *   throw new UnauthorizedError('Authentication required')
 * }
 * ```
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', context)
  }
}

/**
 * Database error
 * 
 * Use when: Database operation fails
 * HTTP Status: 503 Service Unavailable
 * Recoverable: Maybe (retry for transient issues)
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   if (error.code === 'ECONNREFUSED') {
 *     throw new DatabaseError('Database connection failed')
 *   }
 * }
 * ```
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context)
  }
}

/**
 * Calculation error
 * 
 * Use when: Valuation calculation fails
 * HTTP Status: 500 Internal Server Error
 * Recoverable: No (requires fixing calculation logic)
 * 
 * @example
 * ```typescript
 * if (multiple < 0) {
 *   throw new CalculationError('Multiple cannot be negative', { multiple })
 * }
 * ```
 */
export class CalculationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CALCULATION_ERROR', context)
  }
}

/**
 * Data quality error
 * 
 * Use when: Data integrity issues detected
 * HTTP Status: 422 Unprocessable Entity
 * Recoverable: No (requires fixing data at source)
 * 
 * @example
 * ```typescript
 * if (revenue < 0) {
 *   throw new DataQualityError('Revenue cannot be negative', { 
 *     revenue,
 *     source: 'user_input' 
 *   })
 * }
 * ```
 */
export class DataQualityError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_QUALITY_ERROR', context)
  }
}

/**
 * Integration error
 * 
 * Use when: External service integration fails
 * HTTP Status: 502 Bad Gateway
 * Recoverable: Yes (retry)
 * 
 * @example
 * ```typescript
 * throw new IntegrationError('KBO API unavailable', { 
 *   service: 'KBO',
 *   endpoint: '/companies/search' 
 * })
 * ```
 */
export class IntegrationError extends ApplicationError {
  constructor(
    message: string,
    public readonly service: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'INTEGRATION_ERROR', { ...context, service })
  }
}

/**
 * Timeout error
 * 
 * Use when: Operation exceeds time limit
 * HTTP Status: 504 Gateway Timeout
 * Recoverable: Yes (retry with increased timeout)
 * 
 * @example
 * ```typescript
 * throw new TimeoutError('Request timeout after 30s', { 
 *   operation: 'valuation_calculation',
 *   timeout_ms: 30000 
 * })
 * ```
 */
export class TimeoutError extends ApplicationError {
  constructor(
    message: string,
    public readonly timeout_ms: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', { ...context, timeout_ms })
  }
}

/**
 * Check if error is retryable
 * 
 * Determines if an error type should trigger automatic retry logic.
 * 
 * @param error - Error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof RateLimitError ||
    error instanceof TimeoutError ||
    error instanceof IntegrationError
  )
}

/**
 * Map HTTP status code to appropriate error class
 * 
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param context - Additional context
 * @returns Appropriate error instance
 */
export function createErrorFromStatus(
  statusCode: number,
  message: string,
  context?: Record<string, unknown>
): ApplicationError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, context)
    case 401:
      return new UnauthorizedError(message, context)
    case 404:
      return new NotFoundError(
        context?.resourceType as string || 'Resource',
        context?.resourceId as string || 'unknown',
        context
      )
    case 409:
      return new SessionConflictError(
        message,
        context?.reportId as string || 'unknown',
        context
      )
    case 422:
      return new DataQualityError(message, context)
    case 429:
      return new RateLimitError(message, context)
    case 500:
      return new CalculationError(message, context)
    case 502:
      return new IntegrationError(
        message,
        context?.service as string || 'Unknown',
        context
      )
    case 503:
      return new DatabaseError(message, context)
    case 504:
      return new TimeoutError(
        message,
        context?.timeout_ms as number || 30000,
        context
      )
    default:
      return new ApplicationError(message, 'UNKNOWN_ERROR', context)
  }
}

/**
 * Application Error Classes
 * 
 * Single Responsibility: Define comprehensive error hierarchy for type-safe error handling.
 * Follows BANK_GRADE_EXCELLENCE_FRAMEWORK.md (lines 902-930) error architecture.
 * 
 * @module utils/errors/ApplicationErrors
 */

/**
 * Base application error
 * 
 * All custom errors extend this class for consistent error handling.
 * Includes error code, context, and timestamp for debugging and audit trails.
 */
export class ApplicationError extends Error {
  public readonly timestamp: Date
  
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
  
  /**
   * Serialize error for logging/transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }
}

/**
 * Input validation error
 * 
 * Use when: User input fails validation rules
 * HTTP Status: 400 Bad Request
 * Recoverable: Yes (user can correct input)
 * 
 * @example
 * ```typescript
 * if (!email.includes('@')) {
 *   throw new ValidationError('Invalid email format', { email })
 * }
 * ```
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context)
  }
}

/**
 * Session conflict error (409 Conflict)
 * 
 * Use when: Session already exists (concurrent creation attempts)
 * HTTP Status: 409 Conflict
 * Recoverable: Yes (load existing session)
 * 
 * @example
 * ```typescript
 * throw new SessionConflictError('Session already exists', { reportId: 'val_123' })
 * ```
 */
export class SessionConflictError extends ApplicationError {
  constructor(message: string, public readonly reportId: string, context?: Record<string, unknown>) {
    super(message, 'SESSION_CONFLICT', { ...context, reportId })
  }
}

/**
 * Network error
 * 
 * Use when: Network request fails (fetch, axios)
 * HTTP Status: 0 (no response)
 * Recoverable: Yes (retry with backoff)
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof TypeError && error.message.includes('fetch')) {
 *     throw new NetworkError('Failed to connect to server')
 *   }
 * }
 * ```
 */
export class NetworkError extends ApplicationError {
  constructor(message: string = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context)
  }
}

/**
 * Conversation restoration error
 * 
 * Use when: Cannot restore conversation from Python backend
 * HTTP Status: N/A
 * Recoverable: Yes (start new conversation)
 * 
 * @example
 * ```typescript
 * throw new RestorationError('Failed to restore conversation', { 
 *   sessionId: 'val_123',
 *   messageCount: 0 
 * })
 * ```
 */
export class RestorationError extends ApplicationError {
  constructor(message: string, public readonly sessionId: string, context?: Record<string, unknown>) {
    super(message, 'RESTORATION_ERROR', { ...context, sessionId })
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * 
 * Use when: Backend rate limit exceeded
 * HTTP Status: 429
 * Recoverable: Yes (retry with exponential backoff)
 * 
 * @example
 * ```typescript
 * if (response.status === 429) {
 *   throw new RateLimitError('Rate limit exceeded', { 
 *     endpoint: '/api/sessions',
 *     retryAfter: response.headers.get('Retry-After') 
 *   })
 * }
 * ```
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', context)
  }
}

/**
 * Resource not found error (404)
 * 
 * Use when: Requested resource doesn't exist
 * HTTP Status: 404
 * Recoverable: No (resource doesn't exist)
 * 
 * @example
 * ```typescript
 * if (!session) {
 *   throw new NotFoundError('Session', reportId)
 * }
 * ```
 */
export class NotFoundError extends ApplicationError {
  constructor(
    public readonly resourceType: string,
    public readonly resourceId: string,
    context?: Record<string, unknown>
  ) {
    super(
      `${resourceType} not found: ${resourceId}`,
      'NOT_FOUND',
      { ...context, resourceType, resourceId }
    )
  }
}

/**
 * Unauthorized error (401)
 * 
 * Use when: Authentication required or failed
 * HTTP Status: 401
 * Recoverable: Yes (redirect to login)
 * 
 * @example
 * ```typescript
 * if (!authToken) {
 *   throw new UnauthorizedError('Authentication required')
 * }
 * ```
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', context)
  }
}

/**
 * Database error
 * 
 * Use when: Database operation fails
 * HTTP Status: 503 Service Unavailable
 * Recoverable: Maybe (retry for transient issues)
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   if (error.code === 'ECONNREFUSED') {
 *     throw new DatabaseError('Database connection failed')
 *   }
 * }
 * ```
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context)
  }
}

/**
 * Calculation error
 * 
 * Use when: Valuation calculation fails
 * HTTP Status: 500 Internal Server Error
 * Recoverable: No (requires fixing calculation logic)
 * 
 * @example
 * ```typescript
 * if (multiple < 0) {
 *   throw new CalculationError('Multiple cannot be negative', { multiple })
 * }
 * ```
 */
export class CalculationError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CALCULATION_ERROR', context)
  }
}

/**
 * Data quality error
 * 
 * Use when: Data integrity issues detected
 * HTTP Status: 422 Unprocessable Entity
 * Recoverable: No (requires fixing data at source)
 * 
 * @example
 * ```typescript
 * if (revenue < 0) {
 *   throw new DataQualityError('Revenue cannot be negative', { 
 *     revenue,
 *     source: 'user_input' 
 *   })
 * }
 * ```
 */
export class DataQualityError extends ApplicationError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATA_QUALITY_ERROR', context)
  }
}

/**
 * Integration error
 * 
 * Use when: External service integration fails
 * HTTP Status: 502 Bad Gateway
 * Recoverable: Yes (retry)
 * 
 * @example
 * ```typescript
 * throw new IntegrationError('KBO API unavailable', { 
 *   service: 'KBO',
 *   endpoint: '/companies/search' 
 * })
 * ```
 */
export class IntegrationError extends ApplicationError {
  constructor(
    message: string,
    public readonly service: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'INTEGRATION_ERROR', { ...context, service })
  }
}

/**
 * Timeout error
 * 
 * Use when: Operation exceeds time limit
 * HTTP Status: 504 Gateway Timeout
 * Recoverable: Yes (retry with increased timeout)
 * 
 * @example
 * ```typescript
 * throw new TimeoutError('Request timeout after 30s', { 
 *   operation: 'valuation_calculation',
 *   timeout_ms: 30000 
 * })
 * ```
 */
export class TimeoutError extends ApplicationError {
  constructor(
    message: string,
    public readonly timeout_ms: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', { ...context, timeout_ms })
  }
}

/**
 * Check if error is retryable
 * 
 * Determines if an error type should trigger automatic retry logic.
 * 
 * @param error - Error to check
 * @returns true if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  return (
    error instanceof NetworkError ||
    error instanceof RateLimitError ||
    error instanceof TimeoutError ||
    error instanceof IntegrationError
  )
}

/**
 * Map HTTP status code to appropriate error class
 * 
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param context - Additional context
 * @returns Appropriate error instance
 */
export function createErrorFromStatus(
  statusCode: number,
  message: string,
  context?: Record<string, unknown>
): ApplicationError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, context)
    case 401:
      return new UnauthorizedError(message, context)
    case 404:
      return new NotFoundError(
        context?.resourceType as string || 'Resource',
        context?.resourceId as string || 'unknown',
        context
      )
    case 409:
      return new SessionConflictError(
        message,
        context?.reportId as string || 'unknown',
        context
      )
    case 422:
      return new DataQualityError(message, context)
    case 429:
      return new RateLimitError(message, context)
    case 500:
      return new CalculationError(message, context)
    case 502:
      return new IntegrationError(
        message,
        context?.service as string || 'Unknown',
        context
      )
    case 503:
      return new DatabaseError(message, context)
    case 504:
      return new TimeoutError(
        message,
        context?.timeout_ms as number || 30000,
        context
      )
    default:
      return new ApplicationError(message, 'UNKNOWN_ERROR', context)
  }
}

