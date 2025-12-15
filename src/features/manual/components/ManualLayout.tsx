/**
 * ManualLayout Component
 *
 * Main layout component for manual valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/manual/components/ManualLayout
 */

import React, { useEffect } from 'react'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationForm } from '../../../components/ValuationForm'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { useAuth } from '../../../hooks/useAuth'
import {
  useValuationToolbarFullscreen,
  useValuationToolbarTabs,
  type ValuationTab,
} from '../../../hooks/valuationToolbar'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import type { ValuationResponse } from '../../../types/valuation'
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
 * - Right: Report preview (Preview/Source/Info tabs)
 */
export const ManualLayout: React.FC<ManualLayoutProps> = ({
  reportId,
  onComplete,
  initialVersion,
  initialMode = 'edit',
}) => {
  const { user } = useAuth()
  const { isCalculating, error } = useValuationApiStore()
  const { result, setResult } = useValuationResultsStore()
  const { isSaving, lastSaved, hasUnsavedChanges, syncError } = useValuationSessionStore()

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
          if (tab !== 'history') {
            handleHookTabChange(tab as 'preview' | 'source' | 'info')
          }
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
            {/* ValuationForm - Main form inputs */}
            <ValuationForm
              initialVersion={initialVersion}
              isRegenerationMode={initialMode === 'edit' && !!initialVersion}
            />
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
            activeTab={activeTab as 'preview' | 'source' | 'info'}
            onTabChange={(tab: 'preview' | 'source' | 'info' | 'history') => {
              if (tab !== 'history') {
                handleHookTabChange(tab as ValuationTab)
              } else {
                // History tab not supported in manual flow - ignore
              }
            }}
            isCalculating={isCalculating}
            error={error}
            result={result}
          />
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      {isMobile && (
        <MobilePanelSwitcher activePanel={mobileActivePanel} onPanelChange={setMobileActivePanel} />
      )}
    </div>
  )
}
