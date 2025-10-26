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
    'saas': BusinessModel.B2B_SAAS,
    'software': BusinessModel.B2B_SAAS,
    'b2b': BusinessModel.B2B_SAAS,
    'consumer': BusinessModel.B2C,
    'retail': BusinessModel.B2C,
    'platform': BusinessModel.MARKETPLACE,
    'ecommerce': BusinessModel.ECOMMERCE,
    'e-commerce': BusinessModel.ECOMMERCE,
    'manufacturing': BusinessModel.MANUFACTURING,
    'services': BusinessModel.SERVICES,
    'consulting': BusinessModel.SERVICES,
    'professional': BusinessModel.SERVICES,
  };
  
  return mapping[value.toLowerCase()] || value;
}

/**
 * Infer business model from industry
 */
export function inferBusinessModelFromIndustry(industry: string): BusinessModel | string {
  const industryMapping: Record<string, BusinessModel> = {
    'technology': BusinessModel.B2B_SAAS,
    'software': BusinessModel.B2B_SAAS,
    'retail': BusinessModel.B2C,
    'ecommerce': BusinessModel.ECOMMERCE,
    'manufacturing': BusinessModel.MANUFACTURING,
    'services': BusinessModel.SERVICES,
    'healthcare': BusinessModel.SERVICES,
    'finance': BusinessModel.SERVICES,
    'real_estate': BusinessModel.SERVICES,
    'hospitality': BusinessModel.SERVICES,
    'construction': BusinessModel.SERVICES,
  };
  
  return industryMapping[industry.toLowerCase()] || BusinessModel.SERVICES;
}

/**
 * Infer business model from business type
 */
export function inferBusinessModelFromType(businessType: string): BusinessModel | string {
  const typeMapping: Record<string, BusinessModel> = {
    'sole-trader': BusinessModel.SERVICES,
    'company': BusinessModel.SERVICES,
    'partnership': BusinessModel.SERVICES,
    'llc': BusinessModel.SERVICES,
    'corporation': BusinessModel.SERVICES,
  };
  
  return typeMapping[businessType.toLowerCase()] || BusinessModel.SERVICES;
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
  const validBusinessModels = [BusinessModel.B2B_SAAS, BusinessModel.B2C, BusinessModel.MARKETPLACE, BusinessModel.ECOMMERCE, BusinessModel.MANUFACTURING, BusinessModel.SERVICES, BusinessModel.OTHER];
  return validBusinessModels.includes(value as BusinessModel) ? value : BusinessModel.SERVICES;
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
    [BusinessModel.B2B_SAAS]: ['saas', 'software as a service', 'b2b', 'enterprise software', 'subscription software'],
    [BusinessModel.B2C]: ['b2c', 'consumer', 'retail', 'direct to consumer', 'customer'],
    [BusinessModel.MARKETPLACE]: ['marketplace', 'platform', 'two-sided', 'multi-sided'],
    [BusinessModel.ECOMMERCE]: ['ecommerce', 'e-commerce', 'online store', 'online shop', 'digital store'],
    [BusinessModel.MANUFACTURING]: ['manufacturing', 'production', 'factory', 'assembly'],
    [BusinessModel.SERVICES]: ['services', 'consulting', 'professional services', 'service business']
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
