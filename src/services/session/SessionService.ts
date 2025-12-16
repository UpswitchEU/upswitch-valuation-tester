/**
 * Session Service
 *
 * Shared service for session management across Manual and Conversational flows.
 * Provides a single, consistent API for session operations.
 *
 * Key Features:
 * - Load sessions from backend or cache
 * - Save/update sessions atomically
 * - Cache management (globalSessionCache integration)
 * - Session field merging (SINGLE SOURCE OF TRUTH)
 * - Error handling and retry logic
 *
 * Used by:
 * - Manual Flow (useManualSessionStore)
 * - Conversational Flow (useConversationalSessionStore)
 *
 * @module services/session/SessionService
 */

import { backendAPI } from '../backendApi'
import type { ValuationSession, ValuationRequest } from '../../types/valuation'
import { globalSessionCache } from '../../utils/sessionCacheManager'
import { mergeSessionFields, normalizeSessionDates } from '../../utils/sessionHelpers'
import { hasMeaningfulSessionData } from '../../utils/sessionDataUtils'
import { createContextLogger } from '../../utils/logger'
import { retrySessionOperation } from '../../utils/retryWithBackoff'
import { sessionCircuitBreaker } from '../../utils/circuitBreaker'
import { validateSessionData } from '../../utils/sessionValidation'
import { convertToApplicationError, getErrorMessage } from '../../utils/errors/errorConverter'

const logger = createContextLogger('SessionService')

/**
 * SessionService - Shared session management
 *
 * Singleton service for consistent session operations across all flows.
 */
export class SessionService {
  private static instance: SessionService

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService()
    }
    return SessionService.instance
  }

  /**
   * Load session from cache or backend
   *
   * CACHE-FIRST STRATEGY:
   * 1. Check globalSessionCache
   * 2. If cache hit, return immediately
   * 3. If cache miss, load from backend
   * 4. Merge top-level fields into sessionData
   * 5. Cache for next time
   *
   * @param reportId - Report identifier
   * @returns Session object or null if not found
   */
  async loadSession(reportId: string): Promise<ValuationSession | null> {
    const startTime = performance.now()

    try {
      logger.info('Loading session', { reportId })

      // CACHE-FIRST: Check localStorage cache BEFORE backend API call
      const cachedSession = globalSessionCache.get(reportId)
      if (cachedSession) {
        const loadTime = performance.now() - startTime

        logger.info('Session loaded from cache', {
          reportId,
          loadTime_ms: loadTime.toFixed(2),
          cacheAge_minutes: cachedSession.updatedAt
            ? Math.floor((Date.now() - new Date(cachedSession.updatedAt).getTime()) / (60 * 1000))
            : null,
        })

        // Validate cached session
        validateSessionData(cachedSession)

        return cachedSession
      }

      logger.debug('Cache miss - loading from backend', { reportId })

      // Load from backend with retry logic
      const session = await retrySessionOperation(
        async () => {
          return await sessionCircuitBreaker.execute(async () => {
            const sessionResponse = await backendAPI.getValuationSession(reportId)

            if (!sessionResponse?.session) {
              return null
            }

            // Validate session data
            validateSessionData(sessionResponse.session)

            // Normalize dates
            const normalizedSession = normalizeSessionDates(sessionResponse.session)

            // Merge top-level fields into sessionData (SINGLE SOURCE OF TRUTH)
            const mergedSession = mergeSessionFields(normalizedSession)

            // Cache for next time
            globalSessionCache.set(reportId, mergedSession)

            logger.info('Session loaded from backend and cached', {
              reportId,
              currentView: mergedSession.currentView,
            })

            return mergedSession
          })
        },
        {
          onRetry: (attempt, error, delay) => {
            logger.warn('Retrying session load', {
              reportId,
              attempt,
              delay_ms: delay,
              error: error instanceof Error ? error.message : String(error),
            })
          },
        }
      )

      const duration = performance.now() - startTime

      logger.info('Session loaded successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
        fromCache: false,
      })

      return session
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to load session', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      // Return null instead of throwing - let caller decide how to handle
      return null
    }
  }

  /**
   * Save session to backend
   *
   * ATOMIC SAVE:
   * 1. Update backend via API
   * 2. Update cache with latest data
   * 3. Return updated session
   *
   * @param reportId - Report identifier
   * @param updates - Partial session data to update
   * @returns Updated session object
   */
  async saveSession(
    reportId: string,
    updates: Partial<ValuationRequest>
  ): Promise<ValuationSession> {
    const startTime = performance.now()

    try {
      logger.info('Saving session', {
        reportId,
        updateKeys: Object.keys(updates),
      })

      // Update backend
      const response = await backendAPI.updateValuationSession(reportId, updates)

      if (!response?.session) {
        throw new Error('Backend returned empty session data')
      }

      // Normalize and merge
      const normalizedSession = normalizeSessionDates(response.session)
      const mergedSession = mergeSessionFields(normalizedSession)

      // Update cache
      globalSessionCache.set(reportId, mergedSession)

      const duration = performance.now() - startTime

      logger.info('Session saved successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })

      return mergedSession
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, updates })

      logger.error('Failed to save session', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }

  /**
   * Save complete session with all assets
   *
   * Saves:
   * - Form data (all input fields)
   * - Valuation results
   * - HTML reports (main + info tab)
   *
   * @param reportId - Report identifier
   * @param data - Complete session data
   */
  async saveCompleteSession(
    reportId: string,
    data: {
      formData?: any
      valuationResult?: any
      htmlReport?: string
      infoTabHtml?: string
    }
  ): Promise<void> {
    const startTime = performance.now()

    try {
      logger.info('Saving complete session', {
        reportId,
        hasFormData: !!data.formData,
        hasResult: !!data.valuationResult,
        hasHtmlReport: !!data.htmlReport,
        hasInfoTab: !!data.infoTabHtml,
      })

      // Import SessionAPI dynamically to avoid circular dependencies
      const { SessionAPI } = await import('../api/session/SessionAPI')
      const sessionAPI = new SessionAPI()

      // Prepare session data update
      const sessionUpdate: Partial<ValuationRequest> = {}

      // Merge form data if provided
      if (data.formData) {
        Object.assign(sessionUpdate, {
          company_name: data.formData.company_name,
          country_code: data.formData.country_code,
          industry: data.formData.industry,
          business_model: data.formData.business_model,
          founding_year: data.formData.founding_year,
          current_year_data: data.formData.current_year_data,
          historical_years_data: data.formData.historical_years_data,
          number_of_employees: data.formData.number_of_employees,
          number_of_owners: data.formData.number_of_owners,
          recurring_revenue_percentage: data.formData.recurring_revenue_percentage,
          shares_for_sale: data.formData.shares_for_sale,
          business_type_id: data.formData.business_type_id,
          business_context: data.formData.business_context,
          comparables: data.formData.comparables,
        })
      }

      // Update session data first
      if (Object.keys(sessionUpdate).length > 0) {
        await backendAPI.updateValuationSession(reportId, sessionUpdate)
        logger.debug('Session data updated', { reportId })
      }

      // Save valuation result and HTML reports
      if (data.valuationResult || data.htmlReport || data.infoTabHtml) {
        await sessionAPI.saveValuationResult(reportId, {
          valuationResult: data.valuationResult,
          htmlReport: data.htmlReport,
          infoTabHtml: data.infoTabHtml,
        })

        logger.info('Valuation result saved', {
          reportId,
          hasHtmlReport: !!data.htmlReport,
          hasInfoTab: !!data.infoTabHtml,
        })
      }

      // Invalidate cache - force reload on next access
      globalSessionCache.remove(reportId)

      const duration = performance.now() - startTime

      logger.info('Complete session saved successfully', {
        reportId,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to save complete session', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }

  /**
   * Clear session from cache
   *
   * @param reportId - Report identifier
   */
  clearSessionCache(reportId: string): void {
    globalSessionCache.remove(reportId)
    logger.debug('Session cache cleared', { reportId })
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance()

