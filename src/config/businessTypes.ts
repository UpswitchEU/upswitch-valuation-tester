/**
 * Business Types Configuration - MINIMAL FALLBACK
 * 
 * This file contains only essential business types for emergency fallback.
 * The main data source is now the API with caching.
 * 
 * @deprecated Use API data via businessTypesApi.ts instead
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

export interface BusinessTypeOption {
  value: string;
  label: string;
  icon?: string;
  category: string;
}

// MINIMAL FALLBACK - Only 5 most common business types
// This is used only when API is completely unavailable
export const BUSINESS_TYPES_FALLBACK: BusinessTypeOption[] = [
  { value: 'restaurant', label: '🍴 Restaurant', category: 'Food & Beverage' },
  { value: 'saas', label: '💻 SaaS Platform', category: 'Technology' },
  { value: 'consulting', label: '💼 Consulting', category: 'Professional Services' },
  { value: 'retail', label: '🛍️ Retail Store', category: 'Retail' },
  { value: 'other', label: '📦 Other', category: 'Other' }
];

// Legacy export for backward compatibility
// @deprecated Use BUSINESS_TYPES_FALLBACK instead
export const BUSINESS_TYPES = BUSINESS_TYPES_FALLBACK;