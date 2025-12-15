/**
 * ValuationSessionManager Component
 *
 * Manages session initialization and flow selection.
 * Single Responsibility: Session lifecycle and flow coordination.
 *
 * @module components/ValuationSessionManager
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { guestCreditService } from '../services/guestCreditService'
import UrlGeneratorService from '../services/urlGenerator'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import type { ValuationSession } from '../types/valuation'
import { generalLogger } from '../utils/logger'
import { OutOfCreditsModal } from './OutOfCreditsModal'

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
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const { session, initializeSession, isUpdatingUrl, setUpdatingUrl } = useValuationSessionStore()
    const [stage, setStage] = useState<Stage>('loading')
    const [error, setError] = useState<string | null>(null)
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)
    
    // Ref to track the target flow we're updating to (for race condition prevention)
    const targetFlowRef = useRef<string | null>(null)
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Extract prefilled query from URL search params (Next.js App Router)
    const prefilledQuery = searchParams?.get('prefilledQuery') || null
    const autoSend = searchParams?.get('autoSend') === 'true'

    // Initialize session on mount - store handles all state management atomically
    const initializeSessionForReport = useCallback(
      async (reportId: string) => {
        // Don't re-initialize if we're updating URL ourselves
        if (isUpdatingUrl) {
          return // URL update in progress, don't re-initialize
        }

        try {
          if (!searchParams) {
            return
          }

          // Determine initial view from URL params
          const flowParam = searchParams.get('flow')
          const initialView =
            flowParam === 'manual' || flowParam === 'conversational' ? flowParam : 'manual'

          // Validate credits for Conversational (guests only)
          if (initialView === 'conversational' && !isAuthenticated) {
            const hasCredits = guestCreditService.hasCredits()
            if (!hasCredits) {
              setShowOutOfCreditsModal(true)
              // Initialize session with manual view instead
              await initializeSession(reportId, 'manual', prefilledQuery)
              setStage('data-entry')
              return
            }
          }

          // Store handles all initialization logic atomically (NEW vs EXISTING)
          await initializeSession(reportId, initialView, prefilledQuery)

          // Handle business card prefill if token present
          const tokenParam = searchParams.get('token')
          if (tokenParam) {
            try {
              const { businessCardService } = await import('../services/businessCard')
              const businessCard = await businessCardService.fetchBusinessCard(tokenParam)
              const prefilledData = businessCardService.transformToValuationRequest(businessCard)

              // Update session with prefilled data
              const { updateSessionData } = useValuationSessionStore.getState()
              await updateSessionData(prefilledData)

              generalLogger.info('Business card data prefilled', {
                reportId,
                fieldCount: Object.keys(prefilledData).length,
              })
            } catch (businessCardError) {
              generalLogger.error('Failed to prefill business card data', {
                error:
                  businessCardError instanceof Error ? businessCardError.message : 'Unknown error',
                reportId,
              })
              // Continue without prefill - don't block the user
            }
          }

          setStage('data-entry')
        } catch (error) {
          generalLogger.error('Failed to initialize session', { error, reportId })
          setError('Failed to initialize valuation session')
        }
      },
      [isAuthenticated, initializeSession, prefilledQuery, searchParams, isUpdatingUrl]
    )

    // Initialize session when reportId changes
    useEffect(() => {
      if (!reportId) {
        return
      }

      initializeSessionForReport(reportId)
    }, [reportId, initializeSessionForReport])

    // Sync URL with current view - robust with race condition prevention
    useEffect(() => {
      // Clear any pending timeout on effect re-run
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      if (!session?.currentView || !session?.reportId || !searchParams) {
        return
      }

      // Check if session is initialized
      const { initializationState } = useValuationSessionStore.getState()
      const initState = initializationState.get(session.reportId)
      if (initState?.status !== 'ready') {
        return
      }

      const currentFlow = searchParams.get('flow')
      const targetFlow = session.currentView

      // Normalize: treat null/undefined/invalid as mismatch (will update to valid flow)
      const normalizedCurrentFlow = 
        currentFlow === 'manual' || currentFlow === 'conversational' ? currentFlow : null

      // CRITICAL FIX: Check if searchParams have updated to match our target
      // This handles the case where Next.js has updated the URL and searchParams
      // have propagated back, but we haven't reset the flag yet
      if (normalizedCurrentFlow === targetFlow) {
        // If we were updating to this flow, reset the flag
        if (targetFlowRef.current === targetFlow) {
          targetFlowRef.current = null
          setUpdatingUrl(false)
          generalLogger.debug('URL update confirmed via searchParams change', {
            reportId: session.reportId,
            targetFlow,
          })
        }
        return
      }

      // Skip if already updating (prevents race conditions via Zustand)
      if (isUpdatingUrl) {
        return
      }

      // Set flag atomically via Zustand and track target flow
      setUpdatingUrl(true)
      targetFlowRef.current = targetFlow

      // Extract existing params and update flow
      const params: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        if (key !== 'flow') {
          params[key] = value
        }
      })
      params.flow = targetFlow

      const newUrl = UrlGeneratorService.reportById(session.reportId, params)

      generalLogger.debug('Updating URL to sync with session view', {
        reportId: session.reportId,
        currentFlow: normalizedCurrentFlow,
        targetFlow,
        newUrl,
      })

      // Update URL
      router.replace(newUrl, { scroll: false })

      // CRITICAL FIX: Use a longer timeout to allow Next.js router to complete
      // Next.js router.replace() needs time to:
      // 1. Update the browser URL
      // 2. Propagate changes back through useSearchParams()
      // 3. Re-render components with new searchParams
      // 
      // The original 300ms delay was safer. 100ms is too short and causes race conditions
      // where the effect runs again with stale searchParams before Next.js has updated them.
      // 
      // We use 500ms to be conservative, but the effect will also reset the flag early
      // if searchParams update correctly (checked above).
      updateTimeoutRef.current = setTimeout(() => {
        // Only reset if we're still waiting for this target flow
        if (targetFlowRef.current === targetFlow) {
          targetFlowRef.current = null
          setUpdatingUrl(false)
          generalLogger.debug('URL update timeout - resetting flag', {
            reportId: session.reportId,
            targetFlow,
            currentFlow: searchParams.get('flow'),
          })
        }
        updateTimeoutRef.current = null
      }, 500) // Increased from 100ms to 500ms to prevent race conditions

      // Cleanup timeout on unmount or if effect runs again
      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
          updateTimeoutRef.current = null
        }
      }
    }, [session?.currentView, session?.reportId, searchParams, router, isUpdatingUrl, setUpdatingUrl])

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
            // Sign-up is handled by main platform - redirect to main app
            generalLogger.info(
              'Sign up clicked from out of credits modal - redirecting to main platform',
              { reportId }
            )
            // In production, this would redirect to main platform sign-up page
            if (typeof window !== 'undefined') {
              window.location.href = '/signup'
            }
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
