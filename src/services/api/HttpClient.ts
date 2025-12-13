/**
 * HTTP Client Base Service
 *
 * Single Responsibility: HTTP client setup, interceptors, and request management
 * Shared foundation for all API services
 *
 * @module services/api/HttpClient
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiLogger, extractCorrelationId, setCorrelationFromResponse } from '../../utils/logger';
import { guestSessionService } from '../guestSessionService';

export interface APIRequestConfig {
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Base HTTP client with common interceptors and request management
 */
export class HttpClient {
  protected client: AxiosInstance;
  protected activeRequests: Map<string, AbortController> = new Map();
  protected requestTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(baseURL?: string, defaultTimeout: number = 90000) {
    this.client = axios.create({
      baseURL: baseURL || import.meta.env.VITE_BACKEND_URL ||
               import.meta.env.VITE_API_BASE_URL ||
               'https://web-production-8d00b.up.railway.app',
      timeout: defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send authentication cookies
    });

    this.setupInterceptors();
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
            const sessionId = await guestSessionService.getOrCreateSession();
            if (sessionId && config.data) {
              // Add guest_session_id to request body
              config.data = {
                ...config.data,
                guest_session_id: sessionId
              };
            }
            // Update session activity (safe, throttled, and circuit-breaker protected)
            guestSessionService.updateActivity().catch(() => {
              // Errors are handled internally by updateActivity - this is just a safety net
            });
          } catch (error) {
            apiLogger.warn('Failed to add guest session to request', { error });
            // Don't block request if session tracking fails
          }
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for correlation ID extraction and logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Extract correlation ID from response headers
        const correlationId = extractCorrelationId(response);
        if (correlationId) {
          setCorrelationFromResponse(response);
          apiLogger.debug('Correlation ID extracted from response', {
            correlationId,
            url: response.config.url,
            status: response.status
          });
        }
        return response;
      },
      (error) => {
        // Handle response errors with correlation ID if available
        const correlationId = error.config ? extractCorrelationId(error.response) : null;
        if (correlationId) {
          apiLogger.error('API request failed with correlation ID', {
            correlationId,
            url: error.config?.url,
            status: error.response?.status,
            error: error.message
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute request with timeout and abort management
   */
  protected async executeRequest<T>(
    config: any,
    options?: APIRequestConfig
  ): Promise<T> {
    const timeout = options?.timeout || 90000; // Default 90 seconds
    const correlationId = Math.random().toString(36).substring(2, 15);

    // Check for duplicate request
    if (this.activeRequests.has(correlationId)) {
      apiLogger.warn('Duplicate request detected, cancelling previous', { correlationId });
      this.activeRequests.get(correlationId)?.abort();
    }

    // Create AbortController for this request
    const controller = new AbortController();
    this.activeRequests.set(correlationId, controller);

    // Use provided signal or create new one
    const signal = options?.signal || controller.signal;

    // Set up timeout
    const requestTimeout = timeout;
    const timeoutId = setTimeout(() => {
      apiLogger.warn('Request timeout, aborting', { correlationId, timeout: requestTimeout });
      controller.abort();
    }, requestTimeout);
    this.requestTimeouts.set(correlationId, timeoutId);

    try {
      apiLogger.debug('Making API request', {
        correlationId,
        url: config.url,
        method: config.method,
        timeout: requestTimeout
      });

      const response = await this.client.request({
        ...config,
        signal
      });

      // Extract data from nested response structure
      const responseData = response.data?.data || response.data;
      return responseData;
    } finally {
      // Cleanup
      this.activeRequests.delete(correlationId);
      if (this.requestTimeouts.has(correlationId)) {
        clearTimeout(this.requestTimeouts.get(correlationId)!);
        this.requestTimeouts.delete(correlationId);
      }
    }
  }

  /**
   * Clean up all active requests (useful for component unmount)
   */
  cleanup(): void {
    // Abort all active requests
    for (const [correlationId, controller] of this.activeRequests) {
      apiLogger.debug('Cleaning up active request', { correlationId });
      controller.abort();
    }
    this.activeRequests.clear();

    // Clear all timeouts
    for (const [correlationId, timeoutId] of this.requestTimeouts) {
      clearTimeout(timeoutId);
    }
    this.requestTimeouts.clear();
  }
}
