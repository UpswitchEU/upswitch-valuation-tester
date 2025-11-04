/**
 * Business Types API Service for Valuation Tester
 * 
 * Fetches business types from the main backend API with caching.
 * Falls back to hardcoded data if API is unavailable.
 * 
 * Enhanced with Phase 2 features:
 * - Full business type metadata
 * - Dynamic questions
 * - Real-time validation
 * - Benchmark comparison
 * 
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { BUSINESS_TYPES_FALLBACK, BusinessTypeOption as ConfigBusinessTypeOption } from '../config/businessTypes';
import { businessTypesCache } from './cache/businessTypesCache';

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
  industry?: string;
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
          // DIAGNOSTIC: Log cache hit with sample data
          console.log('[DIAGNOSTIC-API] 🎯 SERVING FROM CACHE');
          if (cachedData.businessTypes.length > 0) {
            console.log('[DIAGNOSTIC-API] Sample cached business type:', {
              id: cachedData.businessTypes[0].id,
              title: cachedData.businessTypes[0].title,
              dcfPreference: cachedData.businessTypes[0].dcfPreference,
              multiplesPreference: cachedData.businessTypes[0].multiplesPreference,
              ownerDependencyImpact: cachedData.businessTypes[0].ownerDependencyImpact,
              keyMetrics: cachedData.businessTypes[0].keyMetrics,
              hasAllFields: !!(cachedData.businessTypes[0].dcfPreference !== undefined && cachedData.businessTypes[0].multiplesPreference !== undefined),
              cacheSource: 'IndexedDB/LocalStorage'
            });
          }
          if (import.meta.env.DEV) {
            console.log('[BusinessTypesAPI] Serving from cache', {
              businessTypes: cachedData.businessTypes.length,
              categories: cachedData.categories.length,
              popularTypes: cachedData.popularTypes.length
            });
          }
          return cachedData.businessTypes;
        }
      }

      // Fetch from API
      console.log('[DIAGNOSTIC-API] 🌐 FETCHING FROM API (cache miss or expired)');
      if (import.meta.env.DEV) {
        console.log('[BusinessTypesAPI] Fetching from API');
      }
      const [typesResponse, categoriesResponse] = await Promise.all([
        this.api.get('/types', { params: { limit: 200 } }),
        this.api.get('/categories')
      ]);
      
      if (typesResponse.data.success && typesResponse.data.data) {
        const businessTypes = typesResponse.data.data.business_types;
        const categories = categoriesResponse.data.success ? categoriesResponse.data.data : [];
        
        // DIAGNOSTIC: Log sample business type to verify preferences are present
        console.log('[DIAGNOSTIC-API] ✅ API Response received');
        if (businessTypes.length > 0) {
          console.log('[DIAGNOSTIC-API] Sample business type from API:', {
            id: businessTypes[0].id,
            title: businessTypes[0].title,
            dcfPreference: businessTypes[0].dcfPreference,
            multiplesPreference: businessTypes[0].multiplesPreference,
            ownerDependencyImpact: businessTypes[0].ownerDependencyImpact,
            keyMetrics: businessTypes[0].keyMetrics,
            hasAllFields: !!(businessTypes[0].dcfPreference !== undefined && businessTypes[0].multiplesPreference !== undefined),
            apiEndpoint: `${this.baseUrl}/api/business-types/types`
          });
          
          // DIAGNOSTIC: Also log raw API response structure
          console.log('[DIAGNOSTIC-API] Raw API response structure:', {
            responseKeys: Object.keys(businessTypes[0]),
            sampleRawObject: JSON.stringify(businessTypes[0]).substring(0, 200) + '...'
          });
        }
        
        // Cache the complete data
        await businessTypesCache.setBusinessTypes({
          businessTypes,
          categories,
          popularTypes: businessTypes.filter((bt: BusinessType) => bt.popular)
        });
        
        if (import.meta.env.DEV) {
          console.log('[BusinessTypesAPI] Fetched and cached', businessTypes.length, 'business types');
        }
        return businessTypes;
      }
      
      throw new Error('API returned unsuccessful response');
    } catch (error) {
      console.error('[BusinessTypesAPI] Failed to fetch business types:', error);
      
      // Return hardcoded fallback
      console.log('[DIAGNOSTIC-API] ⚠️ USING HARDCODED FALLBACK (API error)');
      if (import.meta.env.DEV) {
        console.log('[BusinessTypesAPI] Using hardcoded fallback data');
      }
      const fallbackData = this.getHardcodedBusinessTypes();
      
      // DIAGNOSTIC: Log fallback data structure
      if (fallbackData.length > 0) {
        console.log('[DIAGNOSTIC-API] Sample fallback business type:', {
          id: fallbackData[0].id,
          title: fallbackData[0].title,
          dcfPreference: fallbackData[0].dcfPreference,
          multiplesPreference: fallbackData[0].multiplesPreference,
          hasAllFields: !!(fallbackData[0].dcfPreference !== undefined && fallbackData[0].multiplesPreference !== undefined),
          source: 'Hardcoded Fallback'
        });
      }
      
      return fallbackData;
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
      // Add default preferences for fallback data
      dcfPreference: 0.47,
      multiplesPreference: 0.53,
      ownerDependencyImpact: 0.5,
      keyMetrics: ['revenue', 'ebitda', 'growth_rate'],
      typicalEmployeeRange: { min: 1, max: 50 },
      typicalRevenueRange: { min: 100000, max: 5000000 },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  // ==========================================================================
  // PHASE 2: ENHANCED METADATA METHODS
  // ==========================================================================

  /**
   * Get full business type with all metadata
   * Includes: questions, validations, benchmarks, metadata
   */
  async getBusinessTypeFull(businessTypeId: string): Promise<any> {
    try {
      if (import.meta.env.DEV) {
        console.log(`[BusinessTypesApi] Fetching full metadata for: ${businessTypeId}`);
      }
      
      const response = await this.api.get(`/types/${businessTypeId}/full`);
      
      if (response.data.success && response.data.data) {
        if (import.meta.env.DEV) {
          console.log(`[BusinessTypesApi] Full metadata loaded`, {
            businessTypeId,
            questionsCount: response.data.data.questions?.length || 0,
          validationsCount: response.data.data.validations?.length || 0,
          benchmarksCount: response.data.data.benchmarks?.length || 0,
          });
        }
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`[BusinessTypesApi] Failed to fetch full metadata:`, error);
      throw error;
    }
  }

  /**
   * Get dynamic questions for a business type
   */
  async getBusinessTypeQuestions(
    businessTypeId: string,
    options?: {
      flow_type?: 'manual' | 'ai_guided';
      phase?: string;
      existing_data?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      if (import.meta.env.DEV) {
        console.log(`[BusinessTypesApi] Fetching questions for: ${businessTypeId}`, options);
      }
      
      const params: any = {};
      
      if (options?.flow_type) {
        params.flow_type = options.flow_type;
      }
      
      if (options?.phase) {
        params.phase = options.phase;
      }
      
      if (options?.existing_data) {
        params.existing_data = JSON.stringify(options.existing_data);
      }
      
      const response = await this.api.get(`/types/${businessTypeId}/questions`, { params });
      
      if (response.data.success && response.data.data) {
        if (import.meta.env.DEV) {
          console.log(`[BusinessTypesApi] Questions loaded`, {
            businessTypeId,
            totalQuestions: response.data.data.questions?.length || 0,
          requiredQuestions: response.data.data.total_required || 0,
          estimatedTime: response.data.data.estimated_time,
          });
        }
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`[BusinessTypesApi] Failed to fetch questions:`, error);
      throw error;
    }
  }

  /**
   * Validate user data against business-type-specific rules
   */
  async validateBusinessTypeData(
    businessTypeId: string,
    data: Record<string, any>
  ): Promise<any> {
    try {
      console.log(`[BusinessTypesApi] Validating data for: ${businessTypeId}`, {
        dataKeys: Object.keys(data),
      });
      
      const response = await this.api.post(`/types/${businessTypeId}/validate`, { data });
      
      if (response.data.success && response.data.data) {
        console.log(`[BusinessTypesApi] Validation complete`, {
          businessTypeId,
          valid: response.data.data.valid,
          errorsCount: response.data.data.errors?.length || 0,
          warningsCount: response.data.data.warnings?.length || 0,
          suggestionsCount: response.data.data.suggestions?.length || 0,
        });
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`[BusinessTypesApi] Validation failed:`, error);
      throw error;
    }
  }

  /**
   * Get industry benchmarks for a business type
   */
  async getBusinessTypeBenchmarks(
    businessTypeId: string,
    options?: {
      country?: string;
      metrics?: string[];
      user_data?: Record<string, number>;
    }
  ): Promise<any> {
    try {
      console.log(`[BusinessTypesApi] Fetching benchmarks for: ${businessTypeId}`, options);
      
      const params: any = {};
      
      if (options?.country) {
        params.country = options.country;
      }
      
      if (options?.metrics && options.metrics.length > 0) {
        params.metrics = options.metrics.join(',');
      }
      
      if (options?.user_data) {
        params.user_data = JSON.stringify(options.user_data);
      }
      
      const response = await this.api.get(`/types/${businessTypeId}/benchmarks`, { params });
      
      if (response.data.success && response.data.data) {
        console.log(`[BusinessTypesApi] Benchmarks loaded`, {
          businessTypeId,
          benchmarksCount: Object.keys(response.data.data.benchmarks || {}).length,
          dataSource: response.data.data.data_source,
          year: response.data.data.year,
        });
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`[BusinessTypesApi] Failed to fetch benchmarks:`, error);
      throw error;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const businessTypesApiService = new BusinessTypesApiService();

export default businessTypesApiService;
