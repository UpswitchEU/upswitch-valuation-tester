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
    onRetry: () => void
    onStartOver: () => void
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
    const manualSession = useManualSessionStore((state) => state.session)
    const conversationalSession = useConversationalSessionStore((state) => state.session)
    const session = isManualFlow ? manualSession : conversationalSession

    // Optimized selectors for transition logic: only subscribe to fields we need
    // Subscribe to both flows since flow can change, but Zustand selectors are efficient
    const manualSessionReportId = useManualSessionStore((state) => state.session?.reportId)
    const manualSessionIsLoading = useManualSessionStore((state) => state.isLoading)
    const manualSessionError = useManualSessionStore((state) => state.error)
    const conversationalSessionReportId = useConversationalSessionStore(
      (state) => state.session?.reportId
    )
    const conversationalSessionIsLoading = useConversationalSessionStore((state) => state.isLoading)
    const conversationalSessionError = useConversationalSessionStore((state) => state.error)

    // URL update tracking (prevents re-initialization during URL updates)
    const isUpdatingUrlRef = useRef(false)

    // Track if we've already transitioned to prevent infinite loops
    const hasTransitionedRef = useRef(false)
    
    // Initialize session function (flow-aware)
    // Memoized with empty deps - stable reference, uses Zustand promise cache internally
    const initializeSession = useCallback(
      async (
        reportId: string,
        view: 'manual' | 'conversational',
        prefilledQuery?: string | null
      ) => {
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

    // Performance monitoring: Track component lifecycle
    useEffect(() => {
      performance.mark(`vsm-start-${reportId}`)
      generalLogger.warn('[ValuationSessionManager] Component mounted', {
        reportId,
        timestamp: Date.now(),
      })

      // Add breadcrumb for component mount
      const breadcrumb = `[${new Date().toISOString()}] Component mounted - reportId: ${reportId}`
      console.log(`[BREADCRUMB] ${breadcrumb}`)
      try {
        const existingBreadcrumbs = sessionStorage.getItem(`vsm-breadcrumbs-${reportId}`)
        const breadcrumbs = existingBreadcrumbs ? JSON.parse(existingBreadcrumbs) : []
        breadcrumbs.push(breadcrumb)
        sessionStorage.setItem(`vsm-breadcrumbs-${reportId}`, JSON.stringify(breadcrumbs))
      } catch (e) {
        // Ignore sessionStorage errors
      }

      return () => {
        performance.mark(`vsm-end-${reportId}`)
        try {
          performance.measure(
            `vsm-lifetime-${reportId}`,
            `vsm-start-${reportId}`,
            `vsm-end-${reportId}`
          )
          const measure = performance.getEntriesByName(`vsm-lifetime-${reportId}`)[0]
          generalLogger.warn('[ValuationSessionManager] Component unmounted', {
            reportId,
            lifetimeMs: measure?.duration,
          })
        } catch (e) {
          // Ignore measurement errors
        }
      }
    }, [reportId])

    // Track stage changes to debug rendering issues
    React.useEffect(() => {
      const breadcrumb = `[${new Date().toISOString()}] Stage changed: ${stage} (hasTransitioned: ${hasTransitionedRef.current})`
      console.log(`[BREADCRUMB] ${breadcrumb}`)
      
      generalLogger.info('[ValuationSessionManager] Stage state changed', {
        reportId,
        stage,
        hasTransitioned: hasTransitionedRef.current,
      })

      // Store breadcrumb in sessionStorage
      try {
        const existingBreadcrumbs = sessionStorage.getItem(`vsm-breadcrumbs-${reportId}`)
        const breadcrumbs = existingBreadcrumbs ? JSON.parse(existingBreadcrumbs) : []
        breadcrumbs.push(breadcrumb)
        sessionStorage.setItem(`vsm-breadcrumbs-${reportId}`, JSON.stringify(breadcrumbs))
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }, [stage, reportId])

    // Wrapper for setStage with logging and performance monitoring
    const setStageWithLogging = React.useCallback(
      (newStage: Stage) => {
        // Performance mark for stage transition
        performance.mark(`vsm-stage-${newStage}-${reportId}`)
        
        const breadcrumb = `[${new Date().toISOString()}] Stage transition: ${stage} → ${newStage}`
        console.log(`[BREADCRUMB] ${breadcrumb}`)

        generalLogger.info('[ValuationSessionManager] Calling setStage', {
          reportId,
          from: stage,
          to: newStage,
          hasTransitioned: hasTransitionedRef.current,
          timestamp: Date.now(),
        })

        // Store breadcrumb in sessionStorage
        try {
          const existingBreadcrumbs = sessionStorage.getItem(`vsm-breadcrumbs-${reportId}`)
          const breadcrumbs = existingBreadcrumbs ? JSON.parse(existingBreadcrumbs) : []
          breadcrumbs.push(breadcrumb)
          sessionStorage.setItem(`vsm-breadcrumbs-${reportId}`, JSON.stringify(breadcrumbs))
        } catch (e) {
          // Ignore sessionStorage errors
        }

        setStage(newStage)
      },
      [reportId, stage]
    )

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
        // Breadcrumb: Start of initialization
        const breadcrumb = `[${new Date().toISOString()}] initializeSessionForReport called - reportId: ${reportId}`
        console.log(`[BREADCRUMB] ${breadcrumb}`)
        try {
          const existingBreadcrumbs = sessionStorage.getItem(`vsm-breadcrumbs-${reportId}`)
          const breadcrumbs = existingBreadcrumbs ? JSON.parse(existingBreadcrumbs) : []
          breadcrumbs.push(breadcrumb)
          sessionStorage.setItem(`vsm-breadcrumbs-${reportId}`, JSON.stringify(breadcrumbs))
        } catch (e) {
          // Ignore
        }

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
              await initializeSession(
                reportId,
                'manual',
                currentSearchParams.get('prefilledQuery') || null
              )
              setStageWithLogging('data-entry')
              return
            }
          }

          // Store handles all initialization logic atomically (NEW vs EXISTING)
          // Zustand promise cache prevents duplicate loads
          await initializeSession(
            reportId,
            initialView,
            currentSearchParams.get('prefilledQuery') || null
          )

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
              const currentSession = currentIsManualFlow
                ? currentManualSession
                : currentConversationalSession

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

          setStageWithLogging('data-entry')
        } catch (error) {
          generalLogger.error('Failed to initialize session', { error, reportId })
          setError('Failed to initialize valuation session')

          // Even if initialization fails, if we have a session, allow user to continue
          const currentManualSession = useManualSessionStore.getState().session
          const currentConversationalSession = useConversationalSessionStore.getState().session
          const currentSearchParams = searchParamsRef.current
          const flowParam = currentSearchParams?.get('flow') || 'manual'
          const currentIsManualFlow = flowParam === 'manual'
          const currentSession = currentIsManualFlow
            ? currentManualSession
            : currentConversationalSession

          if (currentSession?.reportId === reportId) {
            generalLogger.debug(
              'Session exists despite initialization error, transitioning to data-entry',
              { reportId }
            )
            setStageWithLogging('data-entry')
          }
        }
      },
      [isAuthenticated, initializeSession, setStageWithLogging] // Stable deps - searchParams and flow read from ref, isUpdatingUrl now in ref
    )

    // Retry callback: Reset state and re-initialize session
    const handleRetry = useCallback(() => {
      generalLogger.info('[ValuationSessionManager] User triggered retry', { reportId })

      // Reset transition flag
      hasTransitionedRef.current = false

      // Clear error
      setError(null)

      // Reset to loading stage
      setStage('loading')

      // Re-initialize session
      initializeSessionForReport(reportId)
    }, [reportId, initializeSessionForReport])

    // Start over callback: Clear session and return to homepage
    const handleStartOver = useCallback(() => {
      generalLogger.info('[ValuationSessionManager] User triggered start over', { reportId })

      // Clear session from stores
      useManualSessionStore.getState().clearSession()
      useConversationalSessionStore.getState().clearSession()

      // Navigate to homepage
      router.push('/')
    }, [reportId, router])

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
          setStageWithLogging('data-entry') // ✅ Set stage before returning
        }
        return
      }

      // GUARD: Check if already loading (Zustand promise cache)
      // Check promise directly - more reliable than isLoading flag
      const activeLoadPromise = currentIsManualFlow
        ? manualState.loadPromise
        : conversationalState.loadPromise
      const activeLoadingReportId = currentIsManualFlow
        ? manualState.loadingReportId
        : conversationalState.loadingReportId

      if (activeLoadPromise && activeLoadingReportId === reportId) {
        generalLogger.debug('Session already loading, skipping initialization', { reportId })
        return
      }

      initializeSessionForReport(reportId)
    }, [reportId, initializeSessionForReport, setStageWithLogging]) // Removed isManualFlow - read from ref instead

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
      const currentSessionReportId = currentIsManualFlow
        ? manualSessionReportId
        : conversationalSessionReportId
      const isLoading = currentIsManualFlow
        ? manualSessionIsLoading
        : conversationalSessionIsLoading
      const currentError = currentIsManualFlow ? manualSessionError : conversationalSessionError

      // Check if session is ready (atomic condition check)
      const sessionReady = currentSessionReportId === reportId && !isLoading
      const sessionReadyWithError = currentSessionReportId === reportId && currentError

      if (sessionReady || sessionReadyWithError) {
        // Atomic transition: set flag first, then update stage
        // This prevents multiple transitions even if setStage is called multiple times
        if (hasTransitionedRef.current) return // Another call already transitioned

        hasTransitionedRef.current = true
        generalLogger.debug('Session available, transitioning to data-entry', {
          reportId,
          hasError: !!currentError,
          sessionExists: !!currentSessionReportId,
          sessionReady,
          sessionReadyWithError,
        })
        setStageWithLogging('data-entry')
      }
    }, [
      reportId,
      stage,
      manualSessionReportId,
      manualSessionIsLoading,
      manualSessionError,
      conversationalSessionReportId,
      conversationalSessionIsLoading,
      conversationalSessionError,
      setStageWithLogging,
    ]) // React to specific session fields - no intervals needed

    // Aggressive timeout: 15-second absolute deadline with interval-based checking
    // This prevents tab freeze by ensuring we ALWAYS transition or show error
    useEffect(() => {
      if (stage !== 'loading' || !reportId) return

      const absoluteDeadline = Date.now() + 15000 // 15 seconds from now
      const startTime = Date.now()

      generalLogger.info('[ValuationSessionManager] Starting absolute deadline timer', {
        reportId,
        deadlineSeconds: 15,
        startTime,
      })

      const checkDeadline = () => {
        const now = Date.now()
        const elapsed = now - startTime

        // Check if deadline exceeded AND still in loading state
        if (now >= absoluteDeadline && stage === 'loading' && !hasTransitionedRef.current) {
          generalLogger.error('[ValuationSessionManager] ABSOLUTE DEADLINE EXCEEDED', {
            reportId,
            elapsedMs: elapsed,
            stage,
            hasSession: !!session,
          })

          const currentSearchParams = searchParamsRef.current
          const flowParam = currentSearchParams?.get('flow') || 'manual'
          const currentIsManualFlow = flowParam === 'manual'

          const manualState = useManualSessionStore.getState()
          const conversationalState = useConversationalSessionStore.getState()
          const currentSession = currentIsManualFlow
            ? manualState.session
            : conversationalState.session

          // Mark as transitioned to prevent other transitions
          hasTransitionedRef.current = true

          // Show error recovery UI to user (prevents infinite loading)
          if (!currentSession) {
            generalLogger.warn('[ValuationSessionManager] No session after deadline - showing error', {
              reportId,
              elapsedMs: elapsed,
            })
            setError(
              'Session initialization exceeded maximum time limit. Please retry or start over.'
            )
          } else {
            // Session exists, force transition to data-entry
            generalLogger.warn(
              '[ValuationSessionManager] Session exists after deadline - forcing transition',
              {
                reportId,
                sessionReportId: currentSession?.reportId,
                elapsedMs: elapsed,
              }
            )
            setStageWithLogging('data-entry')
          }
        }
      }

      // Check every second to ensure we catch the deadline reliably
      const intervalId = setInterval(checkDeadline, 1000)

      // Also set a timeout for the exact deadline (belt and suspenders)
      const timeoutId = setTimeout(() => {
        checkDeadline()
        clearInterval(intervalId)
      }, 15000)

      return () => {
        clearTimeout(timeoutId)
        clearInterval(intervalId)
        generalLogger.info('[ValuationSessionManager] Deadline timer cleaned up', {
          reportId,
          elapsedMs: Date.now() - startTime,
        })
      }
    }, [reportId, stage, session, setStageWithLogging]) // Include all dependencies

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
          onRetry: handleRetry,
          onStartOver: handleStartOver,
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
