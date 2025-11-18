/**
 * Backend API Service for Valuation Tester
 * 
 * Handles API calls to the main Upswitch backend (Node.js)
 * for credit management and valuation processing
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { ValuationRequest, ValuationResponse } from '../types/valuation';
import { normalizeCalculationSteps } from '../utils/calculationStepsNormalizer';
import { apiLogger, extractCorrelationId, setCorrelationFromResponse, createPerformanceLogger } from '../utils/logger';

class BackendAPI {
  private client: AxiosInstance;
  private activeRequests: Map<string, AbortController> = new Map();
  private requestTimeouts: Map<string, NodeJS.Timeout> = new Map();

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
        
        // Log response structure for valuation endpoints
        if (response.config.url?.includes('/calculate')) {
          const responseData = response.data?.data || response.data;
          apiLogger.info('Valuation API response received', {
            url: response.config.url,
            status: response.status,
            hasValuationId: !!responseData?.valuation_id,
            hasTransparency: !!responseData?.transparency,
            hasModularSystem: !!responseData?.modular_system,
            transparencyStepsCount: responseData?.transparency?.calculation_steps 
              ? normalizeCalculationSteps(responseData.transparency.calculation_steps).length 
              : 0,
            modularSystemStepsCount: responseData?.modular_system?.step_details?.length || 0,
            correlationId
          });
        }
        
        return response;
      },
      error => {
        const correlationId = error.response ? extractCorrelationId(error.response) : null;
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
    const timeoutId = setTimeout(() => {
      apiLogger.warn('Request timeout', { requestId, timeout });
      abortController.abort();
      this.activeRequests.delete(requestId);
      this.requestTimeouts.delete(requestId);
    }, timeout);
    
    this.requestTimeouts.set(requestId, timeoutId);

    try {
      apiLogger.info('Sending manual valuation request', {
        requestId,
        company_name: data.company_name,
        revenue: data.current_year_data?.revenue,
        ebitda: data.current_year_data?.ebitda,
        industry: data.industry,
        business_type_id: data.business_type_id,
        timeout
      });

      // Call Node.js backend which handles logging and proxies to Python engine
      const response = await this.client.post('/api/valuations/calculate/manual', data, {
        signal
      });
      
      // Extract correlation ID and valuation ID from response
      const responseData = response.data.data || response.data;
      const correlationId = extractCorrelationId(response);
      const valuationId = responseData?.valuation_id;
      
      // DIAGNOSTIC: Log html_report presence in response
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
        }
      });

      // DIAGNOSTIC: Console log for browser debugging
      console.log('[DIAGNOSTIC-FRONTEND-API] Response structure:', {
        responseStatus: response.status,
        responseDataStructure: {
          success: response.data.success,
          hasData: !!response.data.data,
          dataKeys: response.data.data ? Object.keys(response.data.data) : [],
          dataHasHtmlReport: !!response.data.data?.html_report,
          dataHtmlReportLength: response.data.data?.html_report?.length || 0
        },
        extractedResponseData: {
          hasHtmlReport: !!responseData?.html_report,
          htmlReportLength: responseData?.html_report?.length || 0,
          htmlReportPreview: responseData?.html_report?.substring(0, 200) || 'N/A'
        }
      });
      
      if (correlationId || valuationId) {
        setCorrelationFromResponse(response);
        apiLogger.info('Manual valuation response received', {
          valuationId,
          correlationId: correlationId || valuationId,
          hasTransparency: !!responseData?.transparency,
          hasModularSystem: !!responseData?.modular_system,
          transparencyStepsCount: responseData?.transparency?.calculation_steps?.length || 0,
          modularSystemStepsCount: responseData?.modular_system?.step_details?.length || 0,
          equityValueMid: responseData?.equity_value_mid,
          hasHtmlReport: !!responseData?.html_report,
          htmlReportLength: responseData?.html_report?.length || 0
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
   * Calls Python engine directly for PDF generation
   */
  async downloadAccountantViewPDF(
    request: ValuationRequest,
    options?: {
      signal?: AbortSignal;
      onProgress?: (progress: number) => void;
    }
  ): Promise<Blob> {
    const perfLogger = createPerformanceLogger('downloadAccountantViewPDF', 'api');
    
    try {
      // Use Python engine URL directly for PDF generation
      const pythonEngineUrl = import.meta.env.VITE_PYTHON_ENGINE_URL || 
                             'https://upswitch-valuation-engine-production.up.railway.app';
      
      const pdfUrl = `${pythonEngineUrl}/api/v1/valuation/pdf/accountant-view`;
      
      apiLogger.info('Requesting Accountant View PDF', {
        company_name: request.company_name,
        pdfUrl
      });

      const response = await axios.post(pdfUrl, request, {
        responseType: 'blob', // Important: request as blob for PDF
        signal: options?.signal,
        timeout: 120000, // 2 minutes for PDF generation
        headers: {
          'Content-Type': 'application/json',
        },
        onDownloadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(percentCompleted);
          }
        }
      });

      perfLogger.end({
        pdfSize: response.data.size,
        contentType: response.headers['content-type']
      });

      apiLogger.info('Accountant View PDF received', {
        pdfSize: response.data.size,
        contentType: response.headers['content-type']
      });

      return response.data;
    } catch (error: any) {
      perfLogger.end({ error: error.message });
      
      const correlationId = error.response ? extractCorrelationId(error.response) : null;
      apiLogger.error('Accountant View PDF download failed', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        correlationId
      });
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
   * Health check
   */
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/api/credits/health');
    return response.data;
  }
}

export const backendAPI = new BackendAPI();
