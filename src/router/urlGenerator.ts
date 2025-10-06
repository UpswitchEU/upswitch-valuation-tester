/**
 * URL Generator Utility
 * 
 * Type-safe URL generation for navigation throughout the app.
 * Provides helper functions to generate URLs with parameters.
 */

import { ROUTES } from './routes';

/**
 * Generate a URL from a route pattern and parameters
 */
function generateUrl(pattern: string, params?: Record<string, string | number>): string {
  let url = pattern;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
    
    // Remove optional parameters that weren't provided
    url = url.replace(/\/:[^/]+\?/g, '');
  }
  
  return url;
}

/**
 * URL Generator class with type-safe methods
 */
export class UrlGenerator {
  /**
   * Home page
   */
  static home(): string {
    return ROUTES.HOME;
  }

  /**
   * Instant valuation (AI-assisted)
   */
  static instantValuation(): string {
    return ROUTES.INSTANT_VALUATION;
  }

  /**
   * Manual valuation entry
   */
  static manualValuation(): string {
    return ROUTES.MANUAL_VALUATION;
  }

  /**
   * Document upload
   */
  static documentUpload(): string {
    return ROUTES.DOCUMENT_UPLOAD;
  }

  /**
   * Valuation results
   * @param valuationId Optional valuation ID
   */
  static results(valuationId?: string): string {
    if (valuationId) {
      return generateUrl(ROUTES.RESULTS, { valuationId });
    }
    return '/results';
  }

  /**
   * Privacy policy
   */
  static privacy(): string {
    return ROUTES.PRIVACY;
  }

  /**
   * About page
   */
  static about(): string {
    return ROUTES.ABOUT;
  }

  /**
   * How it works page
   */
  static howItWorks(): string {
    return ROUTES.HOW_IT_WORKS;
  }

  /**
   * 404 Not Found
   */
  static notFound(): string {
    return ROUTES.NOT_FOUND;
  }

  /**
   * Generate URL with query parameters
   */
  static withQuery(baseUrl: string, params: Record<string, string | number | boolean>): string {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Parse query parameters from URL
   */
  static parseQuery(search: string): Record<string, string> {
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    
    params.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }

  /**
   * Generate shareable valuation URL
   */
  static shareValuation(valuationId: string, options?: {
    format?: 'pdf' | 'json' | 'html';
    token?: string;
  }): string {
    const baseUrl = this.results(valuationId);
    if (options) {
      return this.withQuery(baseUrl, options as Record<string, string>);
    }
    return baseUrl;
  }

  /**
   * Generate valuation method URL with pre-filled data
   */
  static valuationWithData(method: 'instant' | 'manual' | 'upload', data?: {
    companyName?: string;
    industry?: string;
    country?: string;
  }): string {
    const baseUrl = method === 'instant' ? this.instantValuation() :
                    method === 'manual' ? this.manualValuation() :
                    this.documentUpload();
    
    if (data) {
      return this.withQuery(baseUrl, data as Record<string, string>);
    }
    return baseUrl;
  }
}

/**
 * Export singleton instance
 */
export const urls = UrlGenerator;

/**
 * Export helper for external link checking
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

/**
 * Export helper for active route checking
 */
export function isActiveRoute(currentPath: string, routePath: string, exact: boolean = false): boolean {
  if (exact) {
    return currentPath === routePath;
  }
  return currentPath.startsWith(routePath);
}
