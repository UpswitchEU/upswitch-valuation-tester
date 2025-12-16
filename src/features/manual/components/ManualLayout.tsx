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
import { ValuationForm } from '../../../components/ValuationForm'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { InputFieldsSkeleton } from '../../../components/skeletons'
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
  const { user } = useAuth()
  const { isCalculating, error, result, setResult } = useManualResultsStore()
  const { session, isSaving, lastSaved, hasUnsavedChanges, error: syncError, loadSessionAsync } = useManualSessionStore()
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

  // Restore form data and results from session when it loads
  useEffect(() => {
    if (session?.sessionData) {
      const sessionData = session.sessionData as any
      
      // Restore form data (if exists)
      if (sessionData.company_name || sessionData.revenue) {
        updateFormData(sessionData)
      }

      // Restore results (if exists)
      if (session.valuationResult) {
        setResult(session.valuationResult as any)
      }
    }
  }, [session, updateFormData, setResult])

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
  useEffect(() => {
    // Don't show toast during initial load
    if (isInitialLoadRef.current) {
      return
    }
    
    // Check previous state BEFORE updating ref
    const hadUnsavedChanges = prevHasUnsavedChangesRef.current
    
    // Update ref to track current state for next render
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
  }, [lastSaved, isSaving, syncError, hasUnsavedChanges, showToast])

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
