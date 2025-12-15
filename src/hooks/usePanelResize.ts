/**
 * usePanelResize Hook
 * 
 * Single Responsibility: Manage resizable panel width with localStorage persistence.
 * Handles constraints, snapping, and user preferences.
 * 
 * @module hooks/usePanelResize
 */

import { useCallback, useEffect, useState } from 'react'
import { PANEL_CONSTRAINTS } from '../constants/panelConstants'
import { chatLogger } from '../utils/logger'

const STORAGE_KEY = 'upswitch-panel-width'

export interface UsePanelResizeReturn {
  /** Current left panel width (percentage) */
  leftPanelWidth: number
  /** Handler for panel resize events */
  handleResize: (newWidth: number) => void
}

/**
 * Manages resizable panel width with localStorage persistence
 * 
 * Features:
 * - Persists user's preferred width across sessions
 * - Enforces min/max constraints
 * - Snaps to default if within 2% tolerance
 * - Graceful fallback on storage errors
 * 
 * @returns Panel width state and resize handler
 * 
 * @example
 * ```typescript
 * const { leftPanelWidth, handleResize } = usePanelResize()
 * 
 * return (
 *   <ResizableDivider
 *     leftPanelWidth={leftPanelWidth}
 *     onResize={handleResize}
 *   />
 * )
 * ```
 */
export function usePanelResize(): UsePanelResizeReturn {
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = parseFloat(saved)
        if (
          !isNaN(parsed) &&
          parsed >= PANEL_CONSTRAINTS.MIN_WIDTH &&
          parsed <= PANEL_CONSTRAINTS.MAX_WIDTH
        ) {
          return parsed
        }
      }
    } catch (error) {
      chatLogger.warn('Failed to load saved panel width', { error })
    }
    return PANEL_CONSTRAINTS.DEFAULT_WIDTH
  })

  // Persist to localStorage whenever width changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, leftPanelWidth.toString())
    } catch (error) {
      chatLogger.warn('Failed to save panel width', { error })
    }
  }, [leftPanelWidth])

  const handleResize = useCallback((newWidth: number) => {
    // Enforce constraints
    const constrainedWidth = Math.max(
      PANEL_CONSTRAINTS.MIN_WIDTH,
      Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth)
    )
    
    // Snap to default if within tolerance (2%)
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH)
    } else {
      setLeftPanelWidth(constrainedWidth)
    }
  }, [])

  return {
    leftPanelWidth,
    handleResize,
  }
}
