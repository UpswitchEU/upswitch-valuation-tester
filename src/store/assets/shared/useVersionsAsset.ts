/**
 * Versions Asset Store (Shared)
 * 
 * Manages state for version history.
 * Shared between manual and conversational flows.
 * - Receive mode only: Backend provides version list
 * 
 * @module store/assets/shared/useVersionsAsset
 */

import { createAssetStore } from '../createAssetStore'
import type { ValuationVersion } from '../../../types/ValuationVersion'

export interface VersionsData {
  versions: ValuationVersion[]
  activeVersion: number | null
  reportId: string
}

export const useVersionsAsset = createAssetStore<VersionsData>(
  'Shared:Versions',
  null
)

// Convenience selectors
export const useVersionsList = () => useVersionsAsset((state) => state.data?.versions || [])
export const useActiveVersion = () => useVersionsAsset((state) => state.data?.activeVersion)
export const useVersionsStatus = () => useVersionsAsset((state) => state.status)
export const useVersionsError = () => useVersionsAsset((state) => state.error)
export const useVersionsProgress = () => useVersionsAsset((state) => state.progress)

