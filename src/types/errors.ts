/**
 * Error Types
 * 
 * Specific error classes for domain-specific error handling.
 * Follows the principle of "specific errors over generic errors".
 * 
 * @module types/errors
 */

/**
 * Base error class for all valuation-related errors
 */
export class ValuationError extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: string;
  
  /**
   * Whether the error is recoverable (user can retry)
   */
  public readonly recoverable: boolean;
  
  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    recoverable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ValuationError';
    this.code = code;
    this.recoverable = recoverable;
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValuationError);
    }
  }
}

/**
 * Error thrown when session restoration fails
 */
export class SessionRestorationError extends ValuationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'SESSION_RESTORATION_ERROR', true, context);
    this.name = 'SessionRestorationError';
  }
}

/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends ValuationError {
  constructor(message: string, recoverable: boolean = true, context?: Record<string, any>) {
    super(message, 'REPORT_GENERATION_ERROR', recoverable, context);
    this.name = 'ReportGenerationError';
  }
}

/**
 * Error thrown when API calls fail
 */
export class APIError extends ValuationError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    recoverable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message, 'API_ERROR', recoverable, context);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends ValuationError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(
    message: string,
    field?: string,
    value?: any,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', true, context);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Error thrown when credit check fails
 */
export class CreditError extends ValuationError {
  public readonly creditsRemaining: number;

  constructor(message: string, creditsRemaining: number = 0) {
    super(message, 'CREDIT_ERROR', false, { creditsRemaining });
    this.name = 'CreditError';
    this.creditsRemaining = creditsRemaining;
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ValuationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', false, context);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when rate limiting is hit
 */
export class RateLimitError extends ValuationError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', true, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when network connectivity fails
 */
export class NetworkError extends ValuationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', true, context);
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when conversation state is invalid
 */
export class ConversationStateError extends ValuationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONVERSATION_STATE_ERROR', true, context);
    this.name = 'ConversationStateError';
  }
}

/**
 * Type guard to check if error is a ValuationError
 */
export function isValuationError(error: unknown): error is ValuationError {
  return error instanceof ValuationError;
}

/**
 * Type guard to check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (isValuationError(error)) {
    return error.recoverable;
  }
  return false;
}

/**
 * Extract user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isValuationError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

