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
import { useAuth } from '../../../hooks/useAuth'
import { useValuationStore } from '../../../store/useValuationStore'
import type { ValuationResponse } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'

// Flow types
export type ValuationFlowType = 'manual' | 'conversational'

// Lazy load heavy components for better code splitting
const Results = lazy(() =>
  import('../../../components/Results').then((m) => ({ default: m.Results }))
)

const ConversationalLayout = lazy(() =>
  import('../../conversational-valuation/components/ConversationalLayout').then((m) => ({
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
      <Suspense fallback={<ComponentLoader message="Loading conversational flow..." />}>
        <ConversationalLayout
          reportId={reportId}
          onComplete={onComplete}
          initialQuery={initialQuery}
          autoSend={autoSend}
        />
      </Suspense>
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
  const { result, isCalculating, calculateValuation, setCollectedData } = useValuationStore()
  const { user } = useAuth()

  // Handle data collection
  const handleDataCollected = useCallback(
    (responses: DataResponse[]) => {
      setCollectedData(responses)
    },
    [setCollectedData]
  )

  // Handle collection completion
  const handleCollectionComplete = useCallback(
    async (responses: DataResponse[]) => {
      setCollectedData(responses)

      // Trigger valuation calculation with collected data
      try {
        await calculateValuation()
      } catch (error) {
        generalLogger.error('Valuation calculation failed', { error, reportId })
      }
    },
    [setCollectedData, calculateValuation, reportId]
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
          onRefresh={() => window.location.reload()}
        onDownload={async () => {
          if (result) {
            try {
              // Lazy load heavy PDF library only when needed
              const { DownloadService } = await import('../../../services/downloadService')
              await DownloadService.downloadPDF(result, {
                format: 'pdf',
                filename: `valuation-${Date.now()}.pdf`,
              })
            } catch (error) {
              generalLogger.error('PDF download failed', { error, reportId })
            }
          }
        }}
          onFullScreen={() => {
            /* TODO: Implement full screen */
          }}
          isGenerating={isCalculating}
          user={user}
          valuationName="Manual Valuation"
          valuationId={result?.valuation_id}
          activeTab="preview"
          onTabChange={() => {
            /* Single tab for now */
          }}
        />
      </Suspense>

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
