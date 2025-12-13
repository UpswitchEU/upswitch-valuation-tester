/**
 * ReportPanel Component
 *
 * Displays valuation reports with tabbed interface (preview/source/info).
 * Single Responsibility: Report display and tab management.
 *
 * @module features/conversational/components/ReportPanel
 */

import { Edit3, TrendingUp } from 'lucide-react'
import React, { Suspense, useState } from 'react'
import { HTMLView } from '../../../components/HTMLView'
import { LoadingState } from '../../../components/LoadingState'
import { GENERATION_STEPS } from '../../../components/LoadingState.constants'
import { ValuationEmptyState } from '../../../components/ValuationEmptyState'
import { useConversationState } from '../context/ConversationContext'

const ValuationInfoPanel = React.lazy(() =>
  import('../../../components/ValuationInfoPanel').then((m) => ({ default: m.ValuationInfoPanel }))
)

const Results = React.lazy(() =>
  import('../../../components/Results').then((m) => ({ default: m.Results }))
)

// Loader component for Suspense fallback
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-zinc-600">{message}</span>
    </div>
  </div>
)

interface ReportPanelProps {
  className?: string
}

/**
 * Report Panel Component
 *
 * Handles report display with tabbed interface.
 * Follows SRP - only responsible for report presentation.
 */
export const ReportPanel: React.FC<ReportPanelProps> = React.memo(({ className = '' }) => {
  const state = useConversationState()
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview')

  const renderTabContent = () => {
    const hasValuationResult = !!state.valuationResult?.html_report
    const isGenerating = state.isGenerating

    switch (activeTab) {
      case 'preview':
        return (
          <div className="h-full">
            {/* During conversation: Show empty state */}
            {!hasValuationResult && !isGenerating && (
              <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">
                  Valuation Preview
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                  Your valuation report will appear here once the conversation is complete.
                </p>
              </div>
            )}

            {/* After conversation: Show Results component */}
            {hasValuationResult ? (
              <Suspense fallback={<ComponentLoader message="Loading report..." />}>
                <Results />
              </Suspense>
            ) : isGenerating ? (
              <ValuationEmptyState />
            ) : null}
          </div>
        )

      case 'source':
        return <HTMLView result={state.valuationResult} />

      case 'info':
        return (
          <div className="h-full">
            {/* Show loading state during generation */}
            {state.isGenerating ? (
              <LoadingState steps={GENERATION_STEPS} variant="light" centered={true} />
            ) : state.valuationResult ? (
              <Suspense fallback={<ComponentLoader message="Loading calculation details..." />}>
                <ValuationInfoPanel result={state.valuationResult} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                  <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">
                  Calculation Details
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                  Detailed calculation breakdown will appear here once the conversation is complete.
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-hidden ${className}`}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200">
        {[
          { id: 'preview', label: 'Preview' },
          { id: 'source', label: 'Source' },
          { id: 'info', label: 'Info' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'preview' | 'source' | 'info')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
    </div>
  )
})

ReportPanel.displayName = 'ReportPanel'
