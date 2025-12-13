/**
 * Error Handler Tests
 *
 * Comprehensive test suite for error handling functionality
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorHandler } from '../handler'
import {
  AuthenticationError,
  BusinessLogicError,
  DataQualityError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  RegistryError,
  ServerError,
  TimeoutError,
  ValidationError,
} from '../types'

// Mock the logger to avoid console output during tests
vi.mock('../../logger', () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('should handle NetworkError correctly', () => {
      const error = new NetworkError('Connection failed', { endpoint: '/api/test' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe(
        'Connection error. Please check your internet connection and try again.'
      )
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Check your internet connection and try again.')
    })

    it('should handle RegistryError correctly', () => {
      const error = new RegistryError('API failed', 503, { companyId: '123' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Unable to fetch company data. Please try again.')
      expect(result.code).toBe('REGISTRY_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Try a different company name or search term.')
    })

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'companyName' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Please check your input and try again.')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.canRetry).toBe(false)
      expect(result.userAction).toBe('Check your input and try again.')
    })

    it('should handle AuthenticationError correctly', () => {
      const error = new AuthenticationError('Token expired', { userId: '123' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Authentication failed. Please log in again.')
      expect(result.code).toBe('AUTH_ERROR')
      expect(result.canRetry).toBe(false)
      expect(result.userAction).toBe('Please log in again.')
    })

    it('should handle TimeoutError correctly', () => {
      const error = new TimeoutError('Request timed out', { timeout: 5000 })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Request timed out. Please try again.')
      expect(result.code).toBe('TIMEOUT_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Try again with a shorter timeout.')
    })

    it('should handle RateLimitError correctly', () => {
      const error = new RateLimitError('Too many requests', { retryAfter: 60 })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Too many requests. Please wait a moment and try again.')
      expect(result.code).toBe('RATE_LIMIT_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Wait a moment before trying again.')
    })

    it('should handle ServerError correctly', () => {
      const error = new ServerError('Internal server error', { requestId: 'req-123' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Server error. Please try again later.')
      expect(result.code).toBe('SERVER_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Try again in a few minutes.')
    })

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('Company not found', { companyId: '123' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Company not found. Please check the name and try again.')
      expect(result.code).toBe('NOT_FOUND_ERROR')
      expect(result.canRetry).toBe(false)
      expect(result.userAction).toBe('Check the company name spelling or try a different search.')
    })

    it('should handle BusinessLogicError correctly', () => {
      const error = new BusinessLogicError('Invalid operation', { operation: 'calculate' })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Invalid operation. Please check your input.')
      expect(result.code).toBe('BUSINESS_LOGIC_ERROR')
      expect(result.canRetry).toBe(false)
      expect(result.userAction).toBe('Check your input and try again.')
    })

    it('should handle DataQualityError correctly', () => {
      const error = new DataQualityError('Insufficient data', { quality: 0.3 })
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('Data quality issue. Please provide more complete information.')
      expect(result.code).toBe('DATA_QUALITY_ERROR')
      expect(result.canRetry).toBe(false)
      expect(result.userAction).toBe('Provide more complete information.')
    })

    it('should handle unknown errors gracefully', () => {
      const error = new Error('Unknown error')
      const result = ErrorHandler.handle(error)

      expect(result.message).toBe('An unexpected error occurred. Please try again.')
      expect(result.code).toBe('UNKNOWN_ERROR')
      expect(result.canRetry).toBe(true)
      expect(result.userAction).toBe('Please try again or contact support if the problem persists.')
    })

    it('should include context in technical details', () => {
      const error = new NetworkError('Connection failed', { endpoint: '/api/test', userId: '123' })
      const result = ErrorHandler.handle(error)

      expect(result.technicalDetails).toContain('"endpoint":"/api/test"')
      expect(result.technicalDetails).toContain('"userId":"123"')
    })
  })

  describe('handleApiError', () => {
    it('should handle API errors with endpoint context', () => {
      const error = new NetworkError('Connection failed')
      const result = ErrorHandler.handleApiError(error, '/api/companies')

      expect(result.message).toBe(
        'Connection error. Please check your internet connection and try again.'
      )
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.canRetry).toBe(true)
    })
  })

  describe('handleNetworkError', () => {
    it('should handle network errors specifically', () => {
      const error = new Error('Network connection failed')
      const result = ErrorHandler.handleNetworkError(error, { endpoint: '/api/test' })

      expect(result.message).toBe(
        'Connection error. Please check your internet connection and try again.'
      )
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.canRetry).toBe(true)
    })
  })

  describe('handleValidationError', () => {
    it('should handle validation errors specifically', () => {
      const result = ErrorHandler.handleValidationError('Invalid email format', { field: 'email' })

      expect(result.message).toBe('Please check your input and try again.')
      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.canRetry).toBe(false)
    })
  })

  describe('handleAuthError', () => {
    it('should handle authentication errors specifically', () => {
      const result = ErrorHandler.handleAuthError('Token expired', { userId: '123' })

      expect(result.message).toBe('Authentication failed. Please log in again.')
      expect(result.code).toBe('AUTH_ERROR')
      expect(result.canRetry).toBe(false)
    })
  })

  describe('handleRegistryError', () => {
    it('should handle registry errors specifically', () => {
      const result = ErrorHandler.handleRegistryError('API unavailable', 503, { companyId: '123' })

      expect(result.message).toBe('Unable to fetch company data. Please try again.')
      expect(result.code).toBe('REGISTRY_ERROR')
      expect(result.canRetry).toBe(true)
    })
  })

  describe('error context handling', () => {
    it('should merge error context with additional context', () => {
      const error = new NetworkError('Connection failed', { endpoint: '/api/test' })
      const result = ErrorHandler.handle(error, { userId: '123', sessionId: 'sess-456' })

      expect(result.technicalDetails).toContain('"endpoint":"/api/test"')
      expect(result.technicalDetails).toContain('"userId":"123"')
      expect(result.technicalDetails).toContain('"sessionId":"sess-456"')
    })
  })

  describe('retry logic', () => {
    it('should identify retryable errors correctly', () => {
      const retryableErrors = [
        new NetworkError('Connection failed'),
        new TimeoutError('Request timed out'),
        new ServerError('Internal server error'),
        new RegistryError('API failed', 503),
      ]

      retryableErrors.forEach((error) => {
        const result = ErrorHandler.handle(error)
        expect(result.canRetry).toBe(true)
      })
    })

    it('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors = [
        new ValidationError('Invalid input'),
        new AuthenticationError('Token expired'),
        new NotFoundError('Resource not found'),
        new BusinessLogicError('Invalid operation'),
      ]

      nonRetryableErrors.forEach((error) => {
        const result = ErrorHandler.handle(error)
        expect(result.canRetry).toBe(false)
      })
    })
  })

  describe('user-friendly messages', () => {
    it('should provide actionable user messages', () => {
      const testCases = [
        {
          error: new NetworkError('Connection failed'),
          expectedMessage: 'Connection error. Please check your internet connection and try again.',
          expectedAction: 'Check your internet connection and try again.',
        },
        {
          error: new ValidationError('Invalid input'),
          expectedMessage: 'Please check your input and try again.',
          expectedAction: 'Check your input and try again.',
        },
        {
          error: new AuthenticationError('Token expired'),
          expectedMessage: 'Authentication failed. Please log in again.',
          expectedAction: 'Please log in again.',
        },
      ]

      testCases.forEach(({ error, expectedMessage, expectedAction }) => {
        const result = ErrorHandler.handle(error)
        expect(result.message).toBe(expectedMessage)
        expect(result.userAction).toBe(expectedAction)
      })
    })
  })
})
