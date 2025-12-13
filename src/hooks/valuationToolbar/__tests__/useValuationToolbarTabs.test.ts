/**
 * Unit tests for useValuationToolbarTabs hook
 *
 * @module hooks/valuationToolbar/__tests__/useValuationToolbarTabs.test
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useValuationToolbarTabs } from '../useValuationToolbarTabs'

describe('useValuationToolbarTabs', () => {
  it('should initialize with default tab', () => {
    const { result } = renderHook(() => useValuationToolbarTabs())

    expect(result.current.activeTab).toBe('preview')
  })

  it('should initialize with custom initial tab', () => {
    const { result } = renderHook(() =>
      useValuationToolbarTabs({ initialTab: 'info' })
    )

    expect(result.current.activeTab).toBe('info')
  })

  it('should change tab when handleTabChange is called', () => {
    const { result } = renderHook(() => useValuationToolbarTabs())

    act(() => {
      result.current.handleTabChange('source')
    })

    expect(result.current.activeTab).toBe('source')
  })

  it('should call onTabChange callback when provided', () => {
    const onTabChange = vi.fn()
    const { result } = renderHook(() =>
      useValuationToolbarTabs({ onTabChange })
    )

    act(() => {
      result.current.handleTabChange('info')
    })

    expect(onTabChange).toHaveBeenCalledWith('info')
    expect(result.current.activeTab).toBe('info')
  })

  it('should handle multiple tab changes', () => {
    const { result } = renderHook(() => useValuationToolbarTabs())

    act(() => {
      result.current.handleTabChange('source')
    })
    expect(result.current.activeTab).toBe('source')

    act(() => {
      result.current.handleTabChange('info')
    })
    expect(result.current.activeTab).toBe('info')

    act(() => {
      result.current.handleTabChange('preview')
    })
    expect(result.current.activeTab).toBe('preview')
  })
})
