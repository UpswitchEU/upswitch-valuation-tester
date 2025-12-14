/**
 * Valuation Toolbar Refresh Hook
 *
 * Single Responsibility: Handle refresh logic for ValuationToolbar
 * SOLID Principles: SRP - Only handles refresh operations
 *
 * @module hooks/valuationToolbar/useValuationToolbarRefresh
 */

import { useCallback } from 'react'
import { RefreshService } from '../../services/toolbar/refreshService'

export interface UseValuationToolbarRefreshReturn {
  handleRefresh: () => void
}

export interface UseValuationToolbarRefreshOptions {
  confirmIfUnsaved?: boolean
  hasUnsavedChanges?: boolean
}

/**
 * Hook for managing refresh operations in ValuationToolbar
 *
 * @param options - Configuration options for refresh behavior
 * @returns Refresh handler
 */
export const useValuationToolbarRefresh = (
  options: UseValuationToolbarRefreshOptions = {}
): UseValuationToolbarRefreshReturn => {
  const { confirmIfUnsaved = false, hasUnsavedChanges = false } = options

  const handleRefresh = useCallback(() => {
    if (confirmIfUnsaved) {
      RefreshService.refreshWithConfirmation(hasUnsavedChanges)
    } else {
      RefreshService.refresh()
    }
  }, [confirmIfUnsaved, hasUnsavedChanges])

  return {
    handleRefresh,
  }
}
