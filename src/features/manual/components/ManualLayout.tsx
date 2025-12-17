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
import { useManualFormStore, useManualResultsStore } from '../../../store/manual'
import { useSessionStore } from '../../../store/useSessionStore'
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
  
  // Log excessive renders (synchronous warning is fine)
  if (renderCountRef.current > 50) {
    generalLogger.warn('[ManualLayout] High render count detected', {
      reportId,
      renderCount: renderCountRef.current,
    })
  }
  
  // Check for render loop asynchronously to avoid inconsistent state during render
  useEffect(() => {
    if (renderCountRef.current > 100) {
      const timeWindow = performance.now() - renderTimestampRef.current
      generalLogger.error('[ManualLayout] RENDER LOOP DETECTED - Throwing error to break loop', {
        reportId,
        renderCount: renderCountRef.current,
        timeWindow,
      })
      // Throw asynchronously via setTimeout to ensure error boundary catches it properly
      setTimeout(() => {
        throw new Error(
          `Render loop detected in ManualLayout (${renderCountRef.current} renders in ${timeWindow.toFixed(0)}ms). Please contact support.`
        )
      }, 0)
    }
  })

  const { user } = useAuth()
  const { isCalculating, error, result, setResult } = useManualResultsStore()
  const { updateFormData, formData } = useManualFormStore()
  const { showToast } = useToast()

  // Unified store: Simple subscriptions (2 total)
  const session = useSessionStore((state) => state.session)
  const sessionReportId = session?.reportId
  
  // Track restoration to prevent loops
  const restorationRef = useRef<{
    lastRestoredReportId: string | null
    lastRestoredFormDataHash: string | null
    lastRestoredResultId: string | null
    isRestoring: boolean
  }>({
    lastRestoredReportId: null,
    lastRestoredFormDataHash: null,
    lastRestoredResultId: null,
    isRestoring: false,
  })
  
  // Helper to create a simple hash of form data for comparison
  const getFormDataHash = (data: any): string => {
    if (!data) return ''
    // Create hash from key fields that indicate meaningful data
    const key = `${data.company_name || ''}_${data.revenue || ''}_${data.industry || ''}_${data.founding_year || ''}`
    return key
  }
  
  // Simple restoration: Read directly from session when it changes
  useEffect(() => {
    if (!session || session.reportId !== reportId) {
      restorationRef.current.isRestoring = false
      return
    }

    // Prevent concurrent restoration
    if (restorationRef.current.isRestoring) {
      return
    }

    // Only restore once per session load (when reportId changes)
    const shouldRestore = restorationRef.current.lastRestoredReportId !== reportId

    if (!shouldRestore) {
      return
    }

    // Mark as restoring to prevent re-entry
    restorationRef.current.isRestoring = true

    try {
      // Restore form data
      if (session.sessionData) {
        const sessionDataObj = session.sessionData as any
        if (sessionDataObj.company_name || sessionDataObj.revenue) {
          const formDataHash = getFormDataHash(sessionDataObj)
          const currentFormDataHash = getFormDataHash(formData)
          
          // Only restore if data is actually different from current form data
          // and we haven't already restored this exact data
          if (formDataHash !== currentFormDataHash && formDataHash !== restorationRef.current.lastRestoredFormDataHash) {
            generalLogger.debug('[ManualLayout] Restoring form data', { reportId })
            restorationRef.current.lastRestoredFormDataHash = formDataHash
            updateFormData(sessionDataObj)
          }
        }
      }

      // Restore results
      if (session.valuationResult) {
        const currentResult = useManualResultsStore.getState().result
        const resultId = session.valuationResult.valuation_id
        
        // Only restore if result is different and we haven't restored this one already
        if ((!currentResult || currentResult.valuation_id !== resultId) && 
            resultId !== restorationRef.current.lastRestoredResultId) {
          generalLogger.debug('[ManualLayout] Restoring result', { reportId })
          restorationRef.current.lastRestoredResultId = resultId
          setResult(session.valuationResult as any)
        }
      }
      
      // Mark this reportId as restored
      restorationRef.current.lastRestoredReportId = reportId
    } finally {
      // Always clear restoring flag, even if there's an error
      restorationRef.current.isRestoring = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReportId, reportId])  // Only trigger when reportId changes, not when session object changes

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

  // Simplified save toast: Subscribe to unified store
  useEffect(() => {
    let lastSavedTime: Date | null = null
    
    const unsubscribe = useSessionStore.subscribe((state) => {
      // Show toast when save completes
      if (state.lastSaved && state.lastSaved !== lastSavedTime && !state.isSaving) {
        lastSavedTime = state.lastSaved
        showToast('Valuation saved successfully', 'success', 3000)
      }
    })
    
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
