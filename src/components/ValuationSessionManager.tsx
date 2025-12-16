/**
 * ValuationSessionManager Component (Simplified)
 *
 * Cursor-style session management with optimistic rendering.
 * Single Responsibility: Load session and provide to children.
 *
 * Simplifications:
 * - No stage state machine (just isLoading boolean)
 * - No complex guards (promise cache handles duplicates)
 * - No deadline timers (optimistic rendering handles delays)
 * - Simple error recovery
 *
 * @module components/ValuationSessionManager
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect } from 'react'
import { useSessionStore } from '../store/useSessionStore'
import type { ValuationSession } from '../types/valuation'
import { generalLogger } from '../utils/logger'

type Stage = 'loading' | 'data-entry' | 'processing' | 'flow-selection'

interface ValuationSessionManagerProps {
  reportId: string
  initialMode?: 'edit' | 'view'
  initialVersion?: number
  children: (props: {
    session: ValuationSession | null
    stage: Stage
    error: string | null
    showOutOfCreditsModal: boolean
    onCloseModal: () => void
    prefilledQuery: string | null
    autoSend: boolean
    onRetry: () => void
    onStartOver: () => void
    reportId: string
  }) => React.ReactNode
}

/**
 * Valuation Session Manager (Simplified)
 *
 * Load session and render children optimistically.
 * Promise cache prevents duplicate loads.
 */
export const ValuationSessionManager: React.FC<ValuationSessionManagerProps> = React.memo(
  ({ reportId, children }) => {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    // Unified store (replaces manual + conversational stores)
    const { session, isLoading, error, loadSession, clearSession } = useSessionStore()
    
    // Extract URL params
    const prefilledQuery = searchParams?.get('prefilledQuery') || null
    const autoSend = searchParams?.get('autoSend') === 'true'
    
    // Dynamic stage based on loading state
    const stage: Stage = isLoading && !session ? 'loading' : 'data-entry'
    
    // Load session when reportId changes (promise cache prevents duplicates)
    useEffect(() => {
      generalLogger.info('[SessionManager] Loading session', { reportId })
      loadSession(reportId).catch(err => {
        generalLogger.error('[SessionManager] Load failed', {
          reportId,
          error: err.message
        })
      })
    }, [reportId, loadSession])
    
    // Retry: Clear error and reload
    const handleRetry = useCallback(() => {
      generalLogger.info('[SessionManager] Retrying load', { reportId })
      loadSession(reportId)
    }, [reportId, loadSession])
    
    // Start over: Clear and navigate home
    const handleStartOver = useCallback(() => {
      generalLogger.info('[SessionManager] Starting over', { reportId })
      clearSession()
      router.push('/')
    }, [reportId, clearSession, router])
    
    // Simplified render: Optimistic UI (no loading screen)
    return children({
      session,
      stage,
      error,
      showOutOfCreditsModal: false, // TODO: Re-implement if needed
      onCloseModal: () => {}, // No-op
      prefilledQuery,
      autoSend,
      onRetry: handleRetry,
      onStartOver: handleStartOver,
      reportId,
    })
  }
)

ValuationSessionManager.displayName = 'ValuationSessionManager'
