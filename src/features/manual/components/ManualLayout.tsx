/**
 * ManualLayout Component
 *
 * Main layout component for manual valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/manual/components/ManualLayout
 */

import React, { Suspense, useEffect, useRef } from 'react'
import { AssetInspector } from '../../../components/debug/AssetInspector'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { InputFieldsSkeleton } from '../../../components/skeletons'
import { ValuationForm } from '../../../components/ValuationForm'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import {
  useValuationToolbarFullscreen,
  useValuationToolbarTabs,
  type ValuationTab,
} from '../../../hooks/valuationToolbar'
import { useManualAssetOrchestrator } from '../../../store/assets/manual/useManualAssetOrchestrator'
import { useManualFormStore, useManualResultsStore, useManualSessionStore } from '../../../store/manual'
import type { ValuationResponse } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'
import { ReportPanel } from '../../conversational/components/ReportPanel'
import { useManualPanelResize, useManualToolbar } from '../hooks'
import { MobilePanelSwitcher } from './MobilePanelSwitcher'

/**
 * Manual Layout Component Props
 */
interface ManualLayoutProps {
  /** Unique report identifier */
  reportId: string
  /** Callback when manual valuation completes */
  onComplete: (result: ValuationResponse) => void
  /** Initial version to load (M&A workflow) */
  initialVersion?: number
  /** Initial mode (edit/view) */
  initialMode?: 'edit' | 'view'
}

/**
 * Manual Layout Component
 *
 * Provides 2-panel layout:
 * - Left: Form inputs for manual data entry
 * - Right: Report preview (Preview/Info tabs)
 */
export const ManualLayout: React.FC<ManualLayoutProps> = ({
  reportId,
  onComplete,
  initialVersion,
  initialMode = 'edit',
}) => {
  // EMERGENCY: Render loop detector to prevent tab freeze
  const renderCountRef = useRef(0)
  const renderTimestampRef = useRef(Date.now())
  
  renderCountRef.current += 1
  const now = Date.now()
  
  // Reset counter every 5 seconds
  if (now - renderTimestampRef.current > 5000) {
    renderCountRef.current = 1
    renderTimestampRef.current = now
  }
  
  // If we're rendering more than 100 times in 5 seconds, we have a render loop
  if (renderCountRef.current > 100) {
    generalLogger.error('[ManualLayout] RENDER LOOP DETECTED - Throwing error to break loop', {
      reportId,
      renderCount: renderCountRef.current,
      timeWindow: now - renderTimestampRef.current,
    })
    throw new Error(
      `Render loop detected in ManualLayout (${renderCountRef.current} renders in ${now - renderTimestampRef.current}ms). Please contact support.`
    )
  }
  
  // Log excessive renders
  if (renderCountRef.current > 50) {
    generalLogger.warn('[ManualLayout] High render count detected', {
      reportId,
      renderCount: renderCountRef.current,
    })
  }

  const { user } = useAuth()
  const { isCalculating, error, result, setResult } = useManualResultsStore()
  // CRITICAL: Use optimized selectors to subscribe only to specific fields
  // This prevents re-renders when session object reference changes but data is the same
  const sessionReportId = useManualSessionStore((state) => state.session?.reportId)
  // ⚠️ CRITICAL: Removed ALL other useManualSessionStore subscriptions
  // They were causing 100+ renders. These fields are accessed via getState() in effects instead
  const { updateFormData } = useManualFormStore()
  const { showToast } = useToast()

  // NEW: Asset orchestrator for progressive loading
  const { loadAllAssets, resetAllAssets } = useManualAssetOrchestrator(reportId)

  // CRITICAL: Load and restore session data on mount (Manual flow)
  // Uses flow-isolated stores + asset orchestrator for progressive loading
  // NOTE: Session loading is handled by ValuationSessionManager - this only loads assets
  useEffect(() => {
    if (reportId) {
      // Load all assets in parallel (progressive loading)
      loadAllAssets().catch((error) => {
        generalLogger.error('[Manual] Asset load failed', {
          reportId,
          error: error instanceof Error ? error.message : String(error),
        })
      })

      // Session loading is handled by ValuationSessionManager via Zustand promise cache
      // No need to call loadSessionAsync here - it would be redundant and could cause conflicts
      // The promise cache in the store prevents duplicate loads anyway, but this avoids unnecessary calls
    }

    // Cleanup on unmount
    return () => {
      resetAllAssets()
    }
  }, [reportId, loadAllAssets, resetAllAssets]) // Removed session and loadSessionAsync - session managed by ValuationSessionManager

  // Track if we've already restored data to prevent repeated restorations
  const hasRestoredDataRef = useRef<string | null>(null)
  
  // Restore form data and results from session when it loads
  // ⚠️ CRITICAL FIX: Only depend on sessionReportId to prevent render loop
  // The loop was caused by sessionData/sessionValuationResult changing references
  useEffect(() => {
    // Early return if no session or already restored for this reportId
    if (!sessionReportId || hasRestoredDataRef.current === sessionReportId) {
      return
    }

    // Get current values directly from store (not from selectors that cause re-renders)
    const currentState = useManualSessionStore.getState()
    const sessionDataObj = currentState.session?.sessionData as any
    const sessionValResult = currentState.session?.valuationResult
    
    // Restore form data (if exists and different from current)
    if (sessionDataObj && (sessionDataObj.company_name || sessionDataObj.revenue)) {
      // Get current form data to avoid unnecessary updates
      const currentFormData = useManualFormStore.getState().formData
      const hasChanges = 
        (sessionDataObj.company_name && sessionDataObj.company_name !== currentFormData.company_name) ||
        (sessionDataObj.revenue !== undefined && sessionDataObj.revenue !== currentFormData.revenue)
      
      if (hasChanges) {
        generalLogger.debug('[ManualLayout] Restoring form data from session', {
          reportId: sessionReportId,
        })
        updateFormData(sessionDataObj)
      }
    }

    // Restore results (if exists and different from current)
    if (sessionValResult) {
      const currentResult = useManualResultsStore.getState().result
      // Only update if result is different (compare by valuation_id or structure)
      if (!currentResult || currentResult.valuation_id !== sessionValResult.valuation_id) {
        generalLogger.debug('[ManualLayout] Restoring valuation result from session', {
          reportId: sessionReportId,
        })
        setResult(sessionValResult as any)
      }
    }

    // Mark as restored for this reportId (AFTER all restore operations)
    hasRestoredDataRef.current = sessionReportId
    
    generalLogger.info('[ManualLayout] Session restoration complete', {
      reportId: sessionReportId,
    })
  }, [
    sessionReportId, // ⚠️ ONLY depend on reportId - prevents render loop!
    // updateFormData and setResult are stable, but include for correctness
    updateFormData,
    setResult
  ])
  
  // Reset restoration flag when reportId changes
  useEffect(() => {
    hasRestoredDataRef.current = null
  }, [reportId])

  // Panel resize hook
  const { leftPanelWidth, handleResize, isMobile, mobileActivePanel, setMobileActivePanel } =
    useManualPanelResize()

  // Toolbar hooks
  const { activeTab, handleTabChange: handleHookTabChange } = useValuationToolbarTabs()
  const { handleRefresh, handleDownload, isDownloading } = useManualToolbar({ result })
  const {
    isFullScreen,
    handleOpenFullscreen: handleHookOpenFullscreen,
    handleCloseFullscreen: handleHookCloseFullscreen,
  } = useValuationToolbarFullscreen()

  // Handle valuation completion when result changes
  useEffect(() => {
    if (result) {
      onComplete(result)
    }
  }, [result, onComplete])

  // Track previous hasUnsavedChanges to detect when save happens after user changes
  const prevHasUnsavedChangesRef = useRef<boolean>(false)
  // Track initial load to prevent showing "saved" toast during initialization
  const isInitialLoadRef = useRef<boolean>(true)
  
  // Mark initial load as complete after first render and when session is ready
  useEffect(() => {
    // Wait a bit to ensure initialization is complete
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false
    }, 3000) // 3 seconds should be enough for initialization
    
    return () => clearTimeout(timer)
  }, [])
  
  // Show success toast when save completes (only if there were unsaved changes)
  // ⚠️ CRITICAL FIX: Use Zustand subscribe API to listen for changes without causing re-renders
  // This prevents render loops while still reacting to save state changes
  useEffect(() => {
    let previousState = {
      isSaving: useManualSessionStore.getState().isSaving,
      lastSaved: useManualSessionStore.getState().lastSaved,
      hasUnsavedChanges: useManualSessionStore.getState().hasUnsavedChanges,
      error: useManualSessionStore.getState().error,
    }
    
    // Subscribe to store changes - listener receives the selected state
    // This doesn't cause component re-renders, only triggers our callback
    const unsubscribe = useManualSessionStore.subscribe(
      (state) => {
        // Extract only the fields we care about
        const currentState = {
          isSaving: state.isSaving,
          lastSaved: state.lastSaved,
          hasUnsavedChanges: state.hasUnsavedChanges,
          error: state.error,
        }
        
        // Skip if values haven't actually changed
        if (
          previousState.isSaving === currentState.isSaving &&
          previousState.lastSaved === currentState.lastSaved &&
          previousState.hasUnsavedChanges === currentState.hasUnsavedChanges &&
          previousState.error === currentState.error
        ) {
          return
        }
        
        // Don't show toast during initial load
        if (isInitialLoadRef.current) {
          previousState = currentState
          return
        }
        
        const { isSaving, lastSaved, hasUnsavedChanges, error: syncError } = currentState
        
        // Check previous state BEFORE updating ref
        const hadUnsavedChanges = prevHasUnsavedChangesRef.current
        
        // Update ref to track current state for next check
        prevHasUnsavedChangesRef.current = hasUnsavedChanges
        
        // Only show toast if:
        // 1. Save just completed (lastSaved is recent)
        // 2. There were unsaved changes before the save (hadUnsavedChanges was true)
        // This prevents showing "saved" toast on initial page load when no changes were made
        if (lastSaved && !isSaving && !syncError && hadUnsavedChanges) {
          const timeAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
          // Only show toast for recent saves (within last 2 seconds)
          if (timeAgo < 2) {
            showToast(
              'Valuation report saved successfully! All data has been persisted.',
              'success',
              4000
            )
          }
        }
        
        // Update previous state for next comparison
        previousState = currentState
      }
    )
    
    return unsubscribe
  }, [showToast])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar (Save Status integrated inside toolbar) */}
      <ValuationToolbar
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        onFullScreen={handleHookOpenFullscreen}
        isGenerating={isCalculating || isDownloading}
        user={user}
        valuationName="Valuation"
        valuationId={result?.valuation_id}
        activeTab={activeTab}
        onTabChange={(tab) => {
          handleHookTabChange(tab as 'preview' | 'info' | 'history')
        }}
        companyName={result?.company_name}
      />

      {/* Split Panel */}
      <div
        className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800"
        style={{ transition: 'width 150ms ease-out' }}
      >
        {/* Left Panel: Form */}
        <div
          className={`${
            isMobile ? (mobileActivePanel === 'form' ? 'w-full' : 'hidden') : ''
          } h-full flex flex-col bg-zinc-900 border-r border-zinc-800 w-full lg:w-auto overflow-y-auto`}
          style={{
            width: isMobile ? '100%' : `${leftPanelWidth}%`,
          }}
        >
          <div className="flex-1 p-6">
            {/* ValuationForm - Main form inputs with Suspense boundary */}
            <Suspense fallback={<InputFieldsSkeleton />}>
              <ValuationForm
                initialVersion={initialVersion}
                isRegenerationMode={initialMode === 'edit' && !!initialVersion}
              />
            </Suspense>
          </div>
        </div>

        {/* Resizable Divider */}
        <ResizableDivider onResize={handleResize} leftWidth={leftPanelWidth} isMobile={isMobile} />

        {/* Right Panel: Report Display */}
        <div
          className={`${
            isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
          } h-full min-h-[400px] lg:min-h-0 w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
          style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
        >
          <ReportPanel
            reportId={reportId}
            activeTab={activeTab as 'preview' | 'info' | 'history'}
            onTabChange={(tab: 'preview' | 'info' | 'history') => {
                handleHookTabChange(tab as ValuationTab)
            }}
            isCalculating={isCalculating}
            error={error}
            result={result}
            onClearError={() => {
              const { clearError } = useManualResultsStore.getState()
              clearError()
            }}
          />
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      {isMobile && (
        <MobilePanelSwitcher activePanel={mobileActivePanel} onPanelChange={setMobileActivePanel} />
      )}

      {/* Asset Inspector (dev only) */}
      <AssetInspector />
    </div>
  )
}
