/**
 * ValuationSessionManager Component
 *
 * Manages session initialization and flow selection.
 * Single Responsibility: Session lifecycle and flow coordination.
 *
 * @module components/ValuationSessionManager
 */

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    const { session, initializeSession } = useValuationSessionStore()
    const [currentReportId, setCurrentReportId] = useState<string>('')
    const [stage, setStage] = useState<Stage>('loading')
    const [error, setError] = useState<string | null>(null)
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)

    // Extract prefilled query from URL search params (Next.js App Router)
    const prefilledQuery = searchParams?.get('prefilledQuery') || null
    const autoSend = searchParams?.get('autoSend') === 'true'

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
        if (!searchParams) {
          initializationState.current.set(reportId, { initialized: false, isInitializing: false })
          return
        }
        
        // Try to restore existing session first (for continuing existing reports)
        const { loadSession } = useValuationSessionStore.getState()
        
        try {
          generalLogger.info('Attempting to restore existing session', { reportId })
          
          await loadSession(reportId)
          
          // Session restored successfully
          setStage('data-entry')
          initializationState.current.set(reportId, { initialized: true, isInitializing: false })
          
          generalLogger.info('Existing session restored successfully', { reportId })
          return
        } catch (restoreError) {
          // Session doesn't exist on backend - create new one
          generalLogger.info('Session not found on backend, creating new session', { 
            reportId,
            error: restoreError instanceof Error ? restoreError.message : 'Unknown error',
          })
        }
        
        // Create new session
        const flowParam = searchParams.get('flow')
        const initialView =
          flowParam === 'manual' || flowParam === 'conversational' ? flowParam : 'manual'
        const tokenParam = searchParams.get('token')

        // Validate credits for Conversational (guests only)
        if (initialView === 'conversational' && !isAuthenticated) {
          const hasCredits = guestCreditService.hasCredits()
          if (!hasCredits) {
            setShowOutOfCreditsModal(true)
            // Still initialize session but with manual view
            await initializeSession(reportId, 'manual', prefilledQuery)
            setStage('data-entry')
            initializationState.current.set(reportId, {
              initialized: true,
              isInitializing: false,
            })
            return
          }
        }

        // Initialize new session with prefilled query from homepage
        await initializeSession(reportId, initialView, prefilledQuery)
        
        // Handle business card prefill if token present
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
              error: businessCardError instanceof Error ? businessCardError.message : 'Unknown error',
              reportId,
            })
            // Continue without prefill - don't block the user
          }
        }
        
        setStage('data-entry')
        initializationState.current.set(reportId, { initialized: true, isInitializing: false })
      } catch (error) {
        // On error, allow retry by not marking as initialized
        initializationState.current.set(reportId, { initialized: false, isInitializing: false })
        generalLogger.error('Failed to initialize session', { error, reportId })
        setError('Failed to initialize valuation session')
      }
    },
    [isAuthenticated, initializeSession, prefilledQuery, searchParams]
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
      if (!searchParams) return
      const currentFlow = searchParams.get('flow')

      // Only update URL if it's different - this prevents infinite loops
      if (currentFlow !== session.currentView && session.reportId) {
        // Extract existing query params and update flow
        const existingParams: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          existingParams[key] = value
        })
        existingParams.flow = session.currentView
        
        // Use centralized URL generator for consistency
        const newUrl = UrlGeneratorService.reportById(session.reportId, existingParams)
        router.replace(newUrl)
      }
    }, [
      session?.currentView,
      session?.reportId,
      pathname,
      searchParams,
      router,
    ])

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
            generalLogger.info('Sign up clicked from out of credits modal - redirecting to main platform', { reportId })
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
