/**
 * Valuation Toolbar Tabs Hook
 *
 * Single Responsibility: Handle tab switching logic for ValuationToolbar
 * SOLID Principles: SRP - Only handles tab state management
 *
 * @module hooks/valuationToolbar/useValuationToolbarTabs
 */

import { useCallback, useState } from 'react'

export type ValuationTab = 'preview' | 'info' | 'history'

export type ValuationTabWithoutHistory = 'preview' | 'info'

export interface UseValuationToolbarTabsReturn {
  activeTab: ValuationTabWithoutHistory
  handleTabChange: (tab: ValuationTab) => void
}

export interface UseValuationToolbarTabsOptions {
  initialTab?: ValuationTabWithoutHistory
  onTabChange?: (tab: ValuationTab) => void
}

/**
 * Hook for managing tab switching in ValuationToolbar
 *
 * @param options - Configuration options for tab management
 * @returns Tab state and change handler
 */
export const useValuationToolbarTabs = (
  options: UseValuationToolbarTabsOptions = {}
): UseValuationToolbarTabsReturn => {
  const { initialTab = 'preview', onTabChange } = options

  const [activeTab, setActiveTab] = useState<ValuationTabWithoutHistory>(initialTab)

  const handleTabChange = useCallback(
    (tab: ValuationTab) => {
      // Filter out 'history' tab for manual flow (only conversational flow supports it)
      if (tab === 'history') {
        onTabChange?.(tab) // Still call parent callback even if we don't set internal state
        return
      }
      setActiveTab(tab as ValuationTabWithoutHistory)
      onTabChange?.(tab)
    },
    [onTabChange]
  )

  return {
    activeTab,
    handleTabChange,
  }
}
