/**
 * BusinessTypeMatcher Engine - Business Type Matching & Suggestions
 *
 * Single Responsibility: Match user input to business types, handle suggestions and variations
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/form/business-type-matcher/BusinessTypeMatcher
 */

import { useCallback, useMemo } from 'react';
import type { BusinessTypeOption } from '../../../config/businessTypes';
import { generalLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MatchResult {
  businessTypeId: string | null;
  confidence: 'exact' | 'category' | 'partial' | 'variation' | 'none';
  matchedType: BusinessTypeOption | null;
  suggestions: BusinessTypeOption[];
}

export interface BusinessTypeMatcher {
  // Core matching
  matchBusinessType(query: string, businessTypes: BusinessTypeOption[]): MatchResult;

  // Utility methods
  getSuggestions(query: string, businessTypes: BusinessTypeOption[], limit?: number): BusinessTypeOption[];
  validateBusinessType(businessTypeId: string, businessTypes: BusinessTypeOption[]): boolean;
  getBusinessTypeById(businessTypeId: string, businessTypes: BusinessTypeOption[]): BusinessTypeOption | null;

  // Normalization
  normalizeQuery(query: string): string;
}

// ============================================================================
// BUSINESS TYPE VARIATIONS MAPPING
// ============================================================================

const BUSINESS_TYPE_VARIATIONS: Record<string, string[]> = {
  'b2b_saas': ['saas', 'software as a service', 'software service', 'b2b software', 'enterprise software'],
  'b2c': ['b2c', 'consumer business', 'retail business', 'consumer company'],
  'marketplace': ['marketplace', 'platform', 'two-sided marketplace', 'market place'],
  'ecommerce': ['e-commerce', 'ecommerce', 'online store', 'online shop', 'internet retailer'],
  'manufacturing': ['manufacturing', 'manufacturer', 'production', 'factory', 'industrial'],
  'services': ['services', 'service business', 'service company', 'professional services'],
  'bakery': ['bakery', 'bake shop', 'bakery shop', 'bread shop'],
  'restaurant': ['restaurant', 'cafe', 'bistro', 'dining', 'food service', 'eatery'],
  'consulting': ['consulting', 'consultant', 'advisory', 'consultancy', 'professional services'],
  'tech_startup': ['tech startup', 'startup', 'tech company', 'technology startup'],
  'real_estate': ['real estate', 'property', 'realty', 'real estate services'],
  'healthcare': ['healthcare', 'health care', 'medical', 'health services'],
  'education': ['education', 'educational', 'learning', 'training'],
  'finance': ['finance', 'financial', 'financial services', 'fintech'],
  'logistics': ['logistics', 'shipping', 'transportation', 'delivery'],
  'construction': ['construction', 'building', 'contracting', 'builder'],
  'retail': ['retail', 'retail store', 'shop', 'store'],
  'hospitality': ['hospitality', 'hotel', 'hospitality services', 'accommodation'],
  'agriculture': ['agriculture', 'farming', 'agricultural', 'farm'],
  'energy': ['energy', 'power', 'utilities', 'energy services'],
  'media': ['media', 'publishing', 'content', 'entertainment'],
  'non_profit': ['non-profit', 'nonprofit', 'ngo', 'charity', 'foundation'],
  'government': ['government', 'public sector', 'government services'],
  'other': ['other', 'miscellaneous', 'various', 'general business'],
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class BusinessTypeMatcherImpl implements BusinessTypeMatcher {
  /**
   * Match user query to business type with confidence scoring
   */
  matchBusinessType(query: string, businessTypes: BusinessTypeOption[]): MatchResult {
    if (!query || !businessTypes || businessTypes.length === 0) {
      return {
        businessTypeId: null,
        confidence: 'none',
        matchedType: null,
        suggestions: [],
      };
    }

    const normalizedQuery = this.normalizeQuery(query);

    // 1. Exact match on label
    const exactMatch = businessTypes.find(bt =>
      this.normalizeQuery(bt.label) === normalizedQuery
    );
    if (exactMatch) {
      generalLogger.info('BusinessTypeMatcher: Exact match found', {
        query,
        matched: exactMatch.label,
        value: exactMatch.value,
      });
      return {
        businessTypeId: exactMatch.value,
        confidence: 'exact',
        matchedType: exactMatch,
        suggestions: this.getSuggestions(query, businessTypes, 3),
      };
    }

    // 2. Category match
    const categoryMatch = businessTypes.find(bt =>
      this.normalizeQuery(bt.category).includes(normalizedQuery) ||
      normalizedQuery.includes(this.normalizeQuery(bt.category))
    );
    if (categoryMatch) {
      generalLogger.info('BusinessTypeMatcher: Category match found', {
        query,
        matched: categoryMatch.label,
        category: categoryMatch.category,
        value: categoryMatch.value,
      });
      return {
        businessTypeId: categoryMatch.value,
        confidence: 'category',
        matchedType: categoryMatch,
        suggestions: this.getSuggestions(query, businessTypes, 3),
      };
    }

    // 3. Partial match on label
    const partialMatch = businessTypes.find(bt =>
      this.normalizeQuery(bt.label).includes(normalizedQuery) ||
      normalizedQuery.includes(this.normalizeQuery(bt.label))
    );
    if (partialMatch) {
      generalLogger.info('BusinessTypeMatcher: Partial match found', {
        query,
        matched: partialMatch.label,
        value: partialMatch.value,
      });
      return {
        businessTypeId: partialMatch.value,
        confidence: 'partial',
        matchedType: partialMatch,
        suggestions: this.getSuggestions(query, businessTypes, 3),
      };
    }

    // 4. Variation match
    const variationMatch = this.findVariationMatch(normalizedQuery, businessTypes);
    if (variationMatch) {
      generalLogger.info('BusinessTypeMatcher: Variation match found', {
        query,
        matched: variationMatch.label,
        value: variationMatch.value,
      });
      return {
        businessTypeId: variationMatch.value,
        confidence: 'variation',
        matchedType: variationMatch,
        suggestions: this.getSuggestions(query, businessTypes, 3),
      };
    }

    // No match found - return suggestions
    const suggestions = this.getSuggestions(query, businessTypes, 5);
    generalLogger.info('BusinessTypeMatcher: No match found, providing suggestions', {
      query,
      suggestionCount: suggestions.length,
    });

    return {
      businessTypeId: null,
      confidence: 'none',
      matchedType: null,
      suggestions,
    };
  }

  /**
   * Get suggestions based on query
   */
  getSuggestions(query: string, businessTypes: BusinessTypeOption[], limit: number = 5): BusinessTypeOption[] {
    if (!query || !businessTypes) return [];

    const normalizedQuery = this.normalizeQuery(query);

    // Score each business type based on relevance
    const scored = businessTypes.map(bt => ({
      type: bt,
      score: this.calculateRelevanceScore(normalizedQuery, bt),
    }));

    // Sort by score and return top matches
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.type);
  }

  /**
   * Validate if business type ID exists
   */
  validateBusinessType(businessTypeId: string, businessTypes: BusinessTypeOption[]): boolean {
    return businessTypes.some(bt => bt.value === businessTypeId);
  }

  /**
   * Get business type by ID
   */
  getBusinessTypeById(businessTypeId: string, businessTypes: BusinessTypeOption[]): BusinessTypeOption | null {
    return businessTypes.find(bt => bt.value === businessTypeId) || null;
  }

  /**
   * Normalize query for matching
   */
  normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Find match using business type variations
   */
  private findVariationMatch(normalizedQuery: string, businessTypes: BusinessTypeOption[]): BusinessTypeOption | null {
    for (const [businessTypeId, variations] of Object.entries(BUSINESS_TYPE_VARIATIONS)) {
      const matchesVariation = variations.some(variation =>
        normalizedQuery.includes(variation) || variation.includes(normalizedQuery)
      );

      if (matchesVariation) {
        const matchedType = businessTypes.find(bt => bt.value === businessTypeId);
        if (matchedType) {
          return matchedType;
        }
      }
    }

    return null;
  }

  /**
   * Calculate relevance score for suggestions
   */
  private calculateRelevanceScore(normalizedQuery: string, businessType: BusinessTypeOption): number {
    let score = 0;

    const normalizedLabel = this.normalizeQuery(businessType.label);
    const normalizedCategory = this.normalizeQuery(businessType.category);

    // Exact matches get highest score
    if (normalizedLabel === normalizedQuery) return 100;
    if (normalizedCategory === normalizedQuery) return 90;

    // Partial matches
    if (normalizedLabel.includes(normalizedQuery)) score += 50;
    if (normalizedQuery.includes(normalizedLabel)) score += 40;
    if (normalizedCategory.includes(normalizedQuery)) score += 30;
    if (normalizedQuery.includes(normalizedCategory)) score += 20;

    // Variation matches
    const businessTypeVariations = BUSINESS_TYPE_VARIATIONS[businessType.value] || [];
    const hasVariationMatch = businessTypeVariations.some(variation =>
      normalizedQuery.includes(variation) || variation.includes(normalizedQuery)
    );
    if (hasVariationMatch) score += 35;

    // Word overlap scoring
    const queryWords = normalizedQuery.split(' ');
    const labelWords = normalizedLabel.split(' ');
    const categoryWords = normalizedCategory.split(' ');

    queryWords.forEach(queryWord => {
      labelWords.forEach(labelWord => {
        if (labelWord.includes(queryWord) || queryWord.includes(labelWord)) {
          score += 10;
        }
      });

      categoryWords.forEach(categoryWord => {
        if (categoryWord.includes(queryWord) || queryWord.includes(categoryWord)) {
          score += 5;
        }
      });
    });

    return score;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseBusinessTypeMatcherResult {
  matcher: BusinessTypeMatcher;
  actions: {
    matchBusinessType: (query: string, businessTypes: BusinessTypeOption[]) => MatchResult;
    getSuggestions: (query: string, businessTypes: BusinessTypeOption[], limit?: number) => BusinessTypeOption[];
    validateBusinessType: (businessTypeId: string, businessTypes: BusinessTypeOption[]) => boolean;
    getBusinessTypeById: (businessTypeId: string, businessTypes: BusinessTypeOption[]) => BusinessTypeOption | null;
  };
  utilities: {
    normalizeQuery: (query: string) => string;
  };
}

/**
 * useBusinessTypeMatcher Hook
 *
 * React hook interface for BusinessTypeMatcher engine
 * Provides reactive business type matching and suggestions
 */
export const useBusinessTypeMatcher = (): UseBusinessTypeMatcherResult => {
  const matcher = useMemo(() => new BusinessTypeMatcherImpl(), []);

  const actions = {
    matchBusinessType: useCallback(
      (query: string, businessTypes: BusinessTypeOption[]) =>
        matcher.matchBusinessType(query, businessTypes),
      [matcher]
    ),
    getSuggestions: useCallback(
      (query: string, businessTypes: BusinessTypeOption[], limit?: number) =>
        matcher.getSuggestions(query, businessTypes, limit),
      [matcher]
    ),
    validateBusinessType: useCallback(
      (businessTypeId: string, businessTypes: BusinessTypeOption[]) =>
        matcher.validateBusinessType(businessTypeId, businessTypes),
      [matcher]
    ),
    getBusinessTypeById: useCallback(
      (businessTypeId: string, businessTypes: BusinessTypeOption[]) =>
        matcher.getBusinessTypeById(businessTypeId, businessTypes),
      [matcher]
    ),
  };

  const utilities = {
    normalizeQuery: useCallback((query: string) => matcher.normalizeQuery(query), [matcher]),
  };

  return {
    matcher,
    actions,
    utilities,
  };
};

