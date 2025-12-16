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
import { useSessionInitialization } from '../hooks/useSessionInitialization'
import { guestCreditService } from '../services/guestCreditService'
import UrlGeneratorService from '../services/urlGenerator'
import { useConversationalSessionStore } from '../store/conversational'
import { useManualSessionStore } from '../store/manual'
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
    
    // Use ref to store latest searchParams (prevents callback recreation)
    // This makes initializeSessionForReport stable while still accessing latest params
    const searchParamsRef = useRef(searchParams)
    useEffect(() => {
      searchParamsRef.current = searchParams
    }, [searchParams])

    // Flow-aware: Use appropriate store based on flow parameter
    // Read from searchParams for current render, but use ref in callbacks
    const flowParam = searchParams?.get('flow') || 'manual'
    const isManualFlow = flowParam === 'manual'
    
    const manualSession = useManualSessionStore((state) => state.session)
    const conversationalSession = useConversationalSessionStore((state) => state.session)
    const session = isManualFlow ? manualSession : conversationalSession
    
    // For now, use manual store's methods (this component needs refactoring for full flow isolation)
    const isUpdatingUrl = false // Not used in new architecture
    const setUpdatingUrl = (_value: boolean) => {} // Not used in new architecture
    
    // Initialize session function (flow-aware)
    // Memoized with empty deps - stable reference, uses Zustand promise cache internally
    const initializeSession = useCallback(
      async (reportId: string, view: 'manual' | 'conversational', prefilledQuery?: string | null) => {
        // Zustand stores handle duplicate prevention via promise cache
        // No need for guards here - store is the source of truth
        if (view === 'manual') {
          await useManualSessionStore.getState().loadSessionAsync(reportId)
        } else {
          await useConversationalSessionStore.getState().loadSessionAsync(reportId)
        }
      },
      [] // Empty deps - function is stable, stores handle state internally
    )
    const [stage, setStage] = useState<Stage>('loading')
    const [error, setError] = useState<string | null>(null)
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)

    // Ensure guest session is initialized on any page (home or report)
    // This works for both guest and authenticated users
    // Uses Zustand store with promise caching to prevent race conditions
    useSessionInitialization()

    // Extract prefilled query from URL search params (Next.js App Router)
    const prefilledQuery = searchParams?.get('prefilledQuery') || null
    const autoSend = searchParams?.get('autoSend') === 'true'

    // Initialize session on mount - store handles all state management atomically
    // Stable callback - reads searchParams from ref (prevents recreation on param changes)
    const initializeSessionForReport = useCallback(
      async (reportId: string) => {
        // Don't re-initialize if we're updating URL ourselves
        if (isUpdatingUrl) {
          return // URL update in progress, don't re-initialize
        }

        try {
          // Read searchParams from ref (always latest, doesn't cause callback recreation)
          const currentSearchParams = searchParamsRef.current
          if (!currentSearchParams) {
            return
          }

          // Determine initial view from URL params
          const flowParam = currentSearchParams.get('flow')
          const initialView =
            flowParam === 'manual' || flowParam === 'conversational' ? flowParam : 'manual'
          
          // Determine flow type from params (not from closure)
          const currentIsManualFlow = initialView === 'manual'

          // Validate credits for Conversational (guests only)
          if (initialView === 'conversational' && !isAuthenticated) {
            const hasCredits = guestCreditService.hasCredits()
            if (!hasCredits) {
              setShowOutOfCreditsModal(true)
              // Initialize session with manual view instead
              await initializeSession(reportId, 'manual', currentSearchParams.get('prefilledQuery') || null)
              setStage('data-entry')
              return
            }
          }

          // Store handles all initialization logic atomically (NEW vs EXISTING)
          // Zustand promise cache prevents duplicate loads
          await initializeSession(reportId, initialView, currentSearchParams.get('prefilledQuery') || null)

          // Handle business card prefill if token present
          const tokenParam = currentSearchParams.get('token')
          if (tokenParam) {
            try {
              const { businessCardService } = await import('../services/businessCard')
              const businessCard = await businessCardService.fetchBusinessCard(tokenParam)
              const prefilledData = businessCardService.transformToValuationRequest(businessCard)

              // Update session with prefilled data (flow-aware)
              // Read session fresh from store (not from closure)
              const currentManualSession = useManualSessionStore.getState().session
              const currentConversationalSession = useConversationalSessionStore.getState().session
              const currentSession = currentIsManualFlow ? currentManualSession : currentConversationalSession

              if (currentIsManualFlow) {
                const { updateSessionData } = useManualSessionStore.getState()
                await updateSessionData(prefilledData)
              } else {
                const { saveSession } = useConversationalSessionStore.getState()
                if (currentSession?.reportId) {
                  await saveSession(currentSession.reportId, prefilledData)
                }
              }

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
      [isAuthenticated, initializeSession, isUpdatingUrl] // Stable deps - searchParams and flow read from ref
    )

    // Initialize session when reportId changes
    // Uses Zustand state directly for guards (prevents unnecessary calls)
    // Reads flow from ref to avoid dependency on searchParams changes
    useEffect(() => {
      if (!reportId) {
        return
      }

      // Read flow from ref (not from closure) to avoid stale closures
      const currentSearchParams = searchParamsRef.current
      const flowParam = currentSearchParams?.get('flow') || 'manual'
      const currentIsManualFlow = flowParam === 'manual'

      // GUARD: Check Zustand state directly - if session already exists, skip
      const manualState = useManualSessionStore.getState()
      const conversationalState = useConversationalSessionStore.getState()
      const currentSession = currentIsManualFlow ? manualState.session : conversationalState.session
      
      if (currentSession?.reportId === reportId) {
        generalLogger.debug('Session already exists, skipping initialization', { reportId })
        return
      }

      // GUARD: Check if already loading (Zustand promise cache)
      // Check promise directly - more reliable than isLoading flag
      const activeLoadPromise = currentIsManualFlow ? manualState.loadPromise : conversationalState.loadPromise
      const activeLoadingReportId = currentIsManualFlow ? manualState.loadingReportId : conversationalState.loadingReportId
      
      if (activeLoadPromise && activeLoadingReportId === reportId) {
        generalLogger.debug('Session already loading, skipping initialization', { reportId })
        return
      }

      initializeSessionForReport(reportId)
    }, [reportId, initializeSessionForReport]) // Removed isManualFlow - read from ref instead

    // Sync URL with current view - simple and robust
    useEffect(() => {
      if (!session?.currentView || !session?.reportId || !searchParams) {
        return
      }

      // Session is ready if it exists (new architecture doesn't track initialization state separately)
      if (!session) {
        return
      }

      const currentFlow = searchParams.get('flow')
      const targetFlow = session.currentView

      // Normalize: treat null/undefined/invalid as mismatch (will update to valid flow)
      const normalizedCurrentFlow = 
        currentFlow === 'manual' || currentFlow === 'conversational' ? currentFlow : null

      // Only update if different (handles both directions: manual↔conversational)
      if (normalizedCurrentFlow === targetFlow) {
        setUpdatingUrl(false)
        return
      }

      // Skip if already updating (prevents race conditions via Zustand)
      if (isUpdatingUrl) {
        return
      }

      // Set flag atomically via Zustand
      setUpdatingUrl(true)

      // Extract existing params and update flow
      const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
        if (key !== 'flow') {
          params[key] = value
        }
        })
      params.flow = targetFlow

      const newUrl = UrlGeneratorService.reportById(session.reportId, params)

      // Update URL
        router.replace(newUrl, { scroll: false })

      // Reset flag after Next.js updates (simple delay)
        setTimeout(() => {
        setUpdatingUrl(false)
      }, 100)
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
              // Flow switching not supported in new architecture (flows are isolated)
              // User will need to navigate to manual flow URL
              router.push(`/reports/${reportId}?flow=manual`)
            }
          }}
        />
      </>
    )
  }
)

ValuationSessionManager.displayName = 'ValuationSessionManager'
