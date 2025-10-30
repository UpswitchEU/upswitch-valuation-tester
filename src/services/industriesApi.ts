/**
 * Industries API Service
 * 
 * Service for fetching and caching valid industry classifications
 * from the valuation engine API.
 */

export interface IndustryListResponse {
  industries: string[];
  count: number;
  last_updated: string;
  description: string;
}

export interface IndustryStatsResponse {
  most_common: Array<{ industry: string; count: number }>;
  unknown_values: Array<{ industry: string; count: number }>;
  total_requests: number;
  total_unknown: number;
  unknown_rate: number;
  last_updated: string;
}

// Cache configuration
const CACHE_CONFIG = {
  VERSION: '1.0.0',
  TTL: 5 * 60 * 1000, // 5 minutes
  KEY: 'industries_cache'
};

interface CacheEntry {
  data: IndustryListResponse;
  timestamp: number;
  version: string;
}

class IndustriesApiService {
  private cache: CacheEntry | null = null;
  private pendingRequest: Promise<IndustryListResponse> | null = null;

  /**
   * Get valid industries with caching
   */
  async getIndustries(): Promise<IndustryListResponse> {
    // Check cache first
    if (this.cache && this.isCacheValid()) {
      return this.cache.data;
    }

    // If there's already a pending request, wait for it
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    // Make new request
    this.pendingRequest = this.fetchIndustries();
    
    try {
      const result = await this.pendingRequest;
      this.cache = {
        data: result,
        timestamp: Date.now(),
        version: CACHE_CONFIG.VERSION
      };
      return result;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * Get industry usage statistics
   */
  async getIndustryStats(): Promise<IndustryStatsResponse> {
    try {
      const response = await fetch('/api/v1/industries/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch industry stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching industry stats:', error);
      throw error;
    }
  }

  /**
   * Check if industry is valid
   */
  async isValidIndustry(industry: string): Promise<boolean> {
    try {
      const industries = await this.getIndustries();
      return industries.industries.includes(industry.toLowerCase());
    } catch (error) {
      console.error('Error validating industry:', error);
      return false;
    }
  }

  /**
   * Get industry suggestions based on partial input
   */
  async getIndustrySuggestions(partial: string): Promise<string[]> {
    try {
      const industries = await this.getIndustries();
      const lowerPartial = partial.toLowerCase();
      
      return industries.industries
        .filter(industry => industry.includes(lowerPartial))
        .slice(0, 10); // Limit to 10 suggestions
    } catch (error) {
      console.error('Error getting industry suggestions:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.pendingRequest = null;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    const age = now - this.cache.timestamp;
    
    return age < CACHE_CONFIG.TTL && this.cache.version === CACHE_CONFIG.VERSION;
  }

  /**
   * Fetch industries from API
   */
  private async fetchIndustries(): Promise<IndustryListResponse> {
    try {
      const response = await fetch('/api/v1/industries');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch industries: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching industries:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const industriesApi = new IndustriesApiService();

// Export types
export type { IndustryListResponse, IndustryStatsResponse };
