/**
 * Backend API Service for Valuation Tester
 * 
 * Handles API calls to the main Upswitch backend (Node.js)
 * for credit management and valuation processing
 */

import axios, { AxiosInstance } from 'axios';
import { apiLogger } from '../utils/logger';
import type { ValuationRequest, ValuationResponse } from '../types/valuation';

class BackendAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || 
               import.meta.env.VITE_API_BASE_URL || 
               'https://web-production-8d00b.up.railway.app',
      timeout: 30000,
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
   */
  async calculateManualValuation(data: ValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/valuations/calculate/manual', data);
    return response.data;
  }

  /**
   * AI-guided valuation - PREMIUM (requires 1 credit)
   */
  async calculateAIGuidedValuation(data: ValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/valuations/calculate/ai-guided', data);
    return response.data;
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
    return response.data;
  }

  /**
   * Get existing report
   */
  async getReport(reportId: string): Promise<ValuationResponse> {
    const response = await this.client.get(`/api/valuations/reports/${reportId}`);
    return response.data;
  }

  /**
   * Update existing report
   */
  async updateReport(reportId: string, data: Partial<ValuationRequest>): Promise<ValuationResponse> {
    const response = await this.client.put(`/api/valuations/reports/${reportId}`, data);
    return response.data;
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
    return response.data;
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
   * Health check
   */
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/api/credits/health');
    return response.data;
  }
}

export const backendAPI = new BackendAPI();
