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
 * - Unified Session Store (useSessionStore)
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
   * @param flow - Optional flow type ('manual' | 'conversational') for new session creation
   * @returns Session object or null if not found
   */
  async loadSession(reportId: string, flow?: 'manual' | 'conversational'): Promise<ValuationSession | null> {
    const startTime = performance.now()
    const ABSOLUTE_TIMEOUT = 12000 // 12 seconds max

    try {
      logger.info('Loading session', { reportId, flow })

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

      // Wrap the entire load operation with an absolute timeout
      const loadPromise = retrySessionOperation(
        async () => {
          return await sessionCircuitBreaker.execute(async () => {
            const sessionResponse = await backendAPI.getValuationSession(reportId)

            if (!sessionResponse?.session) {
              // Session doesn't exist - create it automatically
              logger.info('Session not found, creating new session', { reportId, flow })
              
              try {
                // Create minimal session on backend
                const createResponse = await backendAPI.createValuationSession({
                  reportId,
                  currentView: flow || 'manual', // Use provided flow or default to manual
                  sessionData: {},
                })
                
                if (!createResponse?.session) {
                  logger.error('Failed to create new session', { reportId })
              return null
                }
                
                logger.info('New session created successfully', {
                  reportId,
                  currentView: createResponse.session.currentView,
                })
                
                // Validate and normalize the new session
                validateSessionData(createResponse.session)
                const normalizedSession = normalizeSessionDates(createResponse.session)
                const mergedSession = mergeSessionFields(normalizedSession)
                
                // Cache the new session
                globalSessionCache.set(reportId, mergedSession)
                
                return mergedSession
              } catch (createError) {
                logger.error('Error creating new session', {
                  reportId,
                  error: createError instanceof Error ? createError.message : String(createError),
                })
                return null
              }
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

      // Create timeout promise that rejects after ABSOLUTE_TIMEOUT
      let timeoutId: NodeJS.Timeout | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const elapsed = performance.now() - startTime
          logger.error('Session load exceeded absolute timeout', {
            reportId,
            elapsedMs: elapsed,
            timeoutMs: ABSOLUTE_TIMEOUT,
          })
          reject(
            new ApplicationError('Session load exceeded absolute timeout', 'SESSION_LOAD_TIMEOUT', {
              reportId,
              elapsedMs: elapsed,
              timeoutMs: ABSOLUTE_TIMEOUT,
            })
          )
        }, ABSOLUTE_TIMEOUT)
      })

      // Race between load and timeout
      let session: ValuationSession | null
      try {
        session = await Promise.race([loadPromise, timeoutPromise])
      } finally {
        // Clean up timeout to prevent memory leak
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }
      }

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
        
        // Retry loading with exponential backoff + jitter (backend may need time to persist)
        let reloadedSession: ValuationSession | null = null
        const maxRetries = 5
        const initialDelay = 200
        const maxDelay = 2000
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          if (attempt > 0) {
            // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 2000ms (capped)
            const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)
            // Add jitter (±20%) to prevent thundering herd
            const jitter = delay * 0.2 * (Math.random() - 0.5)
            const finalDelay = Math.max(0, delay + jitter)
            
            logger.debug(`Waiting ${finalDelay.toFixed(0)}ms before retry attempt ${attempt + 1}`, { 
              reportId,
              baseDelay: delay,
              jitter: jitter.toFixed(0)
            })
            
            await new Promise(resolve => setTimeout(resolve, finalDelay))
          }
          
          reloadedSession = await this.loadSession(reportId)
          if (reloadedSession) {
            logger.info('Session reloaded successfully after save', { 
              reportId, 
              attempt: attempt + 1,
              totalRetries: maxRetries
            })
            break
          }
          
          logger.debug(`Reload attempt ${attempt + 1}/${maxRetries} failed, retrying...`, { reportId })
        }
        
        if (!reloadedSession) {
          // If reload still fails, create a minimal session object from what we saved
          // This prevents errors and allows the UI to continue
          logger.warn('Failed to reload session after save, creating minimal session object', { 
            reportId,
            retriesAttempted: maxRetries
          })
          mergedSession = {
            reportId,
            currentView: (currentView as 'manual' | 'conversational') || 'manual',
            dataSource: (currentView === 'conversational' ? 'conversational' : 'manual') as 'manual' | 'conversational' | 'mixed',
            sessionData: sessionData || {},
            partialData: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            // ✅ ADD: Fields required by flow components (graceful degradation)
            valuationResult: undefined, // Not calculated yet (undefined to match type)
            htmlContent: undefined, // Not generated yet (undefined to match type)
            isComplete: false, // Session just created
            stage: 1, // Data entry stage
            status: 'draft', // Draft status
          } as unknown as ValuationSession
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

