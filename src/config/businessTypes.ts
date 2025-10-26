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

// MINIMAL FALLBACK - Business types that match Python engine BusinessModel enum
// This is used only when API is completely unavailable
export const BUSINESS_TYPES_FALLBACK: BusinessTypeOption[] = [
  { value: 'b2b_saas', label: '💻 B2B SaaS', category: 'Technology' },
  { value: 'b2c', label: '🛒 B2C Business', category: 'Consumer' },
  { value: 'marketplace', label: '🏪 Marketplace', category: 'Platform' },
  { value: 'ecommerce', label: '🛍️ E-commerce', category: 'Retail' },
  { value: 'manufacturing', label: '🏭 Manufacturing', category: 'Production' },
  { value: 'services', label: '💼 Services', category: 'Professional' },
  { value: 'other', label: '📦 Other', category: 'Other' }
];

// Legacy export for backward compatibility
// @deprecated Use BUSINESS_TYPES_FALLBACK instead
export const BUSINESS_TYPES = BUSINESS_TYPES_FALLBACK;