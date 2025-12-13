/**
 * Unit tests for RefreshService
 *
 * @module services/toolbar/__tests__/refreshService.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RefreshService } from '../refreshService'

describe('RefreshService', () => {
  const originalReload = window.location.reload
  const mockReload = vi.fn()

  beforeEach(() => {
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: {
        reload: originalReload,
      },
      writable: true,
    })
  })

  describe('refresh', () => {
    it('should call window.location.reload', () => {
      RefreshService.refresh()
      expect(mockReload).toHaveBeenCalledOnce()
    })
  })

  describe('refreshWithConfirmation', () => {
    const originalConfirm = window.confirm
    let mockConfirm: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockConfirm = vi.fn()
      window.confirm = mockConfirm
    })

    afterEach(() => {
      window.confirm = originalConfirm
    })

    it('should refresh immediately if no unsaved changes', async () => {
      const result = await RefreshService.refreshWithConfirmation(false)

      expect(mockConfirm).not.toHaveBeenCalled()
      expect(mockReload).toHaveBeenCalledOnce()
      expect(result).toBe(true)
    })

    it('should show confirmation dialog if there are unsaved changes', async () => {
      mockConfirm.mockReturnValue(true)

      const result = await RefreshService.refreshWithConfirmation(true)

      expect(mockConfirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to refresh?'
      )
      expect(mockReload).toHaveBeenCalledOnce()
      expect(result).toBe(true)
    })

    it('should not refresh if user cancels', async () => {
      mockConfirm.mockReturnValue(false)

      const result = await RefreshService.refreshWithConfirmation(true)

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockReload).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('softRefresh', () => {
    it('should call window.location.reload', () => {
      RefreshService.softRefresh()
      expect(mockReload).toHaveBeenCalledOnce()
    })
  })
})
