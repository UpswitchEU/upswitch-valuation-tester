/**
 * Valuation Toolbar Flow Hook
 *
 * Single Responsibility: Handle flow switching logic for ValuationToolbar
 * SOLID Principles: SRP - Only handles flow switching operations
 *
 * @module hooks/valuationToolbar/useValuationToolbarFlow
 */

import { useEffect, useState } from 'react'
import { useManualSessionStore } from '../../store/manual'
import { useConversationalSessionStore } from '../../store/conversational'

export interface UseValuationToolbarFlowReturn {
  showSwitchConfirmation: boolean
  handleFlowIconClick: (flow: 'manual' | 'conversational') => Promise<void>
  handleConfirmSwitch: () => Promise<void>
  handleCancelSwitch: () => void
  isSyncing: boolean
}

/**
 * Hook for managing flow switching in ValuationToolbar
 * 
 * NOTE: Flow switching is not supported in the new flow-isolated architecture.
 * Flows are completely isolated and cannot be switched. Users must navigate
 * to the appropriate flow URL.
 */
export const useValuationToolbarFlow = (): UseValuationToolbarFlowReturn => {
  const [showSwitchConfirmation, setShowSwitchConfirmation] = useState(false)

  // Flow switching disabled in new architecture
  const handleFlowIconClick = async (flow: 'manual' | 'conversational') => {
    // Flow switching not supported - flows are isolated
    // User should navigate to appropriate flow URL instead
    console.warn('[Toolbar] Flow switching not supported in flow-isolated architecture')
  }

  const handleConfirmSwitch = async () => {
    // Flow switching not supported
    setShowSwitchConfirmation(false)
  }

  const handleCancelSwitch = () => {
    setShowSwitchConfirmation(false)
  }

  return {
    showSwitchConfirmation: false, // Always false - flow switching disabled
    handleFlowIconClick,
    handleConfirmSwitch,
    handleCancelSwitch,
    isSyncing: false, // No syncing needed - flows are isolated
  }
}
