/**
 * Virtualizer Hook
 *
 * Provides list virtualization for efficient rendering of large lists.
 * Only renders visible items + buffer, dramatically improving performance.
 *
 * Benefits:
 * - Fast rendering even with 1000+ items
 * - Low memory usage
 * - Smooth scrolling
 * - No external dependencies
 *
 * @module hooks/useVirtualizer
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { generalLogger } from '../utils/logger'

export interface VirtualizerConfig {
  /**
   * Total number of items in the list
   */
  count: number

  /**
   * Estimated height of each item in pixels
   * Used for scroll calculations
   */
  estimateSize: number | ((index: number) => number)

  /**
   * Number of items to render above/below viewport (buffer)
   * Default: 5
   */
  overscan?: number

  /**
   * Scroll element ref (defaults to parent element)
   */
  scrollElement?: HTMLElement | null

  /**
   * Enable debug logging
   */
  debug?: boolean
}

export interface VirtualItem {
  /**
   * Item index in the full list
   */
  index: number

  /**
   * Y offset from top of scrollable area
   */
  start: number

  /**
   * Height of the item
   */
  size: number

  /**
   * Y offset of bottom edge
   */
  end: number

  /**
   * Unique key for React rendering
   */
  key: string | number
}

export interface VirtualizerResult {
  /**
   * Array of visible virtual items to render
   */
  virtualItems: VirtualItem[]

  /**
   * Total height of all items (for scrollbar)
   */
  totalSize: number

  /**
   * Start index of visible range
   */
  startIndex: number

  /**
   * End index of visible range
   */
  endIndex: number

  /**
   * Measure actual size of rendered item
   * Call this in ref callback to improve accuracy
   */
  measureElement: (index: number, element: HTMLElement | null) => void

  /**
   * Scroll to specific index
   */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void
}

/**
 * Virtualizer hook for efficient list rendering
 *
 * Usage:
 * ```tsx
 * const virtualizer = useVirtualizer({
 *   count: items.length,
 *   estimateSize: 120, // Each item ~120px tall
 *   overscan: 5, // Render 5 extra items above/below
 * })
 *
 * return (
 *   <div style={{ height: '600px', overflow: 'auto' }} ref={parentRef}>
 *     <div style={{ height: `${virtualizer.totalSize}px`, position: 'relative' }}>
 *       {virtualizer.virtualItems.map(virtualRow => (
 *         <div
 *           key={virtualRow.key}
 *           style={{
 *             position: 'absolute',
 *             top: 0,
 *             left: 0,
 *             width: '100%',
 *             transform: `translateY(${virtualRow.start}px)`,
 *           }}
 *           ref={el => virtualizer.measureElement(virtualRow.index, el)}
 *         >
 *           {items[virtualRow.index]}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * )
 * ```
 */
export function useVirtualizer(config: VirtualizerConfig): VirtualizerResult {
  const { count, estimateSize, overscan = 5, scrollElement, debug = false } = config

  const [scrollOffset, setScrollOffset] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  // Store measured sizes for dynamic height
  const measurementsRef = useRef<Map<number, number>>(new Map())
  const scrollElementRef = useRef<HTMLElement | null>(scrollElement || null)

  // Get size for an item (measured or estimated)
  const getSize = useCallback(
    (index: number): number => {
      const measured = measurementsRef.current.get(index)
      if (measured !== undefined) {
        return measured
      }

      return typeof estimateSize === 'function' ? estimateSize(index) : estimateSize
    },
    [estimateSize]
  )

  // Calculate total size of all items
  const totalSize = Array.from({ length: count }, (_, i) => getSize(i)).reduce(
    (sum, size) => sum + size,
    0
  )

  // Calculate which items are visible
  const getVirtualItems = useCallback((): VirtualItem[] => {
    if (count === 0 || viewportHeight === 0) {
      return []
    }

    // Calculate start/end indices
    let rangeStart = 0
    let accumulatedSize = 0

    for (let i = 0; i < count; i++) {
      const size = getSize(i)

      if (accumulatedSize + size > scrollOffset) {
        rangeStart = i
        break
      }

      accumulatedSize += size
    }

    // Add overscan at start
    rangeStart = Math.max(0, rangeStart - overscan)

    // Calculate end index
    let rangeEnd = rangeStart
    accumulatedSize = 0

    for (let i = rangeStart; i < count; i++) {
      accumulatedSize += getSize(i)

      if (accumulatedSize > viewportHeight + overscan * getSize(i)) {
        rangeEnd = i
        break
      }

      rangeEnd = i
    }

    // Add overscan at end
    rangeEnd = Math.min(count - 1, rangeEnd + overscan)

    // Build virtual items
    const items: VirtualItem[] = []
    let currentOffset = 0

    // Calculate offset to rangeStart
    for (let i = 0; i < rangeStart; i++) {
      currentOffset += getSize(i)
    }

    // Create virtual items for visible range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      const size = getSize(i)

      items.push({
        index: i,
        start: currentOffset,
        size,
        end: currentOffset + size,
        key: i,
      })

      currentOffset += size
    }

    if (debug) {
      generalLogger.debug('[Virtualizer] Render range calculated', {
        rangeStart,
        rangeEnd,
        visibleItems: items.length,
        scrollOffset,
        viewportHeight,
        totalSize,
      })
    }

    return items
  }, [count, scrollOffset, viewportHeight, getSize, overscan, debug, totalSize])

  const virtualItems = getVirtualItems()
  const startIndex = virtualItems[0]?.index ?? 0
  const endIndex = virtualItems[virtualItems.length - 1]?.index ?? 0

  // Measure element and update measurements
  const measureElement = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (element) {
        const height = element.offsetHeight

        // Only update if different from current measurement
        const currentMeasurement = measurementsRef.current.get(index)
        if (currentMeasurement !== height) {
          measurementsRef.current.set(index, height)

          if (debug) {
            generalLogger.debug('[Virtualizer] Element measured', {
              index,
              height,
              previousHeight: currentMeasurement,
            })
          }
        }
      }
    },
    [debug]
  )

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, options: { align?: 'start' | 'center' | 'end' } = {}) => {
      const { align = 'start' } = options

      if (!scrollElementRef.current) {
        generalLogger.warn('[Virtualizer] Cannot scroll: scroll element not set')
        return
      }

      // Calculate offset to index
      let offset = 0
      for (let i = 0; i < index; i++) {
        offset += getSize(i)
      }

      // Adjust based on alignment
      if (align === 'center') {
        offset -= viewportHeight / 2 - getSize(index) / 2
      } else if (align === 'end') {
        offset -= viewportHeight - getSize(index)
      }

      // Clamp to valid range
      offset = Math.max(0, Math.min(offset, totalSize - viewportHeight))

      scrollElementRef.current.scrollTo({
        top: offset,
        behavior: 'smooth',
      })

      generalLogger.info('[Virtualizer] Scrolled to index', {
        index,
        offset,
        align,
      })
    },
    [getSize, viewportHeight, totalSize]
  )

  // Setup scroll listener
  useEffect(() => {
    const element = scrollElement || scrollElementRef.current

    if (!element) {
      generalLogger.warn('[Virtualizer] No scroll element provided or ref not set')
      return
    }

    scrollElementRef.current = element

    const handleScroll = () => {
      setScrollOffset(element.scrollTop)
    }

    const handleResize = () => {
      setViewportHeight(element.clientHeight)
    }

    // Initial measurements
    handleScroll()
    handleResize()

    // Add listeners
    element.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [scrollElement])

  return {
    virtualItems,
    totalSize,
    startIndex,
    endIndex,
    measureElement,
    scrollToIndex,
  }
}
