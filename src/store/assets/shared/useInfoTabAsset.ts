/**
 * Info Tab Asset Store (Shared)
 * 
 * Manages state for the info tab HTML (calculation breakdown).
 * Shared between manual and conversational flows.
 * - Receive mode only: Backend generates info tab
 * 
 * @module store/assets/shared/useInfoTabAsset
 */

import { createAssetStore } from '../createAssetStore'

export interface InfoTabData {
  infoTabHtml: string
  valuationId: string
  generatedAt: Date
}

export const useInfoTabAsset = createAssetStore<InfoTabData>(
  'Shared:InfoTab',
  null
)

// Convenience selectors
export const useInfoTabHtml = () => useInfoTabAsset((state) => state.data?.infoTabHtml)
export const useInfoTabStatus = () => useInfoTabAsset((state) => state.status)
export const useInfoTabError = () => useInfoTabAsset((state) => state.error)
export const useInfoTabProgress = () => useInfoTabAsset((state) => state.progress)

