/**
 * Business Information Extraction Utilities
 * 
 * Shared utility functions for extracting and validating business information
 * from various sources to eliminate code duplication.
 * 
 * Author: Upswitch Engineering Team
 * Date: October 2025
 */

import { BusinessModel } from '../types/valuation';

/**
 * Map various business model formats to standard enum
 */
export function mapToBusinessModel(value: string): BusinessModel | string {
  const mapping: Record<string, BusinessModel> = {
    'saas': 'b2b_saas',
    'software': 'b2b_saas',
    'b2b': 'b2b_saas',
    'consumer': 'b2c',
    'retail': 'b2c',
    'platform': 'marketplace',
    'ecommerce': 'ecommerce',
    'e-commerce': 'ecommerce',
    'manufacturing': 'manufacturing',
    'services': 'services',
    'consulting': 'services',
    'professional': 'services',
  };
  
  return mapping[value.toLowerCase()] || value;
}

/**
 * Infer business model from industry
 */
export function inferBusinessModelFromIndustry(industry: string): BusinessModel | string {
  const industryMapping: Record<string, BusinessModel> = {
    'technology': 'b2b_saas',
    'software': 'b2b_saas',
    'retail': 'b2c',
    'ecommerce': 'ecommerce',
    'manufacturing': 'manufacturing',
    'services': 'services',
    'healthcare': 'services',
    'finance': 'services',
    'real_estate': 'services',
    'hospitality': 'services',
    'construction': 'services',
  };
  
  return industryMapping[industry.toLowerCase()] || 'services';
}

/**
 * Infer business model from business type
 */
export function inferBusinessModelFromType(businessType: string): BusinessModel | string {
  const typeMapping: Record<string, BusinessModel> = {
    'sole-trader': 'services',
    'company': 'services',
    'partnership': 'services',
    'llc': 'services',
    'corporation': 'services',
  };
  
  return typeMapping[businessType.toLowerCase()] || 'services';
}

/**
 * Validate year is reasonable
 */
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
}

/**
 * Validate business model against valid enum values
 */
export function validateBusinessModel(value: string): BusinessModel | string {
  const validBusinessModels = ['b2b_saas', 'b2c', 'marketplace', 'ecommerce', 'manufacturing', 'services', 'other'];
  return validBusinessModels.includes(String(value)) ? value : 'services';
}

/**
 * Validate founding year is within reasonable range
 */
export function validateFoundingYear(year: number): number {
  const currentYear = new Date().getFullYear();
  return (year >= 1900 && year <= currentYear) ? year : currentYear - 5;
}

/**
 * Extract business model from user input text
 */
export function extractBusinessModelFromInput(input: string): string | null {
  const lowerInput = input.toLowerCase();
  
  // Business model keywords
  const businessModelKeywords = {
    'b2b_saas': ['saas', 'software as a service', 'b2b', 'enterprise software', 'subscription software'],
    'b2c': ['b2c', 'consumer', 'retail', 'direct to consumer', 'customer'],
    'marketplace': ['marketplace', 'platform', 'two-sided', 'multi-sided'],
    'ecommerce': ['ecommerce', 'e-commerce', 'online store', 'online shop', 'digital store'],
    'manufacturing': ['manufacturing', 'production', 'factory', 'assembly'],
    'services': ['services', 'consulting', 'professional services', 'service business']
  };
  
  for (const [model, keywords] of Object.entries(businessModelKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      return model;
    }
  }
  
  return null;
}

/**
 * Extract founding year from user input text
 */
export function extractFoundingYearFromInput(input: string): number | null {
  // Look for year patterns (4 digits)
  const yearMatch = input.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    return isValidYear(year) ? year : null;
  }
  
  // Look for "founded in", "started in", "established in" patterns
  const foundedMatch = input.match(/(?:founded|started|established)\s+(?:in\s+)?(\d{4})/i);
  if (foundedMatch) {
    const year = parseInt(foundedMatch[1]);
    return isValidYear(year) ? year : null;
  }
  
  return null;
}
