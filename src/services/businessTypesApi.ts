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
import { businessTypesCache } from './cache/businessTypesCache';
import { BUSINESS_TYPES_FALLBACK, BusinessTypeOption as ConfigBusinessTypeOption } from '../config/businessTypes';

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
// API SERVICE
// ============================================================================

class BusinessTypesApiService {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // Use the main backend API
    this.baseUrl = 'https://web-production-8d00b.up.railway.app';
    
    this.api = axios.create({
      baseURL: `${this.baseUrl}/api/business-types`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all business types from API with enhanced caching
   */
  async getBusinessTypes(): Promise<BusinessType[]> {
    try {
      // Check cache first
      if (businessTypesCache.hasValidCache()) {
        const cachedData = await businessTypesCache.getBusinessTypes();
        if (cachedData) {
          console.log('[BusinessTypesAPI] Serving from cache', {
            businessTypes: cachedData.businessTypes.length,
            categories: cachedData.categories.length,
            popularTypes: cachedData.popularTypes.length
          });
          return cachedData.businessTypes;
        }
      }

      // Fetch from API
      console.log('[BusinessTypesAPI] Fetching from API');
      const [typesResponse, categoriesResponse] = await Promise.all([
        this.api.get('/types', { params: { limit: 200 } }),
        this.api.get('/categories')
      ]);
      
      if (typesResponse.data.success && typesResponse.data.data) {
        const businessTypes = typesResponse.data.data.business_types;
        const categories = categoriesResponse.data.success ? categoriesResponse.data.data : [];
        
        // Cache the complete data
        await businessTypesCache.setBusinessTypes({
          businessTypes,
          categories,
          popularTypes: businessTypes.filter((bt: BusinessType) => bt.popular)
        });
        
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
   * Minimal hardcoded fallback business types
   * Uses the centralized fallback configuration
   */
  private getHardcodedBusinessTypes(): BusinessType[] {
    return BUSINESS_TYPES_FALLBACK.map((bt: ConfigBusinessTypeOption) => ({
      id: bt.value,
      title: bt.label.replace(/^[^\s]+\s/, ''), // Remove emoji
      description: `${bt.category} business`,
      short_description: `${bt.category} business`,
      icon: bt.icon || '📦',
      category: bt.category,
      category_id: bt.category.toLowerCase().replace(/\s+/g, '-'),
      industryMapping: bt.category,
      keywords: [bt.category.toLowerCase()],
      popular: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const businessTypesApiService = new BusinessTypesApiService();

export default businessTypesApiService;
