/**
 * Valuation Toolbar Flow Hook
 *
 * Single Responsibility: Handle flow switching logic for ValuationToolbar
 * SOLID Principles: SRP - Only handles flow switching operations
 *
 * @module hooks/valuationToolbar/useValuationToolbarFlow
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useSessionStore } from '../../store/useSessionStore'
import { generalLogger } from '../../utils/logger'
import { hasMeaningfulSessionData } from '../../utils/sessionDataUtils'

export interface UseValuationToolbarFlowReturn {
  showSwitchConfirmation: boolean
  pendingFlowTarget: 'manual' | 'conversational' | null
  handleFlowIconClick: (flow: 'manual' | 'conversational') => Promise<void>
  handleConfirmSwitch: () => Promise<void>
  handleCancelSwitch: () => void
  isSyncing: boolean
}

/**
 * Hook for managing flow switching in ValuationToolbar
 * 
 * Enables switching between manual and conversational flows with:
 * - Warning modal when user has entered data
 * - Immediate switch when no data exists
 * - URL parameter updates
 * - Session store synchronization
 */
export const useValuationToolbarFlow = (): UseValuationToolbarFlowReturn => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSwitchConfirmation, setShowSwitchConfirmation] = useState(false)
  const [pendingFlowTarget, setPendingFlowTarget] = useState<'manual' | 'conversational' | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Get session state
  const reportId = useSessionStore((state) => state.session?.reportId)
  const currentView = useSessionStore((state) => state.session?.currentView)
  const session = useSessionStore((state) => state.session)
  const updateSession = useSessionStore((state) => state.updateSession)

  /**
   * Handle flow icon click
   * Shows modal if data exists, switches immediately if no data
   */
  const handleFlowIconClick = async (flow: 'manual' | 'conversational') => {
    // Guard: No reportId - can't switch
    if (!reportId) {
      generalLogger.warn('[Toolbar] Cannot switch flow: no reportId')
      return
    }

    // Guard: Already on target flow - no-op (button should be disabled, but check anyway)
    if (currentView === flow) {
      generalLogger.debug('[Toolbar] Already on target flow', { flow })
      return
    }

    // Check if user has entered meaningful data
    const sessionData = session?.sessionData || {}
    const hasData = hasMeaningfulSessionData(sessionData, session)

    if (hasData) {
      // User has data - show warning modal
      setPendingFlowTarget(flow)
      setShowSwitchConfirmation(true)
      generalLogger.info('[Toolbar] Flow switch requested with data - showing modal', {
        from: currentView,
        to: flow,
        reportId,
      })
    } else {
      // No data - switch immediately
      await performFlowSwitch(flow)
    }
  }

  /**
   * Perform the actual flow switch
   * Updates session store and URL
   */
  const performFlowSwitch = async (targetFlow: 'manual' | 'conversational') => {
    if (!reportId) {
      generalLogger.error('[Toolbar] Cannot perform flow switch: no reportId')
      return
    }

    setIsSyncing(true)

    try {
      generalLogger.info('[Toolbar] Performing flow switch', {
        from: currentView,
        to: targetFlow,
        reportId,
      })

      // Update session store first (optimistic update)
      // This immediately updates the UI to show the new flow
      updateSession({ currentView: targetFlow })

      // Update URL - preserve existing query params (prefilledQuery, autoSend, etc.)
      // This ensures the URL reflects the current flow state
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('flow', targetFlow)
      const newUrl = `/reports/${reportId}?${params.toString()}`
      
      // Use replace to avoid adding history entry
      router.replace(newUrl)

      generalLogger.info('[Toolbar] Flow switch completed', {
        reportId,
        newFlow: targetFlow,
        newUrl,
      })
    } catch (error) {
      generalLogger.error('[Toolbar] Flow switch failed', {
        error: error instanceof Error ? error.message : String(error),
        reportId,
        targetFlow,
      })
      // Don't update URL if session update fails
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Handle confirm switch from modal
   */
  const handleConfirmSwitch = async () => {
    if (!pendingFlowTarget) {
      generalLogger.warn('[Toolbar] Confirm switch called but no pending target')
      setShowSwitchConfirmation(false)
      return
    }

    const targetFlow = pendingFlowTarget
    setShowSwitchConfirmation(false)
    setPendingFlowTarget(null)

    await performFlowSwitch(targetFlow)
  }

  /**
   * Handle cancel switch from modal
   */
  const handleCancelSwitch = () => {
    setShowSwitchConfirmation(false)
    setPendingFlowTarget(null)
    generalLogger.debug('[Toolbar] Flow switch cancelled')
  }

  return {
    showSwitchConfirmation,
    pendingFlowTarget,
    handleFlowIconClick,
    handleConfirmSwitch,
    handleCancelSwitch,
    isSyncing,
  }
}
