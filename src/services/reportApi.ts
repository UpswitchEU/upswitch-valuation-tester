/**
 * Report API Service - Frontend client for report persistence
 */

import { backendAPI } from './backendApi';

export interface ReportData {
  id: string;
  user_id?: string;
  flow_type?: 'manual' | 'ai-guided';
  stage: 'flow-selection' | 'data-entry' | 'processing' | 'results';
  company_name?: string;
  valuation_data?: any;
  partial_data?: any;
  model_version?: string;
  engine_version?: string;
  credits_used?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateReportResponse {
  success: boolean;
  report_id: string;
  data: ReportData;
}

export interface GetReportResponse {
  success: boolean;
  data: ReportData;
}

export interface UpdateReportResponse {
  success: boolean;
  data: ReportData;
}

export interface ListReportsResponse {
  success: boolean;
  data: ReportData[];
}

class ReportApiService {
  private deviceFingerprint: string | null = null;

  async createReport(flowType?: string): Promise<CreateReportResponse> {
    const deviceFingerprint = await this.getDeviceFingerprint();
    
    const response = await backendAPI.post('/api/v1/reports', 
      { flow_type: flowType },
      { headers: { 'X-Device-Fingerprint': deviceFingerprint } }
    );
    
    return response.data;
  }
  
  async getReport(reportId: string): Promise<GetReportResponse> {
    const response = await backendAPI.get(`/api/v1/reports/${reportId}`);
    return response.data;
  }
  
  async updateReport(reportId: string, data: Partial<ReportData>): Promise<UpdateReportResponse> {
    const deviceFingerprint = await this.getDeviceFingerprint();
    
    const response = await backendAPI.patch(`/api/v1/reports/${reportId}`, data, {
      headers: { 'X-Device-Fingerprint': deviceFingerprint }
    });
    
    return response.data;
  }

  async deleteReport(reportId: string): Promise<{ success: boolean; message: string }> {
    const response = await backendAPI.delete(`/api/v1/reports/${reportId}`);
    return response.data;
  }

  async listReports(userId?: string, limit: number = 50, offset: number = 0): Promise<ListReportsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await backendAPI.get(`/api/v1/reports?${params.toString()}`);
    return response.data;
  }
  
  private async getDeviceFingerprint(): Promise<string> {
    if (this.deviceFingerprint) {
      return this.deviceFingerprint;
    }

    try {
      // Create a more robust device fingerprint
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.platform,
        navigator.cookieEnabled ? '1' : '0',
        navigator.doNotTrack || '0',
        // Add some entropy
        Math.random().toString(36).substring(2, 15)
      ];
      
      const fingerprintString = components.join('|');
      
      // Use Web Crypto API if available, fallback to simple hash
      if (crypto && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        this.deviceFingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback for older browsers
        this.deviceFingerprint = this.simpleHash(fingerprintString);
      }
      
      return this.deviceFingerprint;
    } catch (error) {
      console.warn('Failed to generate device fingerprint, using fallback:', error);
      // Fallback to a simple hash
      this.deviceFingerprint = this.simpleHash(
        navigator.userAgent + 
        screen.width + 
        screen.height + 
        new Date().getTimezoneOffset()
      );
      return this.deviceFingerprint;
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // Utility method to check if a report exists
  async reportExists(reportId: string): Promise<boolean> {
    try {
      await this.getReport(reportId);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  // Utility method to save partial data
  async savePartialData(reportId: string, partialData: any): Promise<void> {
    await this.updateReport(reportId, { partial_data: partialData });
  }

  // Utility method to complete a report
  async completeReport(reportId: string, valuationData: any): Promise<void> {
    await this.updateReport(reportId, {
      stage: 'results',
      valuation_data: valuationData,
      completed_at: new Date().toISOString()
    });
  }
}

export const reportApiService = new ReportApiService();
