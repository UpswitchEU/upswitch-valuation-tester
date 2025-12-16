/**
 * Final Price Asset Store (Shared)
 * 
 * Manages state for final price calculations.
 * Shared between manual and conversational flows.
 * - Receive mode only: Backend calculates prices
 * 
 * @module store/assets/shared/useFinalPriceAsset
 */

import { createAssetStore } from '../createAssetStore'

export interface FinalPriceData {
  equityValueLow: number
  equityValueMid: number
  equityValueHigh: number
  recommendedAskingPrice: number
  confidenceScore: number
  valuationId: string
}

export const useFinalPriceAsset = createAssetStore<FinalPriceData>(
  'Shared:FinalPrice',
  null
)

// Convenience selectors
export const useFinalPriceValues = () => useFinalPriceAsset((state) => state.data)
export const useFinalPriceStatus = () => useFinalPriceAsset((state) => state.status)
export const useFinalPriceError = () => useFinalPriceAsset((state) => state.error)
export const useFinalPriceProgress = () => useFinalPriceAsset((state) => state.progress)

