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

import {
    ApplicationError,
    NetworkError,
    NotFoundError,
    ValidationError,
} from '../../types/errors'
import type { ValuationRequest, ValuationSession } from '../../types/valuation'
import { sessionCircuitBreaker } from '../../utils/circuitBreaker'
import { getErrorMessage } from '../../utils/errors/errorConverter'
import { createContextLogger } from '../../utils/logger'
import { retrySessionOperation } from '../../utils/retryWithBackoff'
import { globalSessionCache } from '../../utils/sessionCacheManager'
import { mergeSessionFields, normalizeSessionDates } from '../../utils/sessionHelpers'
import { validateSessionData } from '../../utils/sessionValidation'
import { backendAPI } from '../backendApi'

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

      if (session) {
        logger.info('Session loaded successfully', {
          reportId,
          duration_ms: duration.toFixed(2),
          fromCache: false,
        })
      } else {
        logger.debug('Session not found (404)', {
          reportId,
          duration_ms: duration.toFixed(2),
        })
      }

      return session
    } catch (error) {
      const duration = performance.now() - startTime

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.info('Session not found - returning null', {
          reportId,
          resourceType: error.resourceType,
          duration_ms: duration.toFixed(2),
        })
        return null // Not found is expected, return null
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to load session - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        return null // Return null for retryable network errors
      } else if (error instanceof ValidationError) {
        logger.error('Failed to load session - validation error', {
          error: error.message,
          field: error.field,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        return null
      } else {
        logger.error('Failed to load session - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
        return null
      }
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

      // Convert ValuationRequest updates to sessionData format for backend
      // Backend expects sessionData structure, not raw ValuationRequest
      // Extract currentView if present (needed for session creation)
      const updatesAny = updates as any
      
      // Extract currentView separately (it's a top-level session property, not part of sessionData)
      const currentView = updatesAny.currentView
      
      // sessionData should contain the actual form data (everything except currentView)
      const { currentView: _, ...sessionDataWithoutView } = updatesAny
      const sessionData = updatesAny.sessionData || sessionDataWithoutView
      
      const sessionUpdates: Partial<ValuationSession> = {
        sessionData: sessionData as any,
        ...(currentView && { currentView }),
      }

      // Update backend
      const response = await backendAPI.updateValuationSession(reportId, sessionUpdates)

      let mergedSession: ValuationSession

      if (response?.session) {
        // Backend returned session data - use it
        const normalizedSession = normalizeSessionDates(response.session)
        mergedSession = mergeSessionFields(normalizedSession)
      } else {
        // Backend didn't return session data (common when creating new session)
        // Clear cache and reload with retry (backend may need a moment to persist)
        logger.debug('Backend did not return session data, reloading session', { reportId })
        
        // Clear cache to ensure fresh data
        globalSessionCache.remove(reportId)
        
        // Retry loading with exponential backoff (backend may need time to persist)
        let reloadedSession: ValuationSession | null = null
        const maxRetries = 3
        const initialDelay = 100
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          if (attempt > 0) {
            const delay = initialDelay * Math.pow(2, attempt - 1)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          reloadedSession = await this.loadSession(reportId)
          if (reloadedSession) {
            break
          }
          
          logger.debug(`Reload attempt ${attempt + 1} failed, retrying...`, { reportId })
        }
        
        if (!reloadedSession) {
          // If reload still fails, create a minimal session object from what we saved
          // This prevents errors and allows the UI to continue
          logger.warn('Failed to reload session after save, creating minimal session object', { reportId })
          mergedSession = {
            sessionId: reportId,
            reportId,
            currentView: (currentView as 'manual' | 'conversational') || 'manual',
            dataSource: (currentView === 'conversational' ? 'conversational' : 'manual') as 'manual' | 'conversational' | 'mixed',
            sessionData: sessionData || {},
            partialData: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        } else {
          mergedSession = reloadedSession
        }
      }

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

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to save session - validation error', {
          error: error.message,
          field: error.field,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error // Re-throw for caller to handle
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to save session - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error // Re-throw for potential retry
      } else if (error instanceof NotFoundError) {
        logger.error('Failed to save session - resource not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to save session - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to save session: ${getErrorMessage(error)}`,
          'SESSION_SAVE_FAILED',
          {
            originalError: error,
            reportId,
            updateKeys: Object.keys(updates),
            duration_ms: duration.toFixed(2),
          }
        )
      }
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
        // Convert ValuationRequest to sessionData format
        const sessionUpdates: Partial<ValuationSession> = {
          sessionData: sessionUpdate as any,
        }
        await backendAPI.updateValuationSession(reportId, sessionUpdates)
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

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to save complete session - validation error', {
          error: error.message,
          field: error.field,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to save complete session - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to save complete session - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to save complete session: ${getErrorMessage(error)}`,
          'SESSION_SAVE_COMPLETE_FAILED',
          {
            originalError: error,
            reportId,
            duration_ms: duration.toFixed(2),
          }
        )
      }
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

