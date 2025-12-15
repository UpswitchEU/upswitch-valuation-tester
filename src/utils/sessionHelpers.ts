/**
 * Session Helper Utilities
 *
 * Single Responsibility: Session ID generation and base session object creation.
 * Pure functions for creating consistent session structures.
 *
 * @module utils/sessionHelpers
 */

import type { ValuationSession } from '../types/valuation'

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
