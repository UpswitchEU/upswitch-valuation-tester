/**
 * Legacy Registry Service - DEPRECATED
 * 
 * This file is kept for backward compatibility but should be replaced
 * with the new unified RegistryService from ./registry/registryService.ts
 * 
 * @deprecated Use registryService from './registry/registryService' instead
 */

import { registryService } from './registry/registryService';
import type { 
  CompanySearchResult, 
  CompanyFinancialData, 
  SearchSuggestion 
} from './registry/types';

// Re-export types for backward compatibility
export type { CompanySearchResult, CompanyFinancialData, SearchSuggestion };

/**
 * @deprecated Use registryService.searchCompanies() instead
 */
export const searchCompanies = async (
  companyName: string, 
  countryCode: string
): Promise<CompanySearchResult[]> => {
  const response = await registryService.searchCompanies(companyName, countryCode);
  return response.results;
};

/**
 * @deprecated Use registryService.getCompanyFinancials() instead
 */
export const fetchCompanyFinancials = async (
  companyId: string,
  countryCode: string
): Promise<CompanyFinancialData> => {
  return registryService.getCompanyFinancials(companyId, countryCode);
};

/**
 * @deprecated Use registryService.getSearchSuggestions() instead
 */
export const getSearchSuggestions = async (query: string, country?: string): Promise<{ suggestions: SearchSuggestion[] }> => {
  return registryService.getSearchSuggestions(query, country);
};