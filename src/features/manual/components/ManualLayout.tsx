/**
 * ManualLayout Component
 *
 * Main layout component for manual valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/manual/components/ManualLayout
 */

import React, { useCallback, useEffect, useState } from 'react'
import { ResizableDivider } from '../../../components/ResizableDivider'
import { ValuationForm } from '../../../components/ValuationForm'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../../../constants/panelConstants'
import { useAuth } from '../../../hooks/useAuth'
import {
    useValuationToolbarDownload,
    useValuationToolbarFullscreen,
    useValuationToolbarRefresh,
    useValuationToolbarTabs,
} from '../../../hooks/valuationToolbar'
import { RefreshService } from '../../../services/toolbar/refreshService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { ValuationResponse } from '../../../types/valuation'
import { generateReportId } from '../../../utils/reportIdGenerator'
import { ReportPanel } from '../../conversational/components/ReportPanel'

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
}) => {
  const { user } = useAuth()
  const { isCalculating } = useValuationApiStore()
  const { result, setResult } = useValuationResultsStore()
  const { isSaving, lastSaved, hasUnsavedChanges, syncError } = useValuationSessionStore()

  // Panel width state - load from localStorage or use default (30% matches pre-merge UI)
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('upswitch-panel-width')
      if (saved) {
        const parsed = parseFloat(saved)
        if (
          !isNaN(parsed) &&
          parsed >= PANEL_CONSTRAINTS.MIN_WIDTH &&
          parsed <= PANEL_CONSTRAINTS.MAX_WIDTH
        ) {
          return parsed
        }
      }
    } catch (error) {
      // Ignore localStorage errors
    }
    return PANEL_CONSTRAINTS.DEFAULT_WIDTH // 30% default
  })
  const [isMobile, setIsMobile] = useState(false)
  const [mobileActivePanel, setMobileActivePanel] = useState<'form' | 'preview'>('form')

  // Toolbar hooks
  const { activeTab, handleTabChange: handleHookTabChange } = useValuationToolbarTabs()
  const { handleRefresh: handleHookRefresh } = useValuationToolbarRefresh()
  const { handleDownload: handleHookDownload, isDownloading } = useValuationToolbarDownload()
  const {
    isFullScreen,
    handleOpenFullscreen: handleHookOpenFullscreen,
    handleCloseFullscreen: handleHookCloseFullscreen,
  } = useValuationToolbarFullscreen()

  // Save panel width to localStorage
  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString())
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }, [leftPanelWidth, isMobile])

  // Responsive handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      if (mobile) {
        setLeftPanelWidth(100)
      } else {
        // Restore saved width or use default (30%)
        try {
          const saved = localStorage.getItem('upswitch-panel-width')
          if (saved) {
            const parsed = parseFloat(saved)
            if (
              !isNaN(parsed) &&
              parsed >= PANEL_CONSTRAINTS.MIN_WIDTH &&
              parsed <= PANEL_CONSTRAINTS.MAX_WIDTH
            ) {
              setLeftPanelWidth(parsed)
              return
            }
          }
        } catch (error) {
          // Ignore localStorage errors
        }
        setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH) // 30% default
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Panel resize handler
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(
      PANEL_CONSTRAINTS.MIN_WIDTH,
      Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth)
    )
    if (isMobile) {
      // On mobile, switching panels
      setMobileActivePanel(newWidth > 50 ? 'preview' : 'form')
    } else {
      setLeftPanelWidth(constrainedWidth)
    }
  }, [isMobile])

  // Toolbar handlers
  const handleRefresh = useCallback(() => {
    const newReportId = generateReportId()
    RefreshService.navigateTo(UrlGeneratorService.reportById(newReportId))
    handleHookRefresh()
  }, [handleHookRefresh])

  const handleDownload = useCallback(async () => {
    const currentResult = result || useValuationResultsStore.getState().result
    if (currentResult && currentResult.html_report) {
      await handleHookDownload({
        companyName: currentResult.company_name || 'Company',
        valuationAmount: currentResult.equity_value_mid,
        valuationDate: new Date(),
        method: currentResult.methodology || 'DCF Analysis',
        confidenceScore: currentResult.confidence_score,
        htmlContent: currentResult.html_report || '',
      })
    }
  }, [result, handleHookDownload])

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
        <ResizableDivider
          onResize={handleResize}
          leftWidth={leftPanelWidth}
          isMobile={isMobile}
        />

        {/* Right Panel: Report Display */}
        <div
          className={`${
            isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
          } h-full min-h-[400px] lg:min-h-0 w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
          style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
        >
          <ReportPanel 
            activeTab={activeTab as 'preview' | 'source' | 'info'} 
            onTabChange={(tab) => {
              if (tab !== 'history') {
                handleHookTabChange(tab as 'preview' | 'source' | 'info')
              }
            }} 
          />
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-zinc-800 p-1 rounded-full shadow-lg z-50">
          <button
            onClick={() => setMobileActivePanel('form')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mobileActivePanel === 'form'
                ? 'bg-primary-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Form
          </button>
          <button
            onClick={() => setMobileActivePanel('preview')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              mobileActivePanel === 'preview'
                ? 'bg-primary-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      )}
    </div>
  )
}
