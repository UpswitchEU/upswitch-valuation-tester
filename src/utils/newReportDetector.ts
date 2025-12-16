/**
 * New Report Detector Utility
 *
 * Single Responsibility: Detect if a report is NEW (never seen before)
 * Provides fast detection by checking all caches and stores
 *
 * @module utils/newReportDetector
 */

import { useManualSessionStore } from '../store/manual'
import { useConversationalSessionStore } from '../store/conversational'
import { createContextLogger } from './logger'
import { checkReportExists } from './reportExistenceCache'

const detectorLogger = createContextLogger('NewReportDetector')

/**
 * Check if a report is NEW (never seen before)
 *
 * Simple Chain Architecture: Store is single source of truth
 *
 * A report is considered NEW if:
 * - Not in Zustand store (session?.reportId !== reportId)
 * - Not in existence cache (null means unknown/never checked)
 *
 * A report is NOT NEW if:
 * - Exists in Zustand store (session?.reportId === reportId)
 * - Exists in existence cache (true or false - both mean it was checked)
 *
 * @param reportId - Report identifier
 * @returns true if report is NEW, false if report exists in store or cache
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
    // Check flow-specific stores (flow-aware)
    const manualSession = useManualSessionStore.getState().session
    const conversationalSession = useConversationalSessionStore.getState().session
    
    if (manualSession?.reportId === reportId || conversationalSession?.reportId === reportId) {
      detectorLogger.debug('Report exists in flow store', {
        reportId,
        inManual: manualSession?.reportId === reportId,
        inConversational: conversationalSession?.reportId === reportId,
      })
      return false // Not new - already in store
    }

    // Check existence cache (but store is primary source)
    const exists = checkReportExists(reportId)
    if (exists !== null) {
      detectorLogger.debug('Report exists in existence cache', {
        reportId,
        exists,
      })
      return false // Not new - was checked before
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
