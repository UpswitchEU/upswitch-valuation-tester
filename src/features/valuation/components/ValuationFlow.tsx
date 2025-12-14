/**
 * Unified ValuationFlow Component
 *
 * Single Responsibility: Orchestrate data collection and valuation for both manual and conversational flows
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * Unifies ManualValuationFlow and ConversationalValuationFlow into a single component
 * that handles both flow types based on configuration.
 *
 * @module features/valuation/components/ValuationFlow
 */

import React, { lazy, Suspense, useCallback } from 'react'
import { DataResponse } from '../../../components/data-collection'
import { FullScreenModal } from '../../../components/FullScreenModal'
import { useAuth } from '../../../hooks/useAuth'
import {
    useValuationToolbarDownload,
    useValuationToolbarFullscreen,
    useValuationToolbarRefresh,
    useValuationToolbarTabs,
} from '../../../hooks/valuationToolbar'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { ValuationResponse } from '../../../types/valuation'
import { convertDataResponsesToFormData } from '../../../utils/dataCollectionUtils'
import { generalLogger } from '../../../utils/logger'

// Flow types
export type ValuationFlowType = 'manual' | 'conversational'

// Lazy load heavy components for better code splitting
const Results = lazy(() =>
  import('../../../components/Results').then((m) => ({ default: m.Results }))
)

const ConversationalLayout = lazy(() =>
  import('../../conversational/components/ConversationalLayout').then((m) => ({
    default: m.ConversationalLayout,
  }))
)

const ValuationToolbar = lazy(() =>
  import('../../../components/ValuationToolbar').then((m) => ({
    default: m.ValuationToolbar,
  }))
)

const DataCollection = lazy(() =>
  import('../../../components/data-collection').then((m) => ({
    default: m.DataCollection,
  }))
)

// Loading component
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-zinc-600">{message}</span>
    </div>
  </div>
)

interface ValuationFlowProps {
  reportId: string
  flowType: ValuationFlowType
  onComplete: (result: ValuationResponse) => void
  initialQuery?: string | null
  autoSend?: boolean
}

/**
 * Unified Valuation Flow Component
 *
 * Handles both manual form input and conversational AI-assisted valuation flows.
 * Single entry point for all valuation workflows.
 */
export const ValuationFlow: React.FC<ValuationFlowProps> = ({
  reportId,
  flowType,
  onComplete,
  initialQuery = null,
  autoSend = false,
}) => {
  // Render different flow based on type
  if (flowType === 'conversational') {
    return (
      <ConversationalFlow
        reportId={reportId}
        onComplete={onComplete}
        initialQuery={initialQuery}
        autoSend={autoSend}
      />
    )
  }

  // Manual flow
  return <ManualFlow reportId={reportId} onComplete={onComplete} />
}

// Manual flow implementation (extracted from ManualValuationFlow)
interface ManualFlowProps {
  reportId?: string
  onComplete: (result: ValuationResponse) => void
}

const ManualFlow: React.FC<ManualFlowProps> = ({ reportId, onComplete }) => {
  const { result } = useValuationResultsStore()
  const { isCalculating, calculateValuation } = useValuationApiStore()
  const { setCollectedData, updateFormData } = useValuationFormStore()
  const { user } = useAuth()

  // Toolbar hooks
  const { handleRefresh } = useValuationToolbarRefresh()
  const { handleDownload, isDownloading } = useValuationToolbarDownload()
  const { isFullScreen, handleOpenFullscreen, handleCloseFullscreen } =
    useValuationToolbarFullscreen()
  const { activeTab, handleTabChange } = useValuationToolbarTabs({
    initialTab: 'preview',
  })

  // Handle data collection
  const handleDataCollected = useCallback(
    (responses: DataResponse[]) => {
      // Sync collectedData (same as conversational flow)
      setCollectedData(responses)

      // Also update formData for consistency (calculateValuation uses formData)
      const formDataUpdate = convertDataResponsesToFormData(responses)
      if (Object.keys(formDataUpdate).length > 0) {
        updateFormData(formDataUpdate)
      }
    },
    [setCollectedData, updateFormData]
  )

  // Handle collection completion
  const handleCollectionComplete = useCallback(
    async (responses: DataResponse[]) => {
      const formStore = useValuationFormStore.getState()
      
      // Sync collectedData
      formStore.setCollectedData(responses)

      // Also update formData for consistency (calculateValuation uses formData)
      const formDataUpdate = convertDataResponsesToFormData(responses)
      if (Object.keys(formDataUpdate).length > 0) {
        formStore.updateFormData(formDataUpdate)
      }

      // Trigger valuation calculation with collected data
      try {
        await calculateValuation()
      } catch (error) {
        generalLogger.error('Valuation calculation failed', { error, reportId })
      }
    },
    [calculateValuation, reportId]
  )

  // Handle progress updates
  const handleProgressUpdate = useCallback(
    (progress: { overallProgress: number; completedFields: number; totalFields: number }) => {
      generalLogger.debug('Manual flow progress update', {
        progress: progress.overallProgress,
        completedFields: progress.completedFields,
        totalFields: progress.totalFields,
      })
    },
    []
  )

  // Handle download with valuation data
  const handleDownloadClick = useCallback(async () => {
    if (result) {
      await handleDownload({
        companyName: result.company_name || 'Company',
        valuationAmount: result.equity_value_mid,
        valuationDate: new Date(),
        method: 'DCF Analysis',
        confidenceScore: result.confidence_score,
        htmlContent: result.html_report,
      })
    }
  }, [result, handleDownload])

  return (
    <div className="h-full flex flex-col">
      {/* Data Collection Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <Suspense fallback={<ComponentLoader message="Loading data collection..." />}>
        <DataCollection
          method="manual_form"
          onDataCollected={handleDataCollected}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleCollectionComplete}
        />
        </Suspense>
      </div>

      {/* Toolbar */}
      <Suspense fallback={<ComponentLoader message="Loading toolbar..." />}>
        <ValuationToolbar
          onRefresh={handleRefresh}
          onDownload={handleDownloadClick}
          onFullScreen={handleOpenFullscreen}
          isGenerating={isCalculating || isDownloading}
          user={user}
          valuationName="Manual Valuation"
          valuationId={result?.valuation_id}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </Suspense>

      {/* Fullscreen Modal */}
      {isFullScreen && result && (
        <FullScreenModal
          isOpen={isFullScreen}
          onClose={handleCloseFullscreen}
          title="Valuation Report - Full Screen"
        >
          <div className="p-4">
            <div dangerouslySetInnerHTML={{ __html: result.html_report || '' }} />
          </div>
        </FullScreenModal>
      )}

      {/* Results Display */}
      {result && (
        <div className="border-t border-gray-200">
          <Suspense fallback={<ComponentLoader message="Loading results..." />}>
            <Results />
          </Suspense>
        </div>
      )}
    </div>
  )
}

ManualFlow.displayName = 'ManualFlow'
ValuationFlow.displayName = 'ValuationFlow'

// Conversational flow implementation
interface ConversationalFlowProps {
  reportId: string
  onComplete: (result: ValuationResponse) => void
  initialQuery?: string | null
  autoSend?: boolean
}

const ConversationalFlow: React.FC<ConversationalFlowProps> = ({
  reportId,
  onComplete,
  initialQuery = null,
  autoSend = false,
}) => {
  // Handle valuation completion
  const handleValuationComplete = useCallback(
    (result: ValuationResponse) => {
      generalLogger.info('Conversational valuation complete', {
        valuationId: result.valuation_id,
        reportId,
      })
      onComplete(result)
    },
    [onComplete, reportId]
  )

  return (
    <Suspense fallback={<ComponentLoader message="Loading conversational interface..." />}>
      <ConversationalLayout
        reportId={reportId}
        onComplete={handleValuationComplete}
        initialQuery={initialQuery}
        autoSend={autoSend}
      />
    </Suspense>
  )
}

ConversationalFlow.displayName = 'ConversationalFlow'