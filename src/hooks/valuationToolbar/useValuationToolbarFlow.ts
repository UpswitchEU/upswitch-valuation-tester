/**
 * Valuation Toolbar Flow Hook
 *
 * Single Responsibility: Handle flow switching logic for ValuationToolbar
 * SOLID Principles: SRP - Only handles flow switching operations
 *
 * @module hooks/valuationToolbar/useValuationToolbarFlow
 */

import { useEffect, useState } from 'react'
import { useValuationSessionStore } from '../../store/useValuationSessionStore'

export interface UseValuationToolbarFlowReturn {
  showSwitchConfirmation: boolean
  handleFlowIconClick: (flow: 'manual' | 'conversational') => Promise<void>
  handleConfirmSwitch: () => Promise<void>
  handleCancelSwitch: () => void
  isSyncing: boolean
}

/**
 * Hook for managing flow switching in ValuationToolbar
 */
export const useValuationToolbarFlow = (): UseValuationToolbarFlowReturn => {
  const { session, switchView, pendingFlowSwitch, setPendingFlowSwitch, isSyncing } =
    useValuationSessionStore()
  const [showSwitchConfirmation, setShowSwitchConfirmation] = useState(false)

  // Sync modal visibility with pendingFlowSwitch state
  useEffect(() => {
    if (pendingFlowSwitch) {
      setShowSwitchConfirmation(true)
    } else {
      setShowSwitchConfirmation(false)
    }
  }, [pendingFlowSwitch])

  // Handler for flow toggle icon clicks
  const handleFlowIconClick = async (flow: 'manual' | 'conversational') => {
    if (!session || session.currentView === flow) return // Already in this flow or no session

    // Attempt to switch - preserve data when switching flows (resetData=false)
    // Both flows share the same session data
    const result = await switchView(flow, false, false) // resetData=false, skipConfirmation=false

    // If confirmation is needed, show modal
    // Note: With the updated logic, this should always return needsConfirmation=true for user-initiated switches
    if (result?.needsConfirmation) {
      setShowSwitchConfirmation(true)
    }
  }

  const handleConfirmSwitch = async () => {
    if (!pendingFlowSwitch) return

    // Execute the switch with confirmation skipped - preserve data
    await switchView(pendingFlowSwitch, false, true) // resetData=false, skipConfirmation=true
    setShowSwitchConfirmation(false)
    setPendingFlowSwitch(null)
  }

  const handleCancelSwitch = () => {
    setShowSwitchConfirmation(false)
    setPendingFlowSwitch(null) // Clear pending switch when user cancels
  }

  return {
    showSwitchConfirmation,
    handleFlowIconClick,
    handleConfirmSwitch,
    handleCancelSwitch,
    isSyncing,
  }
}
