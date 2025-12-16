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
    
    // For rendering: use full session object (needed by children)
    // CRITICAL: Always subscribe to both stores to ensure re-renders when session changes
    // Even if we only use one, subscribing to both ensures we catch updates
    const manualSession = useManualSessionStore((state) => state.session)
    const conversationalSession = useConversationalSessionStore((state) => state.session)
    
    // Select session based on flow - this will trigger re-renders when either changes
    const session = isManualFlow ? manualSession : conversationalSession
    
    // CRITICAL: Fallback to direct store read if selector returns null
    // This ensures session is available even if selector hasn't updated yet
    // But we still subscribe above to ensure re-renders when session is set
    let finalSession = session
    if (!finalSession) {
      const manualState = useManualSessionStore.getState()
      const conversationalState = useConversationalSessionStore.getState()
      finalSession = isManualFlow ? manualState.session : conversationalState.session
    }
    
    // Optimized selectors for transition logic: only subscribe to fields we need
    // Subscribe to both flows since flow can change, but Zustand selectors are efficient
    const manualSessionReportId = useManualSessionStore((state) => state.session?.reportId)
    const manualSessionIsLoading = useManualSessionStore((state) => state.isLoading)
    const manualSessionError = useManualSessionStore((state) => state.error)
    const conversationalSessionReportId = useConversationalSessionStore((state) => state.session?.reportId)
    const conversationalSessionIsLoading = useConversationalSessionStore((state) => state.isLoading)
    const conversationalSessionError = useConversationalSessionStore((state) => state.error)
    
    // URL update tracking (prevents re-initialization during URL updates)
    const isUpdatingUrlRef = useRef(false)
    
    // Track if we've already transitioned to prevent infinite loops
    const hasTransitionedRef = useRef(false)
    
    // Track interval ID to prevent multiple intervals running simultaneously
    const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null)
    
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
        if (isUpdatingUrlRef.current) {
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
          
          // Even if initialization fails, if we have a session, allow user to continue
          const currentManualSession = useManualSessionStore.getState().session
          const currentConversationalSession = useConversationalSessionStore.getState().session
          const currentSearchParams = searchParamsRef.current
          const flowParam = currentSearchParams?.get('flow') || 'manual'
          const currentIsManualFlow = flowParam === 'manual'
          const currentSession = currentIsManualFlow ? currentManualSession : currentConversationalSession
          
          if (currentSession?.reportId === reportId) {
            generalLogger.debug('Session exists despite initialization error, transitioning to data-entry', { reportId })
            setStage('data-entry')
          }
        }
      },
      [isAuthenticated, initializeSession] // Stable deps - searchParams and flow read from ref, isUpdatingUrl now in ref
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
        if (!hasTransitionedRef.current) {
          hasTransitionedRef.current = true
          setStage('data-entry') // ✅ Set stage before returning
        }
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

    // Reset transition flag when reportId changes (atomic, no race conditions)
    useEffect(() => {
      hasTransitionedRef.current = false
    }, [reportId])

    // Watch for session availability and transition stage atomically
    // Uses optimized selectors to prevent unnecessary re-renders
    useEffect(() => {
      // Early return guards (atomic checks)
      if (stage !== 'loading' || !reportId || hasTransitionedRef.current) return

      // Get current flow from ref (stable, doesn't cause re-renders)
      const currentSearchParams = searchParamsRef.current
      const flowParam = currentSearchParams?.get('flow') || 'manual'
      const currentIsManualFlow = flowParam === 'manual'
      
      // Use optimized selectors (already subscribed, no need to call getState)
      let currentSessionReportId = currentIsManualFlow ? manualSessionReportId : conversationalSessionReportId
      let isLoading = currentIsManualFlow ? manualSessionIsLoading : conversationalSessionIsLoading
      let currentError = currentIsManualFlow ? manualSessionError : conversationalSessionError

      // Fallback: If selectors return undefined/null, read directly from store
      // This ensures we catch session updates even if selectors don't trigger properly
      if (!currentSessionReportId || isLoading === undefined) {
        const manualState = useManualSessionStore.getState()
        const conversationalState = useConversationalSessionStore.getState()
        const fallbackState = currentIsManualFlow ? manualState : conversationalState
        
        if (!currentSessionReportId) {
          currentSessionReportId = fallbackState.session?.reportId
        }
        if (isLoading === undefined) {
          isLoading = fallbackState.isLoading
        }
        if (!currentError) {
          currentError = fallbackState.error
        }
      }

      // CRITICAL: Also check that the full session object exists (not just reportId)
      // This prevents transitioning when session object hasn't been set yet
      const manualState = useManualSessionStore.getState()
      const conversationalState = useConversationalSessionStore.getState()
      const currentSession = currentIsManualFlow ? manualState.session : conversationalState.session
      
      // Debug logging to understand why transition might not happen
      generalLogger.debug('[ValuationSessionManager] Checking stage transition', {
        reportId,
        stage,
        currentIsManualFlow,
        currentSessionReportId,
        isLoading,
        hasError: !!currentError,
        hasTransitioned: hasTransitionedRef.current,
        sessionObjectExists: !!currentSession,
        sessionReportIdMatches: currentSessionReportId === reportId,
        manualSessionReportId,
        manualSessionIsLoading,
        conversationalSessionReportId,
        conversationalSessionIsLoading,
      })
      
      // Check if session is ready (atomic condition check)
      // CRITICAL: Must check that session object exists, not just reportId matches
      const sessionReady = currentSessionReportId === reportId && !isLoading && !!currentSession
      const sessionReadyWithError = currentSessionReportId === reportId && currentError && !!currentSession

      if (sessionReady || sessionReadyWithError) {
        // Atomic transition: set flag first, then update stage
        // This prevents multiple transitions even if setStage is called multiple times
        if (hasTransitionedRef.current) {
          generalLogger.debug('[ValuationSessionManager] Already transitioned, skipping', { reportId })
          return // Another call already transitioned
        }
        
        hasTransitionedRef.current = true
        generalLogger.info('[ValuationSessionManager] Session available, transitioning to data-entry', { 
          reportId,
          hasError: !!currentError,
          sessionExists: !!currentSessionReportId,
          sessionObjectExists: !!currentSession,
          sessionReady,
          sessionReadyWithError
        })
        setStage('data-entry')
      } else {
        // Log why transition didn't happen for debugging
        generalLogger.debug('[ValuationSessionManager] Session not ready yet', {
          reportId,
          currentSessionReportId,
          expectedReportId: reportId,
          reportIdMatches: currentSessionReportId === reportId,
          isLoading,
          sessionReady,
          sessionReadyWithError,
        })
      }
    }, [reportId, stage, manualSessionReportId, manualSessionIsLoading, manualSessionError, conversationalSessionReportId, conversationalSessionIsLoading, conversationalSessionError]) // React to specific session fields - no intervals needed

    // Timeout fallback: Force transition after 3 seconds if still loading
    // This is a safety net, separate from the main transition logic
    useEffect(() => {
      if (stage !== 'loading' || !reportId || hasTransitionedRef.current) return

      const timeout = setTimeout(() => {
        // Atomic check: only transition if still in loading state
        if (hasTransitionedRef.current || stage !== 'loading') return

        const currentSearchParams = searchParamsRef.current
        const flowParam = currentSearchParams?.get('flow') || 'manual'
        const currentIsManualFlow = flowParam === 'manual'
        
        const manualState = useManualSessionStore.getState()
        const conversationalState = useConversationalSessionStore.getState()
        const currentSession = currentIsManualFlow ? manualState.session : conversationalState.session
        const currentIsLoading = currentIsManualFlow ? manualState.isLoading : conversationalState.isLoading
        const currentSessionReportId = currentSession?.reportId

        // Force transition as last resort if session exists and matches reportId
        // This prevents infinite black screen, but only if we have a valid session
        if (currentSession && currentSessionReportId === reportId && !currentIsLoading) {
          hasTransitionedRef.current = true
          generalLogger.warn('[ValuationSessionManager] Stage transition timeout - forcing transition to data-entry', {
            reportId,
            hasSession: !!currentSession,
            sessionReportId: currentSessionReportId,
            isLoading: currentIsLoading,
            expectedReportId: reportId,
            reportIdMatches: currentSessionReportId === reportId,
          })
          setStage('data-entry')
        } else {
          generalLogger.warn('[ValuationSessionManager] Stage transition timeout - cannot force transition', {
            reportId,
            hasSession: !!currentSession,
            sessionReportId: currentSessionReportId,
            isLoading: currentIsLoading,
            expectedReportId: reportId,
            reportIdMatches: currentSessionReportId === reportId,
          })
        }
      }, 3000) // 3 second timeout (reduced from 10s for faster recovery)

      return () => clearTimeout(timeout)
    }, [stage, reportId])

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
        isUpdatingUrlRef.current = false
        return
      }

      // Skip if already updating (prevents race conditions)
      if (isUpdatingUrlRef.current) {
        return
      }

      // Set flag
      isUpdatingUrlRef.current = true

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
        isUpdatingUrlRef.current = false
      }, 100)
    }, [session?.currentView, session?.reportId, searchParams, router])

    // Debug logging to track stage and session state
    React.useEffect(() => {
      generalLogger.debug('[ValuationSessionManager] Rendering with state', {
        reportId,
        stage,
        hasSession: !!finalSession,
        sessionReportId: finalSession?.reportId,
        error,
      })
    }, [reportId, stage, finalSession, error])

    return (
      <>
        {children({
          session: finalSession,
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
