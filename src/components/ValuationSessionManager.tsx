/**
 * ValuationSessionManager Component
 *
 * Manages session initialization and flow selection.
 * Single Responsibility: Session lifecycle and flow coordination.
 *
 * @module components/ValuationSessionManager
 */

'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { guestCreditService } from '../services/guestCreditService'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import type { ValuationSession } from '../types/valuation'
import { generalLogger } from '../utils/logger'
import { OutOfCreditsModal } from './OutOfCreditsModal'

type Stage = 'loading' | 'data-entry' | 'processing' | 'flow-selection'

interface ValuationSessionManagerProps {
  reportId: string
  children: (props: {
    session: ValuationSession | null
    stage: Stage
    error: string | null
    showOutOfCreditsModal: boolean
    onCloseModal: () => void
    prefilledQuery: string | null
    autoSend: boolean
  }) => React.ReactNode
}

/**
 * Valuation Session Manager
 *
 * Handles session initialization, credit checking, and flow setup.
 * Provides session context to child components.
 */
export const ValuationSessionManager: React.FC<ValuationSessionManagerProps> = React.memo(
  ({ reportId, children }) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { isAuthenticated } = useAuth()

    const { session, initializeSession } = useValuationSessionStore()
    const [currentReportId, setCurrentReportId] = useState<string>('')
    const [stage, setStage] = useState<Stage>('loading')
    const [error, setError] = useState<string | null>(null)
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)

    // Extract prefilled query from location state with proper typing
    interface LocationState {
      prefilledQuery?: string | null
      autoSend?: boolean
    }

    const locationState = {} // Next.js doesn't support location state like React Router
    const prefilledQuery = locationState.prefilledQuery || null
    const autoSend = locationState.autoSend || false

    // Track initialization state per reportId using ref to avoid dependency loops
    const initializationState = useRef<
      Map<string, { initialized: boolean; isInitializing: boolean }>
    >(new Map())

    // Initialize session on mount - only once per reportId
    const initializeSessionForReport = useCallback(
      async (reportId: string) => {
        const state = initializationState.current.get(reportId)

        // Prevent concurrent initialization attempts
        if (state?.isInitializing) {
          return // Already initializing, wait for completion
        }

        // Prevent re-initialization if already initialized
        if (state?.initialized) {
          return // Already initialized, don't re-initialize
        }

        // Mark as initializing to prevent concurrent calls
        initializationState.current.set(reportId, { initialized: false, isInitializing: true })

        try {
          // Check for flow parameter in URL to set initial view
          // searchParams is already available from Next.js hook
          const flowParam = searchParams.get('flow')
          const initialView =
            flowParam === 'manual' || flowParam === 'conversational' ? flowParam : 'manual' // Default to manual

          // Validate credits for Conversational (guests only)
          if (initialView === 'conversational' && !isAuthenticated) {
            const hasCredits = guestCreditService.hasCredits()
            if (!hasCredits) {
              setShowOutOfCreditsModal(true)
              // Still initialize session but with manual view
              await initializeSession(reportId, 'manual')
              setStage('data-entry')
              initializationState.current.set(reportId, {
                initialized: true,
                isInitializing: false,
              })
              return
            }
          }

          // Initialize or load session with prefilled query from homepage
          await initializeSession(reportId, initialView, prefilledQuery)
          setStage('data-entry')
          initializationState.current.set(reportId, { initialized: true, isInitializing: false })
        } catch (error) {
          // On error, allow retry by not marking as initialized
          initializationState.current.set(reportId, { initialized: false, isInitializing: false })
          generalLogger.error('Failed to initialize session', { error, reportId })
          setError('Failed to initialize valuation session')
        }
      },
      [isAuthenticated, initializeSession, prefilledQuery]
    )

    // Validate and set report ID, then initialize session
    useEffect(() => {
      if (!reportId) {
        return
      }

      // Clean up initialization state for previous reportId if changed
      if (currentReportId && currentReportId !== reportId) {
        initializationState.current.delete(currentReportId)
      }

      setCurrentReportId(reportId)
      initializeSessionForReport(reportId)
    }, [reportId, initializeSessionForReport, currentReportId])

    // Sync URL with current view - prevent loops by only updating when needed
    useEffect(() => {
      if (!session?.currentView || !session?.reportId) {
        return
      }

      const state = initializationState.current.get(session.reportId)

      // Only sync URL if initialization is complete
      if (!state?.initialized) {
        return // Wait for initialization to complete
      }

      // Use searchParams from Next.js hook
      const currentFlow = searchParams.get('flow')

      // Only update URL if it's different - this prevents infinite loops
      if (currentFlow !== session.currentView) {
        searchParams.set('flow', session.currentView)
        const newUrl = `${pathname}?${searchParams.toString()}`
        window.history.replaceState(null, '', newUrl)
      }
    }, [session?.currentView, session?.reportId])

    return (
      <>
        {children({
          session,
          stage,
          error,
          showOutOfCreditsModal,
          onCloseModal: () => setShowOutOfCreditsModal(false),
          prefilledQuery,
          autoSend,
        })}

        {/* Out of Credits Modal */}
        <OutOfCreditsModal
          isOpen={showOutOfCreditsModal}
          onClose={() => setShowOutOfCreditsModal(false)}
          onSignUp={() => {
            setShowOutOfCreditsModal(false)
            // TODO: Implement actual sign-up flow
            generalLogger.info('Sign up clicked from out of credits modal', { reportId })
          }}
          onTryManual={async () => {
            setShowOutOfCreditsModal(false)
            if (session) {
              // Skip confirmation for out-of-credits flow (user explicitly chose manual)
              await useValuationSessionStore.getState().switchView('manual', true, true)
            }
          }}
        />
      </>
    )
  }
)

ValuationSessionManager.displayName = 'ValuationSessionManager'
