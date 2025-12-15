/**
 * useReportIdTracking Hook
 *
 * Single Responsibility: Track reportId changes across component remounts using sessionStorage.
 * Prevents unnecessary resets when switching flows with the same reportId.
 *
 * @module hooks/useReportIdTracking
 */

import { useEffect, useRef } from 'react'

const SESSION_STORAGE_KEY = 'conversational_last_reportId'

export interface UseReportIdTrackingOptions {
  /** Current report ID */
  reportId: string
  /** Callback when reportId changes (new report detected) */
  onReportIdChange: (isNewReport: boolean) => void
}

export interface UseReportIdTrackingReturn {
  /** Whether this is a new report (reportId changed) */
  isNewReport: boolean
  /** Previous report ID (or null if first mount) */
  previousReportId: string | null
}

/**
 * Tracks reportId across component remounts using sessionStorage
 *
 * Prevents unnecessary resets when:
 * - Switching flows (manual ↔ conversational) with same reportId
 * - Component remounts due to React re-renders
 * - Navigation updates URL but reportId stays same
 *
 * Triggers reset only when:
 * - reportId actually changes (new report started)
 * - User clicks "New Valuation"
 *
 * @param options - Configuration options
 * @returns Tracking state
 *
 * @example
 * ```typescript
 * const { isNewReport } = useReportIdTracking({
 *   reportId: 'val_123',
 *   onReportIdChange: (isNew) => {
 *     if (isNew) {
 *       // Reset conversation state
 *       restoration.reset()
 *       actions.setMessages([])
 *     }
 *   }
 * })
 * ```
 */
export function useReportIdTracking({
  reportId,
  onReportIdChange,
}: UseReportIdTrackingOptions): UseReportIdTrackingReturn {
  const previousReportIdRef = useRef<string | null>(null)

  // Initialize from sessionStorage immediately (before any hooks)
  // This persists across component remounts
  if (previousReportIdRef.current === null && typeof window !== 'undefined') {
    const storedReportId = sessionStorage.getItem(SESSION_STORAGE_KEY)
    previousReportIdRef.current = storedReportId
  }

  useEffect(() => {
    const isNewReport = previousReportIdRef.current !== reportId

    if (!isNewReport) {
      // Same reportId - just switching flows or remounting
      return
    }

    // Update tracking
    previousReportIdRef.current = reportId
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, reportId)
    }

    // Notify parent component
    onReportIdChange(isNewReport)
  }, [reportId, onReportIdChange])

  return {
    isNewReport: previousReportIdRef.current !== reportId,
    previousReportId: previousReportIdRef.current,
  }
}
