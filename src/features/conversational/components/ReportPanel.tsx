/**
 * ReportPanel Component
 *
<<<<<<< HEAD
 * Displays valuation reports with tabbed interface (preview/source/info).
 * Single Responsibility: Report display and tab management.
=======
<<<<<<< HEAD
 * Displays valuation reports with tabbed interface (preview/source/info).
 * Single Responsibility: Report display and tab management.
=======
 * Single Responsibility: Display valuation reports in tabbed interface (Preview/Source/Info)
 * SOLID Principles: SRP - Only handles report display and tab management
>>>>>>> refactor-gtm
>>>>>>> refactor-gtm
 *
 * @module features/conversational/components/ReportPanel
 */

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> refactor-gtm
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
<<<<<<< HEAD
=======
=======
import { Edit3 } from 'lucide-react'
import React, { Suspense, useState } from 'react'
import { Results } from '../../../components'
import { HTMLView } from '../../../components/HTMLView'
import { LoadingState } from '../../../components/LoadingState'
import { GENERATION_STEPS } from '../../../components/LoadingState.constants'
import { ValuationInfoPanel } from '../../../components/ValuationInfoPanel'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useConversationState } from '../context/ConversationContext'

/**
 * ReportPanel Props
 */
export interface ReportPanelProps {
  className?: string
  activeTab?: 'preview' | 'source' | 'info'
  onTabChange?: (tab: 'preview' | 'source' | 'info') => void
}

/**
 * Loading component for lazy-loaded components
 */
>>>>>>> refactor-gtm
>>>>>>> refactor-gtm
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-zinc-600">{message}</span>
    </div>
  </div>
)

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> refactor-gtm
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
<<<<<<< HEAD
=======
=======
/**
 * Empty State Component for Preview Tab
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary-50 flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 hover:scale-110">
      <svg
        className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Reports will appear here</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      Complete the conversation to generate your valuation report
    </p>
  </div>
)

/**
 * Empty State Component for Info Tab
 */
const EmptyStateWithEdit3Icon: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary-50 flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 hover:scale-110">
      <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Calculation details will appear here</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      Complete the valuation to see detailed calculation breakdowns
    </p>
  </div>
)

/**
 * ReportPanel Component
 *
 * Displays valuation reports in a tabbed interface matching the manual flow.
 * Uses the same components (Results, HTMLView, ValuationInfoPanel) for consistency.
 */
export const ReportPanel: React.FC<ReportPanelProps> = ({
  className = '',
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
}) => {
  // Internal tab state (used if external props not provided)
  const [internalActiveTab, setInternalActiveTab] = useState<'preview' | 'source' | 'info'>('preview')

  // Use external tab state if provided, otherwise use internal
  const activeTab = externalActiveTab ?? internalActiveTab
  const handleTabChange = externalOnTabChange ?? setInternalActiveTab

  // Get result from results store (same as manual flow)
  const { result } = useValuationResultsStore()
  const { isCalculating } = useValuationApiStore()
  const conversationState = useConversationState()

  // Determine if generating (from API store or conversation context)
  const isGenerating = isCalculating || conversationState.isGenerating

  return (
    <div className={`h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-hidden w-full lg:w-auto border-t lg:border-t-0 border-zinc-800 ${className}`}>
      <div className="flex-1 overflow-y-auto">
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="h-full">
            {result?.html_report ? (
              <Suspense fallback={<ComponentLoader message="Loading report..." />}>
                <Results />
              </Suspense>
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        {/* Source Tab */}
        {activeTab === 'source' && (
          <div className="h-full">
            {result ? (
              <HTMLView result={result} />
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="h-full">
            {isGenerating ? (
              <LoadingState steps={GENERATION_STEPS} variant="light" centered={true} />
            ) : result ? (
              <Suspense fallback={<ComponentLoader message="Loading calculation details..." />}>
                <ValuationInfoPanel result={result} />
              </Suspense>
            ) : (
              <EmptyStateWithEdit3Icon />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
>>>>>>> refactor-gtm
>>>>>>> refactor-gtm
