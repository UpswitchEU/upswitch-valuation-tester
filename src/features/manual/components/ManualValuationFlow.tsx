import React, { lazy, Suspense, useState } from 'react'
import {
    DataCollection,
    DataResponse
} from '../../../components/data-collection'
import { ValuationToolbar } from '../../../components/ValuationToolbar'
import { useAuth } from '../../../hooks/useAuth'
import { useValuationStore } from '../../../store/useValuationStore'
import { convertDataResponsesToFormData } from '../../../utils/dataCollectionUtils'
import { generalLogger } from '../../../utils/logger'

// Lazy load results component
const Results = lazy(() => import('../../../components/Results').then((m) => ({ default: m.Results })))

// Loading component
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
)

import type { ValuationResponse } from '../../../types/valuation'

interface ManualValuationFlowProps {
  reportId?: string
  onComplete: (result: ValuationResponse) => void
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = ({
  reportId,
  onComplete,
}) => {
  const { result, isCalculating, calculateValuation, updateFormData } = useValuationStore()
  const { user } = useAuth()
  const [_collectedData, setCollectedData] = useState<DataResponse[]>([])

  // Handle data collection
  const handleDataCollected = (responses: DataResponse[]) => {
    setCollectedData(responses)

    // Convert responses to form data format using shared utility
    const formData = convertDataResponsesToFormData(responses)

    // Update valuation store with collected data
    updateFormData(formData)
  }

  // Handle collection completion
  const handleCollectionComplete = async (responses: DataResponse[]) => {
    // Convert responses to form data format using shared utility
    const formData = convertDataResponsesToFormData(responses)

    // Update valuation store with final collected data
    updateFormData(formData)

    // Trigger valuation calculation with collected data
    try {
      const valuationResult = await calculateValuation()
      if (valuationResult) {
        onComplete(valuationResult)
      }
    } catch (error) {
      generalLogger.error('Valuation calculation failed', { error, reportId })
    }
  }

  // Handle progress updates
  const handleProgressUpdate = (
    progress: { overallProgress: number; completedFields: number; totalFields: number }
  ) => {
    generalLogger.debug('Manual flow progress update', {
      progress: progress.overallProgress,
      completedFields: progress.completedFields,
      totalFields: progress.totalFields,
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Data Collection Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <DataCollection
          method="manual_form"
          onDataCollected={handleDataCollected}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleCollectionComplete}
        />
      </div>

      {/* Toolbar */}
      <ValuationToolbar
        onRefresh={() => window.location.reload()}
        onDownload={async () => {
          if (result) {
            try {
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
