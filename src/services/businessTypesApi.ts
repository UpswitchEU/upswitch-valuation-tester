/**
 * Business Types API Service for Valuation Tester
 * 
 * Fetches business types from the main backend API with caching.
 * Falls back to hardcoded data if API is unavailable.
 * 
 * @author UpSwitch CTO Team
 * @version 1.0.0
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessType {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  icon: string;
  category: string;
  category_id: string;
  industryMapping: string;
  keywords: string[];
  popular: boolean;
  dcfPreference?: number;
  multiplesPreference?: number;
  ownerDependencyImpact?: number;
  keyMetrics?: string[];
  typicalEmployeeRange?: { min: number; max: number };
  typicalRevenueRange?: { min: number; max: number };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTypeOption {
  value: string;
  label: string;
  icon?: string;
  category: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

// ============================================================================
// CACHE SERVICE
// ============================================================================

class BusinessTypesCache {
  private cacheKey = 'upswitch_valuation_tester_business_types';
  private ttl = 24 * 60 * 60 * 1000; // 24 hours

  set(data: BusinessType[]): void {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: this.ttl
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('[BusinessTypesCache] Failed to cache data:', error);
    }
  }

  get(): BusinessType[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        this.clear();
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('[BusinessTypesCache] Failed to retrieve cached data:', error);
      this.clear();
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.warn('[BusinessTypesCache] Failed to clear cache:', error);
    }
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

class BusinessTypesApiService {
  private api: AxiosInstance;
  private cache: BusinessTypesCache;
  private baseUrl: string;

  constructor() {
    // Use the main backend API
    this.baseUrl = 'https://web-production-8d00b.up.railway.app';
    this.cache = new BusinessTypesCache();
    
    this.api = axios.create({
      baseURL: `${this.baseUrl}/api/business-types`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all business types from API
   */
  async getBusinessTypes(): Promise<BusinessType[]> {
    try {
      // Check cache first
      const cached = this.cache.get();
      if (cached) {
        console.log('[BusinessTypesAPI] Serving from cache');
        return cached;
      }

      // Fetch from API
      console.log('[BusinessTypesAPI] Fetching from API');
      const response = await this.api.get('/types', { 
        params: { limit: 200 } 
      });
      
      if (response.data.success && response.data.data) {
        const businessTypes = response.data.data.business_types;
        
        // Cache the data
        this.cache.set(businessTypes);
        
        console.log('[BusinessTypesAPI] Fetched and cached', businessTypes.length, 'business types');
        return businessTypes;
      }
      
      throw new Error('API returned unsuccessful response');
    } catch (error) {
      console.error('[BusinessTypesAPI] Failed to fetch business types:', error);
      
      // Return hardcoded fallback
      console.log('[BusinessTypesAPI] Using hardcoded fallback data');
      return this.getHardcodedBusinessTypes();
    }
  }

  /**
   * Get business types as options for dropdown
   */
  async getBusinessTypeOptions(): Promise<BusinessTypeOption[]> {
    const businessTypes = await this.getBusinessTypes();
    
    return businessTypes.map(bt => ({
      value: bt.id,
      label: `${bt.icon} ${bt.title}`,
      icon: bt.icon,
      category: bt.category
    }));
  }

  /**
   * Hardcoded fallback business types
   */
  private getHardcodedBusinessTypes(): BusinessType[] {
    return [
      {
        id: 'restaurant',
        title: 'Restaurant',
        description: 'Dining establishments, cafes, bistros',
        short_description: 'Dining establishments, cafes, bistros',
        icon: '🍴',
        category: 'Food & Beverage',
        category_id: 'food-beverage',
        industryMapping: 'Food & Beverage',
        keywords: ['dining', 'cafe', 'bistro', 'eatery', 'food service'],
        popular: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'saas',
        title: 'SaaS Platform',
        description: 'Software as a Service platform',
        short_description: 'Subscription-based software platform',
        icon: '💻',
        category: 'Tech & Digital',
        category_id: 'tech-digital',
        industryMapping: 'Technology',
        keywords: ['software', 'saas', 'subscription', 'platform'],
        popular: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'consulting',
        title: 'Business Consulting',
        description: 'Management consulting, strategy, business advisory',
        short_description: 'Management consulting, strategy, business advisory',
        icon: '💼',
        category: 'Professional Services',
        category_id: 'professional-services',
        industryMapping: 'Professional Services',
        keywords: ['consulting', 'business consultant', 'management consulting'],
        popular: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const businessTypesApiService = new BusinessTypesApiService();

export default businessTypesApiService;
