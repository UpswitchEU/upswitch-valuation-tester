/**
 * New Report Detector Utility
 *
 * Single Responsibility: Detect if a report is NEW (never seen before)
 * Provides fast detection by checking all caches and stores
 *
 * @module utils/newReportDetector
 */

import { useValuationSessionStore } from '../store/useValuationSessionStore'
import { createContextLogger } from './logger'
import { checkReportExists } from './reportExistenceCache'
import { globalSessionCache } from './sessionCacheManager'

const detectorLogger = createContextLogger('NewReportDetector')

/**
 * Check if a report is NEW (never seen before)
 *
 * A report is considered NEW if:
 * - Not in existence cache (or existence cache is null/unknown)
 * - Not in session cache
 * - Not in Zustand store
 *
 * A report is NOT NEW if:
 * - Exists in existence cache (true or false - both mean it was checked)
 * - Exists in session cache
 * - Exists in Zustand store
 *
 * @param reportId - Report identifier
 * @returns true if report is NEW, false if report exists in any cache/store
 *
 * @example
 * ```typescript
 * if (isNewReport(reportId)) {
 *   // Fast path: Create optimistically
 *   const session = createSessionOptimistically(reportId, 'manual', query)
 * } else {
 *   // Normal path: Load from cache/backend
 *   await loadSession(reportId)
 * }
 * ```
 */
export function isNewReport(reportId: string): boolean {
  try {
    // Check existence cache first (fastest check)
    const exists = checkReportExists(reportId)
    
    // If existence cache has any value (true or false), report was checked before
    // Only null means "unknown" - which could be NEW
    if (exists !== null) {
      detectorLogger.debug('Report exists in existence cache', {
        reportId,
        exists,
      })
      return false // Not new - was checked before
    }

    // Check session cache
    const cachedSession = globalSessionCache.get(reportId)
    if (cachedSession) {
      detectorLogger.debug('Report exists in session cache', {
        reportId,
        cachedAt: cachedSession.updatedAt,
      })
      return false // Not new - has cached session
    }

    // Check Zustand store (current session)
    const { session } = useValuationSessionStore.getState()
    if (session?.reportId === reportId) {
      detectorLogger.debug('Report exists in Zustand store', {
        reportId,
        currentView: session.currentView,
      })
      return false // Not new - already in store
    }

    // All checks passed - this is a NEW report
    detectorLogger.info('Report detected as NEW', { reportId })
    return true
  } catch (error) {
    // On error, assume NOT new (safer to use normal path)
    detectorLogger.error('Error checking if report is new', {
      reportId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

/**
 * Mark report as checked (not new)
 *
 * This is called after creating a session optimistically to prevent
 * future checks from treating it as new.
 *
 * @param reportId - Report identifier
 */
export function markReportAsChecked(reportId: string): void {
  // This is handled by markReportExists() in reportExistenceCache
  // No need for separate function, but kept for API consistency
  detectorLogger.debug('Report marked as checked', { reportId })
}

