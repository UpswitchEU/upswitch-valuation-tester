/**
 * Centralized Error Handler
 * Provides consistent error handling, classification, and user-friendly messages
 */

export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  SERVER = 'server',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown'
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
  originalError?: Error;
}

/**
 * Classify error type
 */
export function classifyError(error: unknown): ErrorType {
  if (!(error instanceof Error)) {
    return ErrorType.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (
    name === 'networkerror' ||
    name === 'typeerror' && message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return ErrorType.NETWORK;
  }

  // Timeout errors
  if (
    name === 'timeouterror' ||
    name === 'aborterror' && message.includes('timeout') ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return ErrorType.TIMEOUT;
  }

  // Cancelled errors
  if (
    name === 'aborterror' ||
    name === 'cancelerror' ||
    message.includes('cancelled') ||
    message.includes('aborted')
  ) {
    return ErrorType.CANCELLED;
  }

  // Validation errors (check for status code)
  const anyError = error as any;
  if (anyError.response?.status >= 400 && anyError.response?.status < 500) {
    return ErrorType.VALIDATION;
  }

  // Server errors
  if (anyError.response?.status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const type = classifyError(error);
  const anyError = error as any;

  switch (type) {
    case ErrorType.NETWORK:
      return 'Connection error. Please check your internet connection and try again.';
    
    case ErrorType.TIMEOUT:
      return 'Request timed out. The calculation is taking longer than expected. Please try again.';
    
    case ErrorType.VALIDATION: {
      const validationMessage = anyError.response?.data?.error || anyError.response?.data?.message;
      if (validationMessage) {
        return `Validation error: ${validationMessage}`;
      }
      return 'Invalid data provided. Please check your inputs and try again.';
    }
    
    case ErrorType.SERVER:
      return 'Server error occurred. Our team has been notified. Please try again in a moment.';
    
    case ErrorType.CANCELLED:
      return 'Request was cancelled.';
    
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const type = classifyError(error);
  
  return type === ErrorType.NETWORK || 
         type === ErrorType.TIMEOUT || 
         type === ErrorType.SERVER;
}

/**
 * Extract error information
 */
export function extractErrorInfo(error: unknown): ErrorInfo {
  const type = classifyError(error);
  const anyError = error as any;
  const originalError = error instanceof Error ? error : new Error(String(error));

  return {
    type,
    message: originalError.message,
    userMessage: getUserFriendlyMessage(error),
    retryable: isRetryable(error),
    statusCode: anyError.response?.status,
    originalError: originalError
  };
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, any> {
  const info = extractErrorInfo(error);
  const anyError = error as any;

  return {
    type: info.type,
    message: info.message,
    userMessage: info.userMessage,
    retryable: info.retryable,
    statusCode: info.statusCode,
    stack: info.originalError?.stack,
    response: anyError.response?.data,
    request: {
      url: anyError.config?.url,
      method: anyError.config?.method,
      data: anyError.config?.data
    }
  };
}

