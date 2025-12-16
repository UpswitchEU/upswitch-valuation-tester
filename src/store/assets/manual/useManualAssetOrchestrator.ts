/**
 * Manual Asset Orchestrator
 * 
 * Orchestrates loading and syncing of all manual flow assets.
 * Each asset loads independently for progressive UX.
 * 
 * Features:
 * - Parallel loading (all assets load concurrently)
 * - Error isolation (one asset failing doesn't block others)
 * - Progress tracking (each asset reports its own progress)
 * - Observable state (can track exactly which asset is loading/failed)
 * 
 * @module store/assets/manual/useManualAssetOrchestrator
 */

import { useCallback } from 'react'
import { useManualSessionStore, useManualResultsStore } from '../../manual'
import { useInputFieldsAsset } from './useInputFieldsAsset'
import { useMainReportAsset } from '../shared/useMainReportAsset'
import { useInfoTabAsset } from '../shared/useInfoTabAsset'
import { useVersionsAsset } from '../shared/useVersionsAsset'
import { useFinalPriceAsset } from '../shared/useFinalPriceAsset'
import { sessionService, versionService } from '../../../services'
import { generalLogger } from '../../../utils/logger'

export function useManualAssetOrchestrator(reportId: string) {
  const session = useManualSessionStore((state) => state.session)
  const result = useManualResultsStore((state) => state.result)

  /**
   * Load all manual flow assets from backend
   * Progressive loading: Each asset loads independently
   */
  const loadAllAssets = useCallback(async () => {
    generalLogger.info('[AssetOrchestrator:Manual] Starting asset load', { reportId })

    // Load all assets in parallel for best performance
    // Each asset handles its own loading state
    await Promise.allSettled([
      loadInputFieldsAsset(reportId),
      loadMainReportAsset(reportId),
      loadInfoTabAsset(reportId),
      loadVersionsAsset(reportId),
      loadFinalPriceAsset(reportId),
    ])

    generalLogger.info('[AssetOrchestrator:Manual] Asset load complete', { reportId })
  }, [reportId])

  /**
   * Reset all asset stores (for cleanup)
   */
  const resetAllAssets = useCallback(() => {
    generalLogger.info('[AssetOrchestrator:Manual] Resetting all assets', { reportId })
    
    useInputFieldsAsset.getState().reset()
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
    assetType: 'inputFields' | 'mainReport' | 'infoTab' | 'versions' | 'finalPrice',
    data: any
  ) => {
    generalLogger.debug('[AssetOrchestrator:Manual] Optimistic update started', {
      reportId,
      assetType,
    })

    let store: any
    let previousData: any

    // Get the appropriate store and save previous data
    switch (assetType) {
      case 'inputFields':
        store = useInputFieldsAsset.getState()
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

      generalLogger.info('[AssetOrchestrator:Manual] Optimistic update succeeded', {
        reportId,
        assetType,
      })
    } catch (error) {
      // Revert on error
      const message = error instanceof Error ? error.message : 'Update failed'
      store.setData(previousData)
      store.setError(message)
      store.setMode('idle')

      generalLogger.error('[AssetOrchestrator:Manual] Optimistic update failed, reverted', {
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
 * Load input fields from session_data
 */
async function loadInputFieldsAsset(reportId: string) {
  const store = useInputFieldsAsset.getState()
  
  try {
    store.startLoading()
    store.setMode('receive')
    
    const session = await sessionService.loadSession(reportId)
    
    if (session?.sessionData) {
      store.setData(session.sessionData as any)
      store.markSynced()
      generalLogger.info('[AssetOrchestrator:Manual] Input fields loaded', { reportId })
    } else {
      // Don't set data if not available - leave as null
      generalLogger.debug('[AssetOrchestrator:Manual] No input fields data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    generalLogger.error('[AssetOrchestrator:Manual] Input fields load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load main HTML report
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
      generalLogger.info('[AssetOrchestrator:Manual] Main report loaded', {
        reportId,
        size: session.htmlReport.length,
      })
    } else {
      // Don't set data if not available - leave as null
      generalLogger.debug('[AssetOrchestrator:Manual] No main report data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    generalLogger.error('[AssetOrchestrator:Manual] Main report load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load info tab HTML
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
      generalLogger.info('[AssetOrchestrator:Manual] Info tab loaded', {
        reportId,
        size: session.infoTabHtml.length,
      })
    } else {
      // Don't set data if not available - leave as null
      generalLogger.debug('[AssetOrchestrator:Manual] No info tab data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    generalLogger.error('[AssetOrchestrator:Manual] Info tab load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load version history
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
    
    generalLogger.info('[AssetOrchestrator:Manual] Versions loaded', {
      reportId,
      count: versions.length,
      activeVersion,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    generalLogger.error('[AssetOrchestrator:Manual] Versions load failed', {
      reportId,
      error: message,
    })
  }
}

/**
 * Load final price calculations
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
      
      generalLogger.info('[AssetOrchestrator:Manual] Final price loaded', {
        reportId,
        mid: session.valuationResult.equity_value_mid,
      })
    } else {
      // Don't set data if not available - leave as null
      generalLogger.debug('[AssetOrchestrator:Manual] No final price data', { reportId })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load failed'
    store.setError(message)
    generalLogger.error('[AssetOrchestrator:Manual] Final price load failed', {
      reportId,
      error: message,
    })
  }
}

