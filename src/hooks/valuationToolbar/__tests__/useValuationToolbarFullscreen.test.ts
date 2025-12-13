/**
 * Unit tests for useValuationToolbarFullscreen hook
 *
 * @module hooks/valuationToolbar/__tests__/useValuationToolbarFullscreen.test
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useValuationToolbarFullscreen } from '../useValuationToolbarFullscreen'

describe('useValuationToolbarFullscreen', () => {
  it('should initialize with fullscreen closed', () => {
    const { result } = renderHook(() => useValuationToolbarFullscreen())

    expect(result.current.isFullScreen).toBe(false)
  })

  it('should open fullscreen when handleOpenFullscreen is called', () => {
    const { result } = renderHook(() => useValuationToolbarFullscreen())

    act(() => {
      result.current.handleOpenFullscreen()
    })

    expect(result.current.isFullScreen).toBe(true)
  })

  it('should close fullscreen when handleCloseFullscreen is called', () => {
    const { result } = renderHook(() => useValuationToolbarFullscreen())

    act(() => {
      result.current.handleOpenFullscreen()
    })
    expect(result.current.isFullScreen).toBe(true)

    act(() => {
      result.current.handleCloseFullscreen()
    })
    expect(result.current.isFullScreen).toBe(false)
  })

  it('should toggle fullscreen when toggleFullscreen is called', () => {
    const { result } = renderHook(() => useValuationToolbarFullscreen())

    expect(result.current.isFullScreen).toBe(false)

    act(() => {
      result.current.toggleFullscreen()
    })
    expect(result.current.isFullScreen).toBe(true)

    act(() => {
      result.current.toggleFullscreen()
    })
    expect(result.current.isFullScreen).toBe(false)
  })
})
