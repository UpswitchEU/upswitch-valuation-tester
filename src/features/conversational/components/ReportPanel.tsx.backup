/**
 * ReportPanel Component
 *
 * Single Responsibility: Display valuation reports in tabbed interface (Preview/Source/Info)
 * SOLID Principles: SRP - Only handles report display and tab management
 *
 * @module features/conversational/components/ReportPanel
 */

import { Edit3 } from 'lucide-react'
import React, { Suspense, useContext, useState } from 'react'
import { AuditLogPanel } from '../../../components/AuditLogPanel'
import { HTMLView } from '../../../components/HTMLView'
import { LoadingState } from '../../../components/LoadingState'
import { GENERATION_STEPS } from '../../../components/LoadingState.constants'
import { Results } from '../../../components/results'
import { ValuationInfoPanel } from '../../../components/ValuationInfoPanel'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { ConversationContext } from '../context/ConversationContext'

/**
 * Safe hook to get conversation state (works with or without ConversationProvider)
 */
const useOptionalConversationState = () => {
  const context = useContext(ConversationContext)
  // Return default state if ConversationProvider is not available (manual flow)
  if (!context) {
    return { isGenerating: false }
  }
  return context.state
}

/**
 * ReportPanel Props
 */
export interface ReportPanelProps {
  className?: string
  activeTab?: 'preview' | 'source' | 'info' | 'history'
  onTabChange?: (tab: 'preview' | 'source' | 'info' | 'history') => void
}

/**
 * Loading component for lazy-loaded components
 */
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-zinc-600">{message}</span>
    </div>
  </div>
)

/**
 * Empty State Component for Preview Tab
 */
const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 hover:scale-110">
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
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 hover:scale-110">
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
  const [internalActiveTab, setInternalActiveTab] = useState<'preview' | 'source' | 'info' | 'history'>('preview')

  // Use external tab state if provided, otherwise use internal
  const activeTab = externalActiveTab ?? internalActiveTab
  const handleTabChange = externalOnTabChange ?? setInternalActiveTab

  // Get result from results store (same as manual flow)
  const { result } = useValuationResultsStore()
  const { isCalculating } = useValuationApiStore()
  const conversationState = useOptionalConversationState()
  const { session } = useValuationSessionStore()

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

        {/* History Tab (M&A Workflow - Audit Trail) */}
        {activeTab === 'history' && (
          <div className="h-full">
            {session?.reportId ? (
              <AuditLogPanel reportId={session.reportId} countryCode={session.partialData?.country_code || 'BE'} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3 sm:mb-4">
                  <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-ink">No audit trail available</h3>
                <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
                  Start a valuation to see change history and audit logs
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

        {activeTab === 'history' && (
          <div className="h-full">
            {session?.reportId ? (
              <AuditLogPanel reportId={session.reportId} countryCode={session.partialData?.country_code || 'BE'} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-canvas">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3 sm:mb-4">
                  <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-ink">No audit trail available</h3>
                <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
                  Start a valuation to see change history and audit logs
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
