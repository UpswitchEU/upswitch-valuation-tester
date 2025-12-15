/**
 * HTTP Client Base Service
 *
 * Single Responsibility: HTTP client setup, interceptors, and request management
 * Shared foundation for all API services
 *
 * @module services/api/HttpClient
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { env } from '../../utils/env'
import { apiLogger, extractCorrelationId, setCorrelationFromResponse } from '../../utils/logger'
import { guestSessionService } from '../guestSessionService'

export interface APIRequestConfig {
  timeout?: number
  signal?: AbortSignal
  retry?: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    shouldRetry?: (error: any) => boolean
  }
}

/**
 * Base HTTP client with common interceptors and request management
 */
export class HttpClient {
  protected client: AxiosInstance
  protected activeRequests: Map<string, AbortController> = new Map()
  protected requestTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor(baseURL?: string, defaultTimeout: number = 90000) {
    this.client = axios.create({
      baseURL:
        baseURL ||
        env.VITE_BACKEND_URL ||
        env.VITE_API_BASE_URL ||
        'https://web-production-8d00b.up.railway.app',
      timeout: defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send authentication cookies
    })

    this.setupInterceptors()
  }

  /**
   * Setup common request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for guest session tracking
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add guest session ID to requests if user is a guest
        if (guestSessionService.isGuest()) {
          try {
            const sessionId = await guestSessionService.getOrCreateSession()
            if (sessionId) {
              // Add guest_session_id to headers (works for all request types including GET)
              config.headers = config.headers || {}
              config.headers['x-guest-session-id'] = sessionId
              
              // Also add to request body if it exists (for POST/PUT/PATCH)
              if (config.data) {
                config.data = {
                  ...config.data,
                  guest_session_id: sessionId,
                }
              }
            }
            // Update session activity (safe, throttled, and circuit-breaker protected)
            guestSessionService.updateActivity().catch(() => {
              // Errors are handled internally by updateActivity - this is just a safety net
            })
          } catch (error) {
            apiLogger.warn('Failed to add guest session to request', { error })
            // Don't block request if session tracking fails
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for correlation ID extraction and logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Extract correlation ID from response headers
        const correlationId = extractCorrelationId(response)
        if (correlationId) {
          setCorrelationFromResponse(response)
          apiLogger.debug('Correlation ID extracted from response', {
            correlationId,
            url: response.config.url,
            status: response.status,
          })
        }
        return response
      },
      (error) => {
        // Handle response errors with correlation ID if available
        const correlationId = error.config ? extractCorrelationId(error.response) : null
        if (correlationId) {
          apiLogger.error('API request failed with correlation ID', {
            correlationId,
            url: error.config?.url,
            status: error.response?.status,
            error: error.message,
          })
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Execute request with timeout, abort management, and retry logic
   */
  protected async executeRequest<T>(
    config: InternalAxiosRequestConfig,
    options?: APIRequestConfig
  ): Promise<T> {
    const retryConfig = options?.retry
    if (!retryConfig) {
      return this.executeSingleRequest<T>(config, options)
    }

    // Use retry logic
    return this.executeRequestWithRetry<T>(config, options)
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequestWithRetry<T>(
    config: InternalAxiosRequestConfig,
    options: APIRequestConfig
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      shouldRetry = this.shouldRetryError,
    } = options.retry!

    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          apiLogger.info('Retrying API request', {
            attempt,
            maxRetries,
            url: config.url,
            method: config.method,
          })
        }

        return await this.executeSingleRequest<T>(config, {
          ...options,
          retry: undefined, // Remove retry config to avoid infinite recursion
        })
      } catch (error) {
        lastError = error

        // Check if we should retry this error
        if (!shouldRetry(error) || attempt >= maxRetries) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay)

        apiLogger.warn('API request failed, retrying', {
          attempt,
          maxRetries,
          delay,
          url: config.url,
          error: error instanceof Error ? error.message : String(error),
        })

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Default retry predicate - retry on network errors and 5xx server errors
   */
  private shouldRetryError(error: any): boolean {
    // Retry on network errors
    if (!error.response) {
      return true
    }

    // Retry on 5xx server errors
    const status = error.response?.status
    return status >= 500 && status < 600
  }

  /**
   * Execute single request (no retry)
   */
  private async executeSingleRequest<T>(
    config: InternalAxiosRequestConfig,
    options?: APIRequestConfig
  ): Promise<T> {
    const timeout = options?.timeout || 90000 // Default 90 seconds
    const correlationId = Math.random().toString(36).substring(2, 15)

    // Check for duplicate request
    if (this.activeRequests.has(correlationId)) {
      apiLogger.warn('Duplicate request detected, cancelling previous', { correlationId })
      this.activeRequests.get(correlationId)?.abort()
    }

    // Create AbortController for this request
    const controller = new AbortController()
    this.activeRequests.set(correlationId, controller)

    // Use provided signal or create new one
    const signal = options?.signal || controller.signal

    // Set up timeout
    const requestTimeout = timeout
    const timeoutId = setTimeout(() => {
      apiLogger.warn('Request timeout, aborting', { correlationId, timeout: requestTimeout })
      controller.abort()
    }, requestTimeout)
    this.requestTimeouts.set(correlationId, timeoutId)

    try {
      apiLogger.debug('Making API request', {
        correlationId,
        url: config.url,
        method: config.method,
        timeout: requestTimeout,
      })

      const response = await this.client.request({
        ...config,
        signal,
      })

      // Extract data from nested response structure
      const responseData = response.data?.data || response.data
      return responseData
    } finally {
      // Cleanup
      this.activeRequests.delete(correlationId)
      if (this.requestTimeouts.has(correlationId)) {
        clearTimeout(this.requestTimeouts.get(correlationId)!)
        this.requestTimeouts.delete(correlationId)
      }
    }
  }

  /**
   * Clean up all active requests (useful for component unmount)
   */
  cleanup(): void {
    // Abort all active requests
    for (const [correlationId, controller] of this.activeRequests) {
      apiLogger.debug('Cleaning up active request', { correlationId })
      controller.abort()
    }
    this.activeRequests.clear()

    // Clear all timeouts
    for (const [_correlationId, timeoutId] of this.requestTimeouts) {
      clearTimeout(timeoutId)
    }
    this.requestTimeouts.clear()
  }
}
