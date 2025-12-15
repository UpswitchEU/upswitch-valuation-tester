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
import { createContextLogger } from './logger'
import { markReportExists } from './reportExistenceCache'
import { globalSessionCache } from './sessionCacheManager'
import { is409Conflict } from './errorDetection'
import { retryWithBackoff } from './retryWithBackoff'
import { isRetryable } from './errors/errorGuards'

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
 * Tracks in-progress syncs to prevent duplicate syncs
 */
const syncInProgress = new Set<string>()

/**
 * Syncs optimistically created session to backend (non-blocking)
 *
 * BACKGROUND SYNC:
 * - Non-blocking (doesn't await)
 * - Handles 409 conflicts (session already exists - load it)
 * - Updates cache with backend response
 * - Prevents duplicate syncs
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

  // Prevent duplicate syncs
  if (syncInProgress.has(reportId)) {
    sessionHelpersLogger.debug('Sync already in progress, skipping', { reportId })
    return
  }

  syncInProgress.add(reportId)

  // Update sync status to 'syncing'
  useValuationSessionStore.getState().setBackgroundSyncStatus('syncing')

  // Sync in background (non-blocking) with retry logic
  Promise.resolve()
    .then(async () => {
      try {
        sessionHelpersLogger.info('Starting background sync', { reportId })

        // Retry sync with exponential backoff for transient errors
        await retryWithBackoff(
          async () => {
            return await backendAPI.createValuationSession(session)
          },
          {
            maxRetries: 3,
            initialDelay: 200, // Start with 200ms delay
            maxDelay: 2000, // Max 2s delay
            backoffMultiplier: 2,
            onRetry: (attempt, error, delay) => {
              sessionHelpersLogger.warn('Retrying background sync', {
                reportId,
                attempt,
                delay_ms: delay,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            },
            onFailure: (error, attempts) => {
              sessionHelpersLogger.error('Background sync failed after all retries', {
                reportId,
                attempts,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            },
          }
        )

        sessionHelpersLogger.info('Background sync completed successfully', {
          reportId,
          sessionId: session.sessionId,
        })

        // Update sync status to 'synced'
        useValuationSessionStore.getState().setBackgroundSyncStatus('synced')

        // Success - cache already updated by createSessionOptimistically
        // Backend may have additional fields, but we keep local version for now
      } catch (error) {
        // Handle 409 conflicts (not retryable - session already exists)
        if (is409Conflict(error)) {
          // Session already exists - load from backend
          sessionHelpersLogger.info('409 conflict during sync, loading existing session', {
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
              const backendSession = normalizeSessionDates(backendSessionResponse.session)

              // Update cache with backend version
              globalSessionCache.set(reportId, backendSession)

              // Update Zustand store with backend version
              // Note: We can't directly set session from here, but the session will be updated
              // when the store's initializeSession or loadSession is called
              // For now, we update the cache and the store will pick it up on next access

              sessionHelpersLogger.info('Loaded existing session from backend after 409', {
                reportId,
                currentView: backendSession.currentView,
              })

              // Update sync status to 'synced' (we successfully loaded the session)
              useValuationSessionStore.getState().setBackgroundSyncStatus('synced')
            }
          } catch (loadError) {
            sessionHelpersLogger.error('Failed to load existing session after 409', {
              reportId,
              error: loadError instanceof Error ? loadError.message : 'Unknown error',
            })
            // Keep optimistic session - it still works locally
            // Update sync status to 'failed'
            useValuationSessionStore.getState().setBackgroundSyncStatus('failed')
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
          sessionHelpersLogger.warn('Background sync failed (non-retryable), session still works locally', {
            reportId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          // Session still works locally - user can retry later
          // Update sync status to 'failed'
          useValuationSessionStore.getState().setBackgroundSyncStatus('failed')
        }
      } finally {
        syncInProgress.delete(reportId)
      }
    })
    .catch((error) => {
      // Unexpected error in promise chain
      sessionHelpersLogger.error('Unexpected error in background sync', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      syncInProgress.delete(reportId)
    })
}
