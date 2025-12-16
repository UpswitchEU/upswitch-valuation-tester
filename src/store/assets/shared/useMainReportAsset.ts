/**
 * Main Report Asset Store (Shared)
 * 
 * Manages state for the main HTML report (20-30 pages).
 * Shared between manual and conversational flows.
 * - Receive mode only: Backend generates report
 * 
 * @module store/assets/shared/useMainReportAsset
 */

import { createAssetStore } from '../createAssetStore'

export interface MainReportData {
  htmlReport: string
  valuationId: string
  generatedAt: Date
}

export const useMainReportAsset = createAssetStore<MainReportData>(
  'Shared:MainReport',
  null
)

// Convenience selectors
export const useMainReportHtml = () => useMainReportAsset((state) => state.data?.htmlReport)
export const useMainReportStatus = () => useMainReportAsset((state) => state.status)
export const useMainReportError = () => useMainReportAsset((state) => state.error)
export const useMainReportProgress = () => useMainReportAsset((state) => state.progress)

