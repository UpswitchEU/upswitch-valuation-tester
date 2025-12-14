/**
 * URL Generator Service
 * Centralized URL generation following Ilara Mercury pattern
 * 
 * Single Responsibility: Generate all application URLs consistently
 * SOLID Compliance: SRP - Only responsible for URL generation
 * 
 * Usage:
 *   import UrlGeneratorService from '@/services/urlGenerator'
 *   router.push(UrlGeneratorService.reportById(reportId, { flow: 'manual' }))
 */
class UrlGeneratorService {
  static root = () => '/'
  static home = () => '/home'

  // Valuation Reports Routes with unique keys
  static reports = () => '/reports'
  
  /**
   * Generate report URL with optional query parameters
   * @param reportId - Report ID (e.g., 'val_1234567890_abc123')
   * @param queryParams - Optional query parameters (e.g., { flow: 'manual', prefilledQuery: 'SaaS' })
   * @returns Full URL with query string (e.g., '/reports/val_1234567890_abc123?flow=manual&prefilledQuery=SaaS')
   */
  static reportById = (reportId: string, queryParams?: Record<string, string | boolean | null | undefined>) => {
    const baseUrl = `/reports/${reportId}`
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl
    }
    
    const params = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value))
      }
    })
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }
  
  static createNewReport = () => '/reports/new'

  // Legacy routes for backward compatibility (will redirect)
  static legacyManual = () => '/manual'
  static legacyAIGuided = () => '/ai-guided'
  static legacyInstant = () => '/instant'

  // Info pages
  static privacy = () => '/privacy'
  static about = () => '/about'
  static howItWorks = () => '/how-it-works'

  // Error pages
  static notFound = () => '/404'
}

export default UrlGeneratorService
