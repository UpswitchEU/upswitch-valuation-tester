/**
 * Session Helper Utilities
 *
 * Single Responsibility: Session ID generation and base session object creation.
 * Pure functions for creating consistent session structures.
 *
 * @module utils/sessionHelpers
 */

import { backendAPI } from '../services/backendApi'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import type { ValuationSession } from '../types/valuation'
import { is409Conflict } from './errorDetection'
import { isRetryable } from './errors/errorGuards'
import { createContextLogger } from './logger'
import { markReportExists } from './reportExistenceCache'
import { retryWithBackoff } from './retryWithBackoff'
import { globalSessionCache } from './sessionCacheManager'

const sessionHelpersLogger = createContextLogger('SessionHelpers')

/**
 * Generates a unique session ID
 *
 * Format: session_{timestamp}_{random_string}
 * Example: session_1765751208459_v8q7owfvtv
 *
 * @returns Unique session identifier
 *
 * @example
 * ```typescript
 * const sessionId = generateSessionId()
 * console.log(sessionId) // "session_1765751208459_v8q7owfvtv"
 * ```
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Creates a base ValuationSession object with default values
 *
 * Single source of truth for session structure.
 * Ensures consistency across session creation points.
 *
 * @param reportId - Unique report identifier
 * @param sessionId - Unique session identifier
 * @param currentView - Current flow view (manual or conversational)
 * @param prefilledQuery - Optional prefilled query from homepage
 * @returns Base ValuationSession object
 *
 * @example
 * ```typescript
 * const session = createBaseSession(
 *   'val_123',
 *   generateSessionId(),
 *   'conversational',
 *   'Restaurant'
 * )
 * ```
 */
export function createBaseSession(
  reportId: string,
  sessionId: string,
  currentView: 'manual' | 'conversational',
  prefilledQuery?: string | null
): ValuationSession {
  return {
    sessionId,
    reportId,
    currentView,
    dataSource: currentView,
    createdAt: new Date(),
    updatedAt: new Date(),
    partialData: prefilledQuery ? ({ _prefilledQuery: prefilledQuery } as any) : {},
    sessionData: {},
  }
}

/**
 * Merges prefilled query into existing partial data
 *
 * Only adds prefilled query if:
 * 1. prefilledQuery is provided
 * 2. partialData doesn't already have _prefilledQuery
 *
 * @param partialData - Existing partial data
 * @param prefilledQuery - Query to merge
 * @returns Updated partial data
 */
export function mergePrefilledQuery(partialData: any, prefilledQuery?: string | null): any {
  if (!prefilledQuery) return partialData

  const updated = { ...partialData }
  if (!updated._prefilledQuery) {
    updated._prefilledQuery = prefilledQuery
  }

  return updated
}

/**
 * Normalizes session dates from backend (strings to Date objects)
 *
 * @param session - Session from backend with string dates
 * @returns Session with Date objects
 */
export function normalizeSessionDates(session: any): ValuationSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
  }
}

/**
 * Creates a session optimistically (locally without backend calls)
 *
 * FAST PATH for NEW reports:
 * - Creates session locally using createBaseSession()
 * - Caches session immediately
 * - Marks report as existing
 * - Returns synchronously (<50ms)
 *
 * This allows instant UI rendering while backend sync happens in background.
 *
 * @param reportId - Report identifier
 * @param currentView - Current flow view (manual or conversational)
 * @param prefilledQuery - Optional prefilled query from homepage
 * @returns Created session (local only, not synced to backend yet)
 *
 * @example
 * ```typescript
 * if (isNewReport(reportId)) {
 *   const session = createSessionOptimistically(reportId, 'manual', 'Restaurant')
 *   // UI ready instantly!
 *   syncSessionToBackend(session) // Sync in background
 * }
 * ```
 */
export function createSessionOptimistically(
  reportId: string,
  currentView: 'manual' | 'conversational',
  prefilledQuery?: string | null
): ValuationSession {
  const sessionId = generateSessionId()
  const session = createBaseSession(reportId, sessionId, currentView, prefilledQuery)

  // Cache immediately for instant retrieval
  globalSessionCache.set(reportId, session)

  // Mark as existing (so we don't check again)
  markReportExists(reportId)

  sessionHelpersLogger.info('Created session optimistically', {
    reportId,
    sessionId,
    currentView,
    hasPrefilledQuery: !!prefilledQuery,
  })

  return session
}

/**
 * Syncs optimistically created session to backend (non-blocking)
 *
 * BACKGROUND SYNC:
 * - Non-blocking (doesn't await)
 * - Handles 409 conflicts (session already exists - load it)
 * - Updates cache with backend response
 * - Prevents duplicate syncs via store state (atomic)
 * - Logs sync results
 *
 * This runs in the background after optimistic creation,
 * allowing UI to render instantly while sync completes.
 *
 * @param session - Session to sync to backend
 *
 * @example
 * ```typescript
 * const session = createSessionOptimistically(reportId, 'manual', query)
 * syncSessionToBackend(session) // Non-blocking
 * ```
 */
export function syncSessionToBackend(session: ValuationSession): void {
  const { reportId } = session
  const store = useValuationSessionStore.getState()

  // Background sync (no status tracking needed)

  // Sync in background (non-blocking) with retry logic
  Promise.resolve()
    .then(async () => {
      try {
        sessionHelpersLogger.debug('Starting background sync', { reportId })

        // CRITICAL: Try to create session, but handle 409 conflicts immediately (don't retry)
        try {
          await backendAPI.createValuationSession(session)
          sessionHelpersLogger.debug('Background sync completed successfully', {
            reportId,
            sessionId: session.sessionId,
          })
          // Success - cache already updated by createSessionOptimistically
          return // Exit early on success
        } catch (createError) {
          // CRITICAL: 409 conflicts are EXPECTED - session already exists, don't retry
          if (is409Conflict(createError)) {
            // Re-throw to outer catch block for 409 handling
            throw createError
          }
          
          // For other errors, retry with exponential backoff
        await retryWithBackoff(
          async () => {
            return await backendAPI.createValuationSession(session)
          },
          {
            maxRetries: 3,
              initialDelay: 200,
              maxDelay: 2000,
            backoffMultiplier: 2,
            onRetry: (attempt, error, delay) => {
                sessionHelpersLogger.debug('Retrying background sync', {
                reportId,
                attempt,
                delay_ms: delay,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            },
            onFailure: (error, attempts) => {
                sessionHelpersLogger.warn('Background sync failed after retries', {
                reportId,
                attempts,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            },
          }
        )

          sessionHelpersLogger.debug('Background sync completed successfully after retries', {
          reportId,
          sessionId: session.sessionId,
        })
        }
      } catch (error) {
        // Handle 409 conflicts (not retryable - session already exists)
        // CRITICAL: 409 conflicts are EXPECTED in background sync - handle silently
        if (is409Conflict(error)) {
          // Session already exists - load from backend (expected behavior, not an error)
          sessionHelpersLogger.debug('Session already exists (409), loading from backend', {
            reportId,
          })

          try {
            // Retry loading existing session (might be transient)
            const backendSessionResponse = await retryWithBackoff(
              async () => {
                return await backendAPI.getValuationSession(reportId)
              },
              {
                maxRetries: 2,
                initialDelay: 100,
                maxDelay: 1000,
                onRetry: (attempt, loadError) => {
                  sessionHelpersLogger.warn('Retrying load after 409', {
                    reportId,
                    attempt,
                    error: loadError instanceof Error ? loadError.message : 'Unknown error',
                  })
                },
              }
            )

            if (backendSessionResponse?.session) {
              const existingSession = backendSessionResponse.session

              // CRITICAL: Merge top-level fields (valuationResult, htmlReport, infoTabHtml) into sessionData
              // Backend stores these separately, but we need them in sessionData for consistent access
              const mergedSessionData = {
                ...(existingSession.sessionData || {}),
                ...(existingSession.valuationResult && { valuation_result: existingSession.valuationResult }),
                ...(existingSession.htmlReport && { html_report: existingSession.htmlReport }),
                ...(existingSession.infoTabHtml && { info_tab_html: existingSession.infoTabHtml }),
              }

              const backendSession = normalizeSessionDates({
                ...existingSession,
                sessionData: mergedSessionData,  // Use merged version
              })

              // Update cache with backend version
              globalSessionCache.set(reportId, backendSession)

              // CRITICAL FIX: Update Zustand store with backend version immediately
              // This ensures the store has the correct session data after 409 conflict resolution
              const store = useValuationSessionStore.getState()
              const currentSession = store.session
              
              // Only update if the reportId matches (prevents overwriting a different session)
              if (currentSession?.reportId === reportId) {
                useValuationSessionStore.setState({
                  session: backendSession,
                  syncError: null,
                })
                sessionHelpersLogger.debug('Updated store session after 409 conflict resolution', {
                  reportId,
                  currentView: backendSession.currentView,
                })

                // CRITICAL: Also restore HTML reports and valuation results from MERGED data
                // backendSession.sessionData already has merged top-level fields, but check both for safety
                const sessionData = backendSession.sessionData as any
                const valuationResult = sessionData?.valuation_result || backendSession.valuationResult
                const htmlReport = sessionData?.html_report || backendSession.htmlReport
                const infoTabHtml = sessionData?.info_tab_html || backendSession.infoTabHtml
                
                if (htmlReport || infoTabHtml || valuationResult) {
                  sessionHelpersLogger.info('Restoring HTML reports and valuation results after 409', {
                    reportId,
                    hasHtmlReport: !!htmlReport,
                    hasInfoTabHtml: !!infoTabHtml,
                    hasValuationResult: !!valuationResult,
                  })

                  // Import dynamically to avoid circular dependencies
                  import('../store/useValuationResultsStore').then(({ useValuationResultsStore }) => {
                    const resultsStore = useValuationResultsStore.getState()

                    // Store HTML reports
                    if (htmlReport) {
                      resultsStore.setHtmlReport(htmlReport)
                    }
                    if (infoTabHtml) {
                      resultsStore.setInfoTabHtml(infoTabHtml)
                    }

                    // Store valuation result (merge HTML reports if not in result)
                    if (valuationResult) {
                      const fullResult = {
                        ...valuationResult,
                        html_report: valuationResult.html_report || htmlReport,
                        info_tab_html: valuationResult.info_tab_html || infoTabHtml,
                      }
                      resultsStore.setResult(fullResult)
                    }

                    sessionHelpersLogger.debug('HTML reports and valuation results restored after 409', {
                      reportId,
                    })
                  }).catch((importError) => {
                    sessionHelpersLogger.error('Failed to import ValuationResultsStore after 409', {
                      reportId,
                      error: importError instanceof Error ? importError.message : String(importError),
                    })
                  })
                }
              } else {
                sessionHelpersLogger.debug('Skipping store update - reportId mismatch', {
                  reportId,
                  currentReportId: currentSession?.reportId,
                })
              }

              sessionHelpersLogger.debug('Loaded existing session from backend after 409', {
                reportId,
                currentView: backendSession.currentView,
              })

              // Successfully loaded existing session
            }
          } catch (loadError) {
            sessionHelpersLogger.error('Failed to load existing session after 409', {
              reportId,
              error: loadError instanceof Error ? loadError.message : 'Unknown error',
            })
            // Keep optimistic session - it still works locally
          }
        } else if (isRetryable(error)) {
          // Retryable error but retries exhausted - log warning
          sessionHelpersLogger.warn(
            'Background sync failed after retries, session still works locally',
            {
              reportId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          )
          // Session still works locally - user can retry later
        } else {
          // Non-retryable error - log but don't block UI
          sessionHelpersLogger.warn(
            'Background sync failed (non-retryable), session still works locally',
            {
              reportId,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          )
          // Session still works locally - user can retry later
        }
      }
    })
    .catch((error) => {
      // Unexpected error in promise chain
      sessionHelpersLogger.error('Unexpected error in background sync', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    })
}
