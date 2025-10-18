/**
 * ValuationChatController
 * 
 * Adapted from Ilara AI ChatController for company valuation workflow.
 * Handles API orchestration for company lookup and financial data fetching.
 * 
 * Features:
 * - Comprehensive error handling
 * - Health monitoring
 * - Request/response logging
 * - Graceful fallbacks
 */

import type { CompanyFinancialData } from '../../types/registry';
import { apiLogger } from '../../utils/logger';

export interface CompanySearchResult {
  company_id: string;
  company_name: string;
  result_type: string;
  [key: string]: any;
}

export interface CompanySearchResponse {
  success: boolean;
  results: CompanySearchResult[];
  error?: string;
  requestId: string;
}

export interface HealthStatus {
  available: boolean;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  message?: string;
  timestamp: string;
  requestId: string;
}

export class ValuationChatController {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to production Railway URL
    this.baseUrl = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                   import.meta.env.VITE_VALUATION_API_URL || 
                   'https://upswitch-valuation-engine-production.up.railway.app';
    apiLogger.info('ValuationChatController initialized', { baseUrl: this.baseUrl });
  }

  /**
   * Search for companies by name
   * Adapted from Ilara's sendMessage pattern
   */
  async searchCompany(query: string, country: string = 'BE'): Promise<CompanySearchResponse> {
    const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    apiLogger.debug(`Searching for company`, { requestId, query, country });

    try {
      const response = await fetch(`${this.baseUrl}/api/registry/search`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          company_name: query,
          country_code: country,
          limit: 10
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${requestId}] Search failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info(`Search successful`, {
        requestId,
        resultsCount: data.results?.length || data.length || 0,
        timestamp: new Date().toISOString()
      });

      // Handle both array response and object with results property
      const results = Array.isArray(data) ? data : (data.results || []);

      return {
        success: true,
        results,
        requestId,
      };
    } catch (error) {
      console.error(`❌ [${requestId}] Search error:`, {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Graceful fallback - return empty results instead of throwing
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      };
    }
  }

  /**
   * Fetch company financials by ID
   * New endpoint following Ilara patterns
   */
  async getCompanyFinancials(
    companyId: string,
    country: string = 'BE'
  ): Promise<CompanyFinancialData> {
    const requestId = `financials_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    apiLogger.debug(`Fetching financials`, { requestId, companyId, country });

    try {
      const response = await fetch(`${this.baseUrl}/api/registry/financials`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          company_id: companyId,
          country_code: country,
          years: 3
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${requestId}] Financials fetch failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Financials fetch failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      apiLogger.info(`Financials received`, {
        requestId,
        companyName: data.company_name,
        yearsOfData: data.filing_history?.length || 0,
        timestamp: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error(`❌ [${requestId}] Financials error:`, {
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Check backend health
   * Directly adapted from Ilara's health monitoring
   */
  async checkHealth(): Promise<HealthStatus> {
    const requestId = `health_${Date.now()}`;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        // Add timeout
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const data = await response.json();
      
      const healthStatus: HealthStatus = {
        available: response.ok && data.status === 'healthy',
        status: response.ok ? (data.status || 'healthy') : 'error',
        message: data.message,
        timestamp: new Date().toISOString(),
        requestId,
      };

      apiLogger.info(`Health check`, { requestId, healthStatus });
      
      return healthStatus;
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Health check failed:`, error);
      
      return {
        available: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Backend unreachable',
        timestamp: new Date().toISOString(),
        requestId,
      };
    }
  }

  /**
   * Validate company ID format
   * Helper method for pre-flight validation
   */
  isValidCompanyId(companyId: string, country: string = 'BE'): boolean {
    // Check for mock/suggestion IDs first (backend fallback when data unavailable)
    if (!companyId || 
        companyId.length < 3 || 
        companyId.startsWith('suggestion_') || 
        companyId.startsWith('mock_')) {
      return false;
    }
    
    // Belgian company numbers are 10 digits with dots: 0123.456.789
    if (country === 'BE') {
      const cleaned = companyId.replace(/\./g, '');
      return /^\d{10}$/.test(cleaned);
    }
    
    // Default: any non-empty string (for other countries)
    return companyId.length > 0;
  }
}
