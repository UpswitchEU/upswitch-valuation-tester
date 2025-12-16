/**
 * Asset Stores - Central Export
 * 
 * Component-level asset management stores for:
 * - Manual flow assets (input fields)
 * - Conversational flow assets (chat, summary, collected data)
 * - Shared assets (reports, versions, final price)
 * 
 * @module store/assets
 */

// Factory
export { createAssetStore } from './createAssetStore'
export type { AssetStatus, AssetMode, AssetState, AssetActions, AssetStore } from './createAssetStore'

// Manual Flow Assets
export { useInputFieldsAsset, useInputFieldsData, useInputFieldsStatus, useInputFieldsMode, useInputFieldsError, useInputFieldsProgress } from './manual/useInputFieldsAsset'

// Conversational Flow Assets
export { useChatMessagesAsset, useChatMessages, useChatSessionId, useChatMessagesStatus, useChatMessagesError, useChatMessagesProgress } from './conversational/useChatMessagesAsset'
export { useSummaryAsset, useSummaryCollectedData, useSummaryCompletion, useSummaryStatus, useSummaryError, useSummaryProgress } from './conversational/useSummaryAsset'
export { useCollectedDataAsset, useCollectedData, useCollectedDataCompletion, useCollectedDataStatus, useCollectedDataError, useCollectedDataProgress } from './conversational/useCollectedDataAsset'

// Shared Assets
export { useMainReportAsset, useMainReportHtml, useMainReportStatus, useMainReportError, useMainReportProgress } from './shared/useMainReportAsset'
export { useInfoTabAsset, useInfoTabHtml, useInfoTabStatus, useInfoTabError, useInfoTabProgress } from './shared/useInfoTabAsset'
export { useVersionsAsset, useVersionsList, useActiveVersion, useVersionsStatus, useVersionsError, useVersionsProgress } from './shared/useVersionsAsset'
export { useFinalPriceAsset, useFinalPriceValues, useFinalPriceStatus, useFinalPriceError, useFinalPriceProgress } from './shared/useFinalPriceAsset'

// Type exports
export type { MainReportData } from './shared/useMainReportAsset'
export type { InfoTabData } from './shared/useInfoTabAsset'
export type { VersionsData } from './shared/useVersionsAsset'
export type { FinalPriceData } from './shared/useFinalPriceAsset'
export type { ChatMessagesData } from './conversational/useChatMessagesAsset'
export type { SummaryData } from './conversational/useSummaryAsset'
export type { CollectedDataInfo } from './conversational/useCollectedDataAsset'

