/**
 * Backend API Service for Valuation Tester
 * 
 * Handles API calls to the main Upswitch backend (Node.js)
 * for credit management and valuation processing
 */

import axios, { AxiosInstance } from 'axios';
import type { ValuationRequest, ValuationResponse } from '../types/valuation';
import { apiLogger } from '../utils/logger';

class BackendAPI {
  private client: AxiosInstance;

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

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        apiLogger.error('Backend API Error', {
          error: error.response?.data || error.message,
          status: error.response?.status
        });
        throw error;
      }
    );
  }

  /**
   * Manual valuation - FREE (no credit consumption)
   * Routes through Node.js backend for analytics tracking
   */
  async calculateManualValuation(data: ValuationRequest): Promise<ValuationResponse> {
    try {
      console.log('Manual valuation request data:', {
        company_name: data.company_name,
        revenue: data.current_year_data?.revenue,
        ebitda: data.current_year_data?.ebitda,
        revenueType: typeof data.current_year_data?.revenue,
        ebitdaType: typeof data.current_year_data?.ebitda,
        fullData: data
      });

      // Call Node.js backend which handles logging and proxies to Python engine
      const response = await this.client.post('/api/valuations/calculate/manual', data);
      
      console.log('Backend response for manual valuation:', response.data);
      return response.data.data; // Extract nested data from { success, data, message }
    } catch (error: any) {
      console.error('Manual valuation failed:', error);
      
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
