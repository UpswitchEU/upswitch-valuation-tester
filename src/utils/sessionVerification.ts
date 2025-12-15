/**
 * Session Verification Utility
 *
 * Single Responsibility: Background verification of cached sessions
 * Provides non-blocking cache validation and updates
 *
 * @module utils/sessionVerification
 */

import { backendAPI } from '../services/backendApi'
import { createContextLogger } from '../utils/logger'
import { globalSessionCache } from './sessionCacheManager'
import { normalizeSessionDates } from './sessionHelpers'
import { validateSessionData } from './sessionValidation'
import type { ValuationSession } from '../types/valuation'

const VERIFICATION_LOGGER = createContextLogger('SessionVerification')

/**
 * Minimum age (in milliseconds) before verifying cache
 * Prevents unnecessary verification of fresh cache
 */
const VERIFICATION_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Track verification state to prevent duplicate verifications
 */
const verificationInProgress = new Set<string>()

/**
 * Determine if cache should be verified
 *
 * @param cachedSession - Cached session to check
 * @returns true if verification is needed
 */
export function shouldVerifyCache(cachedSession: ValuationSession): boolean {
  // Always verify if we don't have a timestamp
  if (!cachedSession.updatedAt) {
    return true
  }

  const cacheAge = Date.now() - new Date(cachedSession.updatedAt).getTime()
  return cacheAge > VERIFICATION_THRESHOLD_MS
}

/**
 * Verify cached session with backend in background (non-blocking)
 *
 * Features:
 * - Non-blocking (doesn't await)
 * - Updates cache if backend has newer data
 * - Handles conflicts gracefully
 * - Prevents duplicate verifications
 * - Logs results for observability
 *
 * @param reportId - Report identifier
 * @param cachedSession - Cached session to verify
 */
export function verifySessionInBackground(
  reportId: string,
  cachedSession: ValuationSession
): void {
  // Skip verification if already in progress
  if (verificationInProgress.has(reportId)) {
    VERIFICATION_LOGGER.debug('Verification already in progress, skipping', { reportId })
    return
  }

  // Skip verification if cache is fresh
  if (!shouldVerifyCache(cachedSession)) {
    VERIFICATION_LOGGER.debug('Cache is fresh, skipping verification', {
      reportId,
      cacheAge_minutes: Math.floor(
        (Date.now() - new Date(cachedSession.updatedAt || Date.now()).getTime()) / (60 * 1000)
      ),
    })
    return
  }

  // Mark as in progress
  verificationInProgress.add(reportId)

  // Start verification (non-blocking)
  Promise.resolve()
    .then(async () => {
      VERIFICATION_LOGGER.info('Starting background verification', { reportId })

      try {
        // Fetch from backend
        const backendResponse = await backendAPI.getValuationSession(reportId)

        if (!backendResponse?.session) {
          VERIFICATION_LOGGER.warn('Session not found on backend during verification', {
            reportId,
          })
          // Don't remove cache - might be a temporary backend issue
          return
        }

        // Validate backend session
        validateSessionData(backendResponse.session)

        const backendSession = normalizeSessionDates(backendResponse.session)

        // Compare timestamps to determine if backend has newer data
        const cacheTimestamp = cachedSession.updatedAt
          ? new Date(cachedSession.updatedAt).getTime()
          : 0
        const backendTimestamp = backendSession.updatedAt
          ? new Date(backendSession.updatedAt).getTime()
          : 0

        if (backendTimestamp > cacheTimestamp) {
          // Backend has newer data - update cache
          VERIFICATION_LOGGER.info('Backend has newer session data, updating cache', {
            reportId,
            cacheAge_minutes: Math.floor((Date.now() - cacheTimestamp) / (60 * 1000)),
            backendAge_minutes: Math.floor((Date.now() - backendTimestamp) / (60 * 1000)),
          })

          globalSessionCache.set(reportId, backendSession)

          // Update Zustand store if session matches current reportId
          // Note: We can't directly update Zustand here, but the next load will use updated cache
        } else {
          VERIFICATION_LOGGER.debug('Cache is up to date', {
            reportId,
            cacheTimestamp,
            backendTimestamp,
          })
        }
      } catch (error) {
        // Log error but don't throw - verification failures shouldn't break the app
        VERIFICATION_LOGGER.warn('Background verification failed', {
          reportId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      } finally {
        // Remove from in-progress set
        verificationInProgress.delete(reportId)
      }
    })
    .catch((error) => {
      // Catch any unexpected errors
      VERIFICATION_LOGGER.error('Unexpected error in background verification', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      verificationInProgress.delete(reportId)
    })
}

/**
 * Clear verification state (useful for testing)
 */
export function clearVerificationState(): void {
  verificationInProgress.clear()
}

