/**
 * Backend API Service for Valuation Tester
 * 
 * Handles API calls to the main Upswitch backend (Node.js)
 * for credit management and valuation processing
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ValuationRequest, ValuationResponse } from '../types/valuation';
// normalizeCalculationSteps removed - calculation steps now in server-generated info_tab_html
import { apiLogger, createPerformanceLogger, extractCorrelationId, setCorrelationFromResponse } from '../utils/logger';
import { guestSessionService } from './guestSessionService';

class BackendAPI {
  private client: AxiosInstance;
  private activeRequests: Map<string, AbortController> = new Map();
  private requestTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private rateLimitRetryCount: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly BASE_RETRY_DELAY = 1000; // 1 second base delay

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || 
               import.meta.env.VITE_API_BASE_URL || 
               'https://web-production-8d00b.up.railway.app',
      timeout: 90000, // 90 seconds for manual valuations
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send authentication cookies
    });

    // Request interceptor for guest session tracking
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add guest session ID to requests if user is a guest
        if (guestSessionService.isGuest()) {
          try {
            // Only call getOrCreateSession if we don't have a cached session ID
            // This prevents excessive API calls
            let sessionId = guestSessionService.getCurrentSessionId();
            
            if (!sessionId || guestSessionService.isSessionExpired()) {
              // Only create/verify session if we don't have one or it's expired
              sessionId = await guestSessionService.getOrCreateSession();
            }
            
            if (sessionId && config.data) {
              // Add guest_session_id to request body
              config.data = {
                ...config.data,
                guest_session_id: sessionId
              };
            }
            
            // Update session activity (safe, throttled, and circuit-breaker protected)
            // The updateActivity method handles all throttling and circuit breaker logic internally
            // Only call if not rate limited (429 errors handled in response interceptor)
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

    // Response interceptor for correlation ID extraction, logging, and rate limit handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Reset retry count on success
        const url = response.config.url || '';
        this.rateLimitRetryCount.delete(url);
        
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
        
        // Log response structure for valuation endpoints
        if (response.config.url?.includes('/calculate')) {
          const responseData = response.data?.data || response.data;
          apiLogger.info('Valuation API response received', {
            url: response.config.url,
            status: response.status,
            hasValuationId: !!responseData?.valuation_id,
            hasTransparency: !!responseData?.transparency,
            hasModularSystem: !!responseData?.modular_system,
            // calculation_steps deprecated - details now in info_tab_html
            transparencyStepsCount: 0,
            modularSystemStepsCount: responseData?.modular_system?.step_details?.length || 0,
            correlationId
          });
        }
        
        return response;
      },
      async error => {
        const correlationId = error.response ? extractCorrelationId(error.response) : null;
        const url = error.config?.url || '';
        const status = error.response?.status;
        
        // Handle rate limiting (429) with exponential backoff
        if (status === 429) {
          const retryCount = this.rateLimitRetryCount.get(url) || 0;
          
          if (retryCount < this.MAX_RETRIES) {
            // Calculate exponential backoff delay
            const delay = this.BASE_RETRY_DELAY * Math.pow(2, retryCount);
            this.rateLimitRetryCount.set(url, retryCount + 1);
            
            apiLogger.warn('Rate limited, retrying with exponential backoff', {
              url,
              retryCount: retryCount + 1,
              maxRetries: this.MAX_RETRIES,
              delayMs: delay,
              correlationId
            });
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Retry the request
            try {
              return await this.client.request(error.config);
            } catch (retryError) {
              // If retry also fails, continue to error handling
              this.rateLimitRetryCount.delete(url);
              throw retryError;
            }
          } else {
            // Max retries exceeded
            this.rateLimitRetryCount.delete(url);
            apiLogger.error('Rate limit exceeded, max retries reached', {
              url,
              maxRetries: this.MAX_RETRIES,
              correlationId
            });
          }
        }
        
        apiLogger.error('Backend API Error', {
          error: error.response?.data || error.message,
          status: error.response?.status,
          url: error.config?.url,
          correlationId
        }, error);
        throw error;
      }
    );
  }

  /**
   * Generate request fingerprint for deduplication
   */
  private getRequestFingerprint(data: ValuationRequest): string {
    const key = `${data.company_name}_${data.current_year_data?.revenue}_${data.current_year_data?.ebitda}_${data.industry}_${data.business_type_id}`;
    return btoa(key).substring(0, 16);
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      
      const timeout = this.requestTimeouts.get(requestId);
      if (timeout) {
        clearTimeout(timeout);
        this.requestTimeouts.delete(requestId);
      }
      
      apiLogger.info('Request cancelled', { requestId });
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.activeRequests.entries()) {
      controller.abort();
      
      const timeout = this.requestTimeouts.get(requestId);
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    
    this.activeRequests.clear();
    this.requestTimeouts.clear();
    apiLogger.info('All requests cancelled');
  }

  /**
   * Manual valuation - FREE (no credit consumption)
   * Routes through Node.js backend for analytics tracking
   * Now supports request cancellation and deduplication
   */
  async calculateManualValuation(
    data: ValuationRequest, 
    options?: { 
      signal?: AbortSignal;
      timeout?: number;
      enableDeduplication?: boolean;
    }
  ): Promise<ValuationResponse> {
    const perfLogger = createPerformanceLogger('calculateManualValuation', 'api');
    const requestId = this.getRequestFingerprint(data);
    const timeout = options?.timeout || 90000; // Default 90 seconds
    
    // Check for duplicate request
    if (options?.enableDeduplication !== false && this.activeRequests.has(requestId)) {
      apiLogger.warn('Duplicate request detected, cancelling previous', { requestId });
      this.cancelRequest(requestId);
    }

    // Create AbortController for this request
    const abortController = new AbortController();
    this.activeRequests.set(requestId, abortController);

    // Use provided signal or create new one
    const signal = options?.signal || abortController.signal;

    // Set up timeout
    const requestTimeout = timeout; // Store timeout value for use in closure
    const timeoutId = setTimeout(() => {
      apiLogger.warn('Request timeout', { requestId, timeout: requestTimeout });
      abortController.abort();
      this.activeRequests.delete(requestId);
      this.requestTimeouts.delete(requestId);
    }, requestTimeout);
    
    this.requestTimeouts.set(requestId, timeoutId);

    try {
      apiLogger.info('Sending manual valuation request', {
        requestId,
        company_name: data.company_name,
        revenue: data.current_year_data?.revenue,
        ebitda: data.current_year_data?.ebitda,
        industry: data.industry,
        business_type_id: data.business_type_id,
        timeout: requestTimeout
      });

      // Call Node.js backend which handles logging and proxies to Python engine
      const response = await this.client.post('/api/valuations/calculate/manual', data, {
        signal
      });
      
      // Extract correlation ID and valuation ID from response
      const responseData = response.data.data || response.data;
      const correlationId = extractCorrelationId(response);
      const valuationId = responseData?.valuation_id;
      
      // DIAGNOSTIC: Log html_report and info_tab_html presence in response
      apiLogger.info('DIAGNOSTIC: Manual valuation response structure', {
        responseStructure: {
          hasData: !!response.data.data,
          hasDirectData: !!response.data,
          responseKeys: Object.keys(response.data || {}),
          dataKeys: response.data.data ? Object.keys(response.data.data) : []
        },
        htmlReport: {
          inResponseData: !!responseData?.html_report,
          inResponseDataData: !!response.data.data?.html_report,
          inResponseDirect: !!response.data?.html_report,
          length: responseData?.html_report?.length || 0,
          preview: responseData?.html_report?.substring(0, 200) || 'N/A',
          type: typeof responseData?.html_report
        },
        infoTabHtml: {
          inResponseData: !!responseData?.info_tab_html,
          inResponseDataData: !!response.data.data?.info_tab_html,
          inResponseDirect: !!response.data?.info_tab_html,
          length: responseData?.info_tab_html?.length || 0,
          preview: responseData?.info_tab_html?.substring(0, 200) || 'N/A',
          type: typeof responseData?.info_tab_html
        }
      });

      // Log response structure for debugging (structured logging)
      apiLogger.debug('Response structure', {
        responseStatus: response.status,
        responseDataStructure: {
          success: response.data.success,
          hasData: !!response.data.data,
          dataKeys: response.data.data ? Object.keys(response.data.data) : [],
          dataHasHtmlReport: !!response.data.data?.html_report,
          dataHtmlReportLength: response.data.data?.html_report?.length || 0,
          dataHasInfoTabHtml: !!response.data.data?.info_tab_html,
          dataInfoTabHtmlLength: response.data.data?.info_tab_html?.length || 0
        },
        extractedResponseData: {
          hasHtmlReport: !!responseData?.html_report,
          htmlReportLength: responseData?.html_report?.length || 0,
          htmlReportPreview: responseData?.html_report?.substring(0, 200) || 'N/A',
          hasInfoTabHtml: !!responseData?.info_tab_html,
          infoTabHtmlLength: responseData?.info_tab_html?.length || 0,
          infoTabHtmlPreview: responseData?.info_tab_html?.substring(0, 200) || 'N/A'
        }
      });
      
      if (correlationId || valuationId) {
        setCorrelationFromResponse(response);
        apiLogger.info('Manual valuation response received', {
          valuationId,
          correlationId: correlationId || valuationId,
          hasTransparency: !!responseData?.transparency,
          hasModularSystem: !!responseData?.modular_system,
          // calculation_steps deprecated - details now in info_tab_html
          transparencyStepsCount: 0,
          modularSystemStepsCount: responseData?.modular_system?.step_details?.length || 0,
          equityValueMid: responseData?.equity_value_mid,
          hasHtmlReport: !!responseData?.html_report,
          htmlReportLength: responseData?.html_report?.length || 0,
          hasInfoTabHtml: !!responseData?.info_tab_html,
          infoTabHtmlLength: responseData?.info_tab_html?.length || 0
        });
      }
      
      perfLogger.end({ 
        valuationId,
        correlationId: correlationId || valuationId,
        hasData: !!responseData 
      });

      // Cleanup
      this.activeRequests.delete(requestId);
      const timeout = this.requestTimeouts.get(requestId);
      if (timeout) {
        clearTimeout(timeout);
        this.requestTimeouts.delete(requestId);
      }
      
      return responseData; // Extract nested data from { success, data, message }
    } catch (error: any) {
      // Cleanup on error
      this.activeRequests.delete(requestId);
      const timeout = this.requestTimeouts.get(requestId);
      if (timeout) {
        clearTimeout(timeout);
        this.requestTimeouts.delete(requestId);
      }

      // Handle abort errors gracefully
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        apiLogger.info('Request cancelled by user', { requestId });
        throw new Error('Request cancelled');
      }
      const correlationId = error.response ? extractCorrelationId(error.response) : null;
      apiLogger.error('Manual valuation failed', {
        error: error.response?.data?.error || error.message,
        status: error.response?.status,
        correlationId
      }, error);
      
      perfLogger.end({ error: true, correlationId });
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        throw new Error(`Backend error: ${error.response.data.error}`);
      } else if (error.response?.status) {
        throw new Error(`Backend error: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw new Error(`Manual valuation failed: ${error.message}`);
      }
    }
  }

  /**
   * AI-guided valuation - PREMIUM (requires 1 credit)
   * Routes through Node.js backend for credit validation and analytics
   */
  async calculateAIGuidedValuation(data: ValuationRequest): Promise<ValuationResponse> {
    try {
      console.log('AI-guided valuation request data:', {
        company_name: data.company_name,
        revenue: data.current_year_data?.revenue,
        ebitda: data.current_year_data?.ebitda,
        fullData: data
      });

      // Call Node.js backend which handles credit checks and proxies to Python engine
      const response = await this.client.post('/api/valuations/calculate/ai-guided', data);
      
      console.log('Backend response for AI-guided valuation:', response.data);
      return response.data.data; // Extract nested data from { success, data, message }
    } catch (error: any) {
      console.error('AI-guided valuation failed:', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        throw new Error(`Backend error: ${error.response.data.error}`);
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits for AI-guided valuation');
      } else if (error.response?.status) {
        throw new Error(`Backend error: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw new Error(`AI-guided valuation failed: ${error.message}`);
      }
    }
  }

  /**
   * Instant valuation - PREMIUM (requires 1 credit) - DEPRECATED
   * @deprecated Use calculateAIGuidedValuation instead
   */
  async calculateInstantValuation(data: ValuationRequest): Promise<ValuationResponse> {
    return this.calculateAIGuidedValuation(data);
  }

  /**
   * Calculate valuation for a specific report
   */
  async calculateValuationForReport(
    reportId: string,
    data: ValuationRequest,
    flowType: 'manual' | 'ai-guided'
  ): Promise<ValuationResponse> {
    const response = await this.client.post(
      `/api/valuations/reports/${reportId}/calculate`,
      { ...data, flowType }
    );
    return response.data.data; // Extract nested data from { success, data, message }
  }

  /**
   * Get existing report
   */
  async getReport(reportId: string): Promise<ValuationResponse> {
    const response = await this.client.get(`/api/valuations/reports/${reportId}`);
    return response.data.data; // Extract nested data from { success, data, message }
  }

  /**
   * Update existing report
   */
  async updateReport(reportId: string, data: Partial<ValuationRequest>): Promise<ValuationResponse> {
    const response = await this.client.put(`/api/valuations/reports/${reportId}`, data);
    return response.data.data; // Extract nested data from { success, data, message }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/api/valuations/reports/${reportId}`);
    return response.data;
  }

  /**
   * Download Accountant View PDF report
   * Calls Node.js backend which proxies to Python engine
   */
  async downloadAccountantViewPDF(
    request: ValuationRequest,
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: number) => void;
    }
  ): Promise<Blob> {
    const perfLogger = createPerformanceLogger('downloadAccountantViewPDF', 'api');
    const requestStartTime = performance.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log request initiation
      apiLogger.info('[BackendAPI] PDF download request initiated', {
        requestId,
        company_name: request.company_name,
        endpoint: '/api/valuations/pdf/accountant-view',
        hasSignal: !!options?.signal,
        hasProgressCallback: !!options?.onProgress,
        requestSize: JSON.stringify(request).length,
        timestamp: new Date().toISOString()
      });

      // Log request details
      apiLogger.debug('[BackendAPI] PDF request details', {
        requestId,
        company_name: request.company_name,
        industry: request.industry,
        business_model: request.business_model,
        revenue: request.current_year_data?.revenue,
        ebitda: request.current_year_data?.ebitda,
        number_of_employees: request.number_of_employees,
        number_of_owners: request.number_of_owners
      });

      const httpRequestStartTime = performance.now();
      
      // Call Node.js backend endpoint which proxies to Python engine
      const response = await this.client.post(
        '/api/valuations/pdf/accountant-view',
        request,
        {
          responseType: 'blob', // Important: request as blob for PDF
          signal: options?.signal,
          timeout: 120000, // 2 minutes for PDF generation
          onDownloadProgress: (progressEvent) => {
            if (options?.onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress(percentCompleted);
              
              // Log progress milestones
              if (percentCompleted % 25 === 0 || percentCompleted === 100) {
                apiLogger.debug('[BackendAPI] PDF download progress', {
                  requestId,
                  progress: percentCompleted,
                  loaded: progressEvent.loaded,
                  total: progressEvent.total,
                  company_name: request.company_name
                });
              }
            }
          }
        }
      );

      const httpRequestDuration = performance.now() - httpRequestStartTime;
      const totalDuration = performance.now() - requestStartTime;
      const correlationId = extractCorrelationId(response);

      // Log response details
      apiLogger.info('[BackendAPI] PDF response received from Node.js backend', {
        requestId,
        correlationId,
        status: response.status,
        statusText: response.statusText,
        pdfSize: response.data.size,
        pdfSizeKB: Math.round(response.data.size / 1024),
        contentType: response.headers['content-type'],
        contentDisposition: response.headers['content-disposition'],
        httpRequestDurationMs: Math.round(httpRequestDuration),
        totalDurationMs: Math.round(totalDuration),
        company_name: request.company_name
      });

      perfLogger.end({
        requestId,
        pdfSize: response.data.size,
        contentType: response.headers['content-type'],
        httpRequestDurationMs: Math.round(httpRequestDuration),
        totalDurationMs: Math.round(totalDuration),
        correlationId
      });

      // Validate PDF blob
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF blob from backend');
      }

      if (response.data.size < 1000) {
        apiLogger.warn('[BackendAPI] PDF size suspiciously small', {
          requestId,
          pdfSize: response.data.size,
          company_name: request.company_name
        });
      }

      apiLogger.info('[BackendAPI] PDF download completed successfully', {
        requestId,
        correlationId,
        pdfSize: response.data.size,
        pdfSizeKB: Math.round(response.data.size / 1024),
        totalDurationMs: Math.round(totalDuration),
        company_name: request.company_name,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error: any) {
      const errorDuration = performance.now() - requestStartTime;
      const correlationId = error.response ? extractCorrelationId(error.response) : null;
      
      // Comprehensive error logging
      const errorDetails = {
        requestId,
        correlationId,
        error: error.message,
        errorType: error.name,
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        errorDurationMs: Math.round(errorDuration),
        company_name: request.company_name,
        timestamp: new Date().toISOString()
      };

      apiLogger.error('[BackendAPI] PDF download failed', errorDetails);
      
      perfLogger.end({ 
        requestId,
        error: error.message,
        errorType: error.name,
        status: error.response?.status,
        errorDurationMs: Math.round(errorDuration),
        correlationId
      });

      // Log additional error context
      if (error.code) {
        apiLogger.error('[BackendAPI] Network error details', {
          requestId,
          errorCode: error.code,
          errorMessage: error.message
        });
      }

      if (error.response?.data) {
        apiLogger.error('[BackendAPI] Error response data', {
          requestId,
          errorData: typeof error.response.data === 'string' 
            ? error.response.data.substring(0, 500) 
            : JSON.stringify(error.response.data).substring(0, 500)
        });
      }

      throw error;
    }
  }

  /**
   * Legacy valuation endpoint (defaults to instant behavior)
   */
  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/valuations/calculate', data);
    return response.data.data; // Extract nested data from { success, data, message }
  }

  /**
   * Save valuation to backend database
   */
  async saveValuation(data: any): Promise<{ success: boolean; valuation_id?: string }> {
    const response = await this.client.post('/api/valuations/save', data);
    return response.data;
  }

  /**
   * Get user's credit status
   */
  async getCreditStatus(): Promise<{ creditsRemaining: number; isPremium: boolean }> {
    const response = await this.client.get('/api/credits/status');
    return response.data;
  }

  /**
   * Generate HTML preview for AI-guided valuation (FREE - no credit deduction)
   */
  async generatePreviewHtml(data: ValuationRequest): Promise<{ html: string; completeness_percent: number }> {
    try {
      console.log('Generating HTML preview for:', {
        company_name: data.company_name,
        revenue: data.current_year_data?.revenue,
        ebitda: data.current_year_data?.ebitda
      });

      // Call Node.js backend for HTML preview (no credit deduction)
      const response = await this.client.post('/api/valuations/calculate/ai-guided/preview', data);
      
      console.log('HTML preview response:', {
        success: response.data.success,
        htmlLength: response.data.data?.html?.length || 0,
        completeness: response.data.data?.completeness_percent
      });
      
      return response.data.data; // Extract nested data from { success, data, message }
    } catch (error: any) {
      console.error('HTML preview generation failed:', error);
      
      // Enhanced error handling
      if (error.response?.data?.error) {
        throw new Error(`Preview error: ${error.response.data.error}`);
      } else if (error.response?.status) {
        throw new Error(`Preview error: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw new Error(`HTML preview generation failed: ${error.message}`);
      }
    }
  }

  /**
   * Valuation Session API Methods
   */

  /**
   * Get valuation session by report ID
   */
  async getValuationSession(reportId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/valuation-sessions/${reportId}`);
      const data = response.data.success ? response.data.data : null;
      
      // Map backend 'ai-guided' to frontend 'conversational'
      if (data) {
        if (data.currentView === 'ai-guided') data.currentView = 'conversational';
        if (data.dataSource === 'ai-guided') data.dataSource = 'conversational';
      }
      
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Session doesn't exist yet
      }
      apiLogger.error('Failed to get valuation session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      });
      throw error;
    }
  }

  /**
   * Create new valuation session
   */
  async createValuationSession(session: any): Promise<any> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendSession = { ...session };
      if (backendSession.currentView === 'conversational') backendSession.currentView = 'ai-guided';
      if (backendSession.dataSource === 'conversational') backendSession.dataSource = 'ai-guided';

      const response = await this.client.post('/api/valuation-sessions', backendSession);
      const data = response.data.success ? response.data.data : null;
      
      // Map response back
      if (data) {
        if (data.currentView === 'ai-guided') data.currentView = 'conversational';
        if (data.dataSource === 'ai-guided') data.dataSource = 'conversational';
      }
      return data;
    } catch (error: any) {
      apiLogger.error('Failed to create valuation session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        session,
      });
      throw error;
    }
  }

  /**
   * Update valuation session data
   */
  async updateValuationSession(reportId: string, updates: any): Promise<any> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendUpdates = { ...updates };
      if (backendUpdates.currentView === 'conversational') backendUpdates.currentView = 'ai-guided';
      if (backendUpdates.dataSource === 'conversational') backendUpdates.dataSource = 'ai-guided';

      const response = await this.client.patch(`/api/valuation-sessions/${reportId}`, backendUpdates);
      const data = response.data.success ? response.data.data : null;
      
      // Map response back
      if (data) {
        if (data.currentView === 'ai-guided') data.currentView = 'conversational';
        if (data.dataSource === 'ai-guided') data.dataSource = 'conversational';
      }
      return data;
    } catch (error: any) {
      apiLogger.error('Failed to update valuation session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Switch valuation session view (manual <-> AI-guided)
   */
  async switchValuationView(reportId: string, view: 'manual' | 'conversational'): Promise<any> {
    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendView = view === 'conversational' ? 'ai-guided' : view;
      
      const response = await this.client.post(`/api/valuation-sessions/${reportId}/switch-view`, { view: backendView });
      const data = response.data.success ? response.data.data : null;
      
      // Map response back
      if (data) {
        if (data.currentView === 'ai-guided') data.currentView = 'conversational';
        if (data.dataSource === 'ai-guided') data.dataSource = 'conversational';
      }
      return data;
    } catch (error: any) {
      apiLogger.error('Failed to switch valuation view', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
        view,
      });
      throw error;
    }
  }

  /**
   * Unified calculation endpoint (replaces calculateManualValuation and calculateAIGuidedValuation)
   * Credit cost is determined by dataSource: FREE for manual, 1 credit for AI-guided/mixed
   */
  async calculateValuationUnified(
    data: ValuationRequest,
    dataSource: 'manual' | 'conversational' | 'mixed' = 'manual',
    options?: {
      signal?: AbortSignal;
      timeout?: number;
    }
  ): Promise<ValuationResponse> {
    const perfLogger = createPerformanceLogger('calculateValuationUnified', 'api');
    const timeout = options?.timeout || 90000; // Default 90 seconds

    try {
      // Map frontend 'conversational' to backend 'ai-guided'
      const backendDataSource = dataSource === 'conversational' ? 'ai-guided' : dataSource;

      // Use unified endpoint - backend determines credit cost based on dataSource
      const response = await this.client.post(
        '/api/valuations/calculate',
        { ...data, dataSource: backendDataSource },
        {
          signal: options?.signal,
          timeout,
        }
      );

      perfLogger.end();
      return response.data.data || response.data; // Extract nested data if present
    } catch (error: any) {
      apiLogger.error('Valuation calculation failed', { error, operation: 'calculateValuationUnified' });
      
      if (error.response?.data?.error) {
        throw new Error(`Backend error: ${error.response.data.error}`);
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits for valuation');
      } else {
        throw new Error(`Valuation calculation failed: ${error.message}`);
      }
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/api/credits/health');
    return response.data;
  }
}

export const backendAPI = new BackendAPI();
