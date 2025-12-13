/**
 * Progress Tracking Hook
 *
 * Manages valuation progress through predefined steps.
 * Extracted from StreamingChat to improve reusability and testability.
 */

import { useCallback, useState } from 'react'

export interface ProgressItem {
  id: string
  label: string
  status: 'completed' | 'in_progress' | 'pending'
}

const DEFAULT_PROGRESS_ITEMS: ProgressItem[] = [
  { id: 'company', label: 'Company Information', status: 'pending' },
  { id: 'revenue', label: 'Revenue Data', status: 'pending' },
  { id: 'profitability', label: 'Profitability Metrics', status: 'pending' },
  { id: 'growth', label: 'Growth Trends', status: 'pending' },
  { id: 'market', label: 'Market Position', status: 'pending' },
  { id: 'assets', label: 'Assets & Liabilities', status: 'pending' },
  { id: 'industry', label: 'Industry Benchmarks', status: 'pending' },
]

/**
 * Hook for managing progress tracking
 */
export const useProgressTracking = (initialItems: ProgressItem[] = DEFAULT_PROGRESS_ITEMS) => {
  const [items, setItems] = useState<ProgressItem[]>(initialItems)

  const updateProgress = useCallback((id: string, status: ProgressItem['status']) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }, [])

  const markCompleted = useCallback(
    (id: string) => {
      updateProgress(id, 'completed')
    },
    [updateProgress]
  )

  const markInProgress = useCallback(
    (id: string) => {
      updateProgress(id, 'in_progress')
    },
    [updateProgress]
  )

  const markPending = useCallback(
    (id: string) => {
      updateProgress(id, 'pending')
    },
    [updateProgress]
  )

  const resetProgress = useCallback(() => {
    setItems(initialItems)
  }, [initialItems])

  const getProgressPercentage = useCallback(() => {
    const completed = items.filter((item) => item.status === 'completed').length
    return Math.round((completed / items.length) * 100)
  }, [items])

  const getCompletedCount = useCallback(() => {
    return items.filter((item) => item.status === 'completed').length
  }, [items])

  const getInProgressCount = useCallback(() => {
    return items.filter((item) => item.status === 'in_progress').length
  }, [items])

  const getPendingCount = useCallback(() => {
    return items.filter((item) => item.status === 'pending').length
  }, [items])

  return {
    items,
    updateProgress,
    markCompleted,
    markInProgress,
    markPending,
    resetProgress,
    getProgressPercentage,
    getCompletedCount,
    getInProgressCount,
    getPendingCount,
  }
}
