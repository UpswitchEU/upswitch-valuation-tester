/**
 * Conversational Asset Orchestrator
 * 
 * Orchestrates loading and syncing of all conversational flow assets.
 * Handles chat messages, collected data, and shared assets.
 * 
 * Features:
 * - Parallel loading (all assets load concurrently)
 * - Error isolation (one asset failing doesn't block others)
 * - Progress tracking (each asset reports its own progress)
 * - Chat restoration (messages and Python session ID)
 * - Summary generation (collected data display)
 * 
 * @module store/assets/conversational/useConversationalAssetOrchestrator
 */

import { useCallback } from 'react'
import { useConversationalSessionStore, useConversationalResultsStore } from '../../conversational'
import { useChatMessagesAsset } from './useChatMessagesAsset'
import { useSummaryAsset } from './useSummaryAsset'
import { useCollectedDataAsset } from './useCollectedDataAsset'
import { useMainReportAsset } from '../shared/useMainReportAsset'
import { useInfoTabAsset } from '../shared/useInfoTabAsset'
import { useVersionsAsset } from '../shared/useVersionsAsset'
import { useFinalPriceAsset } from '../shared/useFinalPriceAsset'
import { sessionService, versionService } from '../../../services'
import { chatLogger } from '../../../utils/logger'

export function useConversationalAssetOrchestrator(reportId: string) {
  const session = useConversationalSessionStore((state) => state.session)
  const result = useConversationalResultsStore((state) => state.result)

  /**
   * Load all conversational flow assets from backend
   * Progressive loading: Each asset loads independently
   */
  const loadAllAssets = useCallback(async () => {
    chatLogger.info('[AssetOrchestrator:Conversational] Starting asset load', { reportId })

    // Load all assets in parallel for best performance
    await Promise.allSettled([
      loadChatMessagesAsset(reportId),
      loadCollectedDataAsset(reportId),
      loadSummaryAsset(reportId),
      loadMainReportAsset(reportId),
      loadInfoTabAsset(reportId),
      loadVersionsAsset(reportId),
      loadFinalPriceAsset(reportId),
    ])

    chatLogger.info('[AssetOrchestrator:Conversational] Asset load complete', { reportId })
  }, [reportId])

  /**
   * Reset all asset stores (for cleanup)
   */
  const resetAllAssets = useCallback(() => {
    chatLogger.info('[AssetOrchestrator:Conversational] Resetting all assets', { reportId })
    
    useChatMessagesAsset.getState().reset()
    useSummaryAsset.getState().reset()
    useCollectedDataAsset.getState().reset()
    useMainReportAsset.getState().reset()
    useInfoTabAsset.getState().reset()
    useVersionsAsset.getState().reset()
    useFinalPriceAsset.getState().reset()
  }, [reportId])

  /**
   * Optimistically update an asset
   * UI updates immediately, persists in background
   */
  const updateAssetOptimistic = useCallback(async (
    assetType: 'chatMessages' | 'collectedData' | 'summary' | 'mainReport' | 'infoTab' | 'versions' | 'finalPrice',
    data: any
  ) => {
    chatLogger.debug('[AssetOrchestrator:Conversational] Optimistic update started', {
      reportId,
      assetType,
    })

    let store: any
    let previousData: any

    // Get the appropriate store and save previous data
    switch (assetType) {
      case 'chatMessages':
        store = useChatMessagesAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'collectedData':
        store = useCollectedDataAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'summary':
        store = useSummaryAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'mainReport':
        store = useMainReportAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'infoTab':
        store = useInfoTabAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'versions':
        store = useVersionsAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
      case 'finalPrice':
        store = useFinalPriceAsset.getState()
        previousData = store.data
        store.setData(data)
        store.setMode('send')
        break
    }

    try {
      // Background persist (would call appropriate service method)
      // For now, we'll just mark as synced after a delay
      await new Promise(resolve => setTimeout(resolve, 100))
      store.markSynced()
      store.setMode('idle')

      chatLogger.info('[AssetOrchestrator:Conversational] Optimistic update succeeded', {
        reportId,
        assetType,
      })
    } catch (error) {
      // Revert on error
      const message = error instanceof Error ? error.message : 'Update failed'
      store.setData(previousData)
      store.setError(message)
      store.setMode('idle')

      chatLogger.error('[AssetOrchestrator:Conversational] Optimistic update failed, reverted', {
        reportId,
        assetType,
        error: message,
      })
    }
  }, [reportId])

  return {
    loadAllAssets,
    resetAllAssets,
    updateAssetOptimistic,
  }
}

/**
 * Load chat messages and restore conversation
 */
async function loadChatMessagesAsset(reportId: string) {
  const store = useChatMessagesAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    store.setProgress(10)
    
    // Chat messages are restored by ConversationContext/useConversationRestoration
    // This asset store just tracks the state for observability
    // For now, set empty data - actual restoration happens in the conversation context
    store.setData({
      messages: [],
      pythonSessionId: null,
      reportId,
    })
    store.markSynced()
    store.setProgress(100)
    
    chatLogger.debug('[AssetOrchestrator:Conversational] Chat messages asset initialized', { reportId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Chat messages load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load collected data from session
 */
async function loadCollectedDataAsset(reportId: string) {
  const store = useCollectedDataAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    
    const session = await sessionService.loadSession(reportId)
    
    if (session?.sessionData) {
      const data = session.sessionData as any
      const requiredFields = ['company_name', 'industry', 'country_code', 'revenue', 'ebitda']
      const filledFields = requiredFields.filter((field) => {
        if (field === 'revenue' || field === 'ebitda') {
          return data.current_year_data?.[field] !== undefined || data[field] !== undefined
        }
        return !!data[field]
      })
      const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100)
      
      store.setData({
        data,
        completionPercentage,
        lastUpdated: new Date(),
        reportId,
      })
      store.markSynced()
      
      chatLogger.info('[AssetOrchestrator:Conversational] Collected data loaded', {
        reportId,
        completionPercentage,
        fieldsCount: Object.keys(data).length,
      })
    } else {
      // Set empty data instead of null
      store.setData({
        data: {},
        completionPercentage: 0,
        lastUpdated: new Date(),
        reportId,
      })
      chatLogger.debug('[AssetOrchestrator:Conversational] No collected data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Collected data load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load summary data (for summary block display)
 */
async function loadSummaryAsset(reportId: string) {
  const store = useSummaryAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    
    const session = await sessionService.loadSession(reportId)
    
    if (session?.sessionData) {
      const collectedData = session.sessionData as any
      const requiredFields = ['company_name', 'industry', 'country_code', 'revenue', 'ebitda']
      const filledFields = requiredFields.filter((field) => {
        if (field === 'revenue' || field === 'ebitda') {
          return collectedData.current_year_data?.[field] !== undefined || collectedData[field] !== undefined
        }
        return !!collectedData[field]
      })
      const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100)
      
      store.setData({
        collectedData,
        completionPercentage,
        generatedAt: new Date(),
      })
      store.markSynced()
      
      chatLogger.info('[AssetOrchestrator:Conversational] Summary loaded', {
        reportId,
        completionPercentage,
      })
    } else {
      // Set empty data instead of null
      store.setData({
        collectedData: {},
        completionPercentage: 0,
        generatedAt: new Date(),
      })
      chatLogger.debug('[AssetOrchestrator:Conversational] No summary data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Summary load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load main HTML report (shared asset)
 */
async function loadMainReportAsset(reportId: string) {
  const store = useMainReportAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    store.setProgress(10)
    
    const session = await sessionService.loadSession(reportId)
    store.setProgress(50)
    
    if (session?.htmlReport) {
      store.setData({
        htmlReport: session.htmlReport,
        valuationId: session.reportId,
        generatedAt: session.calculatedAt ? new Date(session.calculatedAt) : new Date(),
      })
      store.markSynced()
      
      chatLogger.info('[AssetOrchestrator:Conversational] Main report loaded', {
        reportId,
        size: session.htmlReport.length,
      })
    } else {
      // Don't set data if not available - leave as null
      chatLogger.debug('[AssetOrchestrator:Conversational] No main report data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Main report load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load info tab HTML (shared asset)
 */
async function loadInfoTabAsset(reportId: string) {
  const store = useInfoTabAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    store.setProgress(10)
    
    const session = await sessionService.loadSession(reportId)
    store.setProgress(50)
    
    if (session?.infoTabHtml) {
      store.setData({
        infoTabHtml: session.infoTabHtml,
        valuationId: session.reportId,
        generatedAt: session.calculatedAt ? new Date(session.calculatedAt) : new Date(),
      })
      store.markSynced()
      
      chatLogger.info('[AssetOrchestrator:Conversational] Info tab loaded', {
        reportId,
        size: session.infoTabHtml.length,
      })
    } else {
      // Don't set data if not available - leave as null
      chatLogger.debug('[AssetOrchestrator:Conversational] No info tab data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Info tab load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load version history (shared asset)
 */
async function loadVersionsAsset(reportId: string) {
  const store = useVersionsAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    store.setProgress(10)
    
    const { versions, activeVersion } = await versionService.fetchVersions(reportId)
    store.setProgress(80)
    
    store.setData({ versions, activeVersion, reportId })
    store.markSynced()
    
    chatLogger.info('[AssetOrchestrator:Conversational] Versions loaded', {
      reportId,
      count: versions.length,
      activeVersion,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Versions load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load final price calculations (shared asset)
 */
async function loadFinalPriceAsset(reportId: string) {
  const store = useFinalPriceAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    store.setProgress(10)
    
    const session = await sessionService.loadSession(reportId)
    store.setProgress(50)
    
    if (session?.valuationResult) {
      store.setData({
        equityValueLow: session.valuationResult.equity_value_low || 0,
        equityValueMid: session.valuationResult.equity_value_mid || 0,
        equityValueHigh: session.valuationResult.equity_value_high || 0,
        recommendedAskingPrice: session.valuationResult.recommended_asking_price || 0,
        confidenceScore: session.valuationResult.confidence_score || 0,
        valuationId: session.reportId,
      })
      store.markSynced()
      
      chatLogger.info('[AssetOrchestrator:Conversational] Final price loaded', {
        reportId,
        mid: session.valuationResult.equity_value_mid,
      })
    } else {
      // Don't set data if not available - leave as null
      chatLogger.debug('[AssetOrchestrator:Conversational] No final price data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    chatLogger.error('[AssetOrchestrator:Conversational] Final price load failed', {
      reportId,
      error: message,
    })
  }
}

