/**
 * Unit tests for useValuationToolbarRefresh hook
 *
 * @module hooks/valuationToolbar/__tests__/useValuationToolbarRefresh.test
 */

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RefreshService } from '../../../services/toolbar/refreshService'
import { useValuationToolbarRefresh } from '../useValuationToolbarRefresh'

// Mock RefreshService
vi.mock('../../../services/toolbar/refreshService', () => ({
  RefreshService: {
    refresh: vi.fn(),
    refreshWithConfirmation: vi.fn(),
  },
}))

describe('useValuationToolbarRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call RefreshService.refresh by default', () => {
    const { result } = renderHook(() => useValuationToolbarRefresh())

    act(() => {
      result.current.handleRefresh()
    })

    expect(RefreshService.refresh).toHaveBeenCalledOnce()
  })

  it('should call RefreshService.refreshWithConfirmation when confirmIfUnsaved is true', () => {
    const { result } = renderHook(() =>
      useValuationToolbarRefresh({
        confirmIfUnsaved: true,
        hasUnsavedChanges: true,
      })
    )

    act(() => {
      result.current.handleRefresh()
    })

    expect(RefreshService.refreshWithConfirmation).toHaveBeenCalledWith(true)
  })

  it('should call RefreshService.refresh when confirmIfUnsaved is true but no unsaved changes', () => {
    const { result } = renderHook(() =>
      useValuationToolbarRefresh({
        confirmIfUnsaved: true,
        hasUnsavedChanges: false,
      })
    )

    act(() => {
      result.current.handleRefresh()
    })

    expect(RefreshService.refreshWithConfirmation).toHaveBeenCalledWith(false)
  })
})
