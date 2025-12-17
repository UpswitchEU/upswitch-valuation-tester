/**
 * Asset Store Factory
 *
 * Generic factory for creating component-level asset stores with:
 * - Loading states (idle, loading, loaded, error)
 * - Data flow tracking (send, receive, idle)
 * - Progress tracking (0-100%)
 * - Timestamps for cache validation
 * - Type-safe with TypeScript generics
 *
 * @module store/assets/createAssetStore
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type AssetStatus = 'idle' | 'loading' | 'loaded' | 'error'
export type AssetMode = 'send' | 'receive' | 'idle'

export interface AssetState<T> {
  data: T | null
  status: AssetStatus
  error: string | null
  progress: number
  mode: AssetMode
  lastSyncedAt: Date | null
  lastModifiedAt: Date | null
}

export interface AssetActions<T> {
  startLoading: () => void
  setData: (data: T) => void
  setError: (error: string) => void
  setProgress: (progress: number) => void
  setMode: (mode: AssetMode) => void
  markSynced: () => void
  markModified: () => void
  reset: () => void
}

export type AssetStore<T> = AssetState<T> & AssetActions<T>

/**
 * Create a typed asset store for a specific data type
 *
 * @param name - Store name for devtools
 * @param initialData - Initial data (usually null)
 * @returns Zustand store with asset management capabilities
 *
 * @example
 * ```typescript
 * const useMyAsset = createAssetStore<MyData>('MyAsset', null)
 *
 * // In component:
 * const data = useMyAsset((state) => state.data)
 * const status = useMyAsset((state) => state.status)
 * const setData = useMyAsset((state) => state.setData)
 * ```
 */
export function createAssetStore<T>(name: string, initialData: T | null = null) {
  return create<AssetStore<T>>()(
    devtools(
      (set) => ({
        // Initial state
        data: initialData,
        status: 'idle',
        error: null,
        progress: 0,
        mode: 'idle',
        lastSyncedAt: null,
        lastModifiedAt: null,

        // Actions
        startLoading: () =>
          set((state) => ({
            ...state,
            status: 'loading',
            error: null,
            progress: 0,
          })),

        setData: (data: T) =>
          set((state) => ({
            ...state,
            data,
            status: 'loaded',
            error: null,
            progress: 100,
            lastModifiedAt: new Date(),
          })),

        setError: (error: string) =>
          set((state) => ({
            ...state,
            error,
            status: 'error',
            progress: 0,
          })),

        setProgress: (progress: number) =>
          set((state) => ({
            ...state,
            progress: Math.min(100, Math.max(0, progress)),
          })),

        setMode: (mode: AssetMode) =>
          set((state) => ({
            ...state,
            mode,
          })),

        markSynced: () =>
          set((state) => ({
            ...state,
            lastSyncedAt: new Date(),
          })),

        markModified: () =>
          set((state) => ({
            ...state,
            lastModifiedAt: new Date(),
          })),

        reset: () =>
          set(() => ({
            data: initialData,
            status: 'idle',
            error: null,
            progress: 0,
            mode: 'idle',
            lastSyncedAt: null,
            lastModifiedAt: null,
          })),
      }),
      { name: `AssetStore:${name}` }
    )
  )
}
