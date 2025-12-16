/**
 * Input Fields Asset Store (Manual Flow)
 * 
 * Manages state for form input fields in manual flow.
 * - Send mode: When creating new report (form → backend)
 * - Receive mode: When restoring report (backend → form)
 * 
 * @module store/assets/manual/useInputFieldsAsset
 */

import { createAssetStore } from '../createAssetStore'
import type { ValuationFormData } from '../../../types/valuation'

export const useInputFieldsAsset = createAssetStore<ValuationFormData>(
  'Manual:InputFields',
  null
)

// Convenience selectors for common use cases
export const useInputFieldsData = () => useInputFieldsAsset((state) => state.data)
export const useInputFieldsStatus = () => useInputFieldsAsset((state) => state.status)
export const useInputFieldsMode = () => useInputFieldsAsset((state) => state.mode)
export const useInputFieldsError = () => useInputFieldsAsset((state) => state.error)
export const useInputFieldsProgress = () => useInputFieldsAsset((state) => state.progress)

