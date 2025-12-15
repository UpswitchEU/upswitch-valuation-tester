/**
 * ReportPanel Component
 *
 * Single Responsibility: Display valuation reports in tabbed interface (Preview/Source/Info)
 * SOLID Principles: SRP - Only handles report display and tab management
 *
 * @module features/conversational/components/ReportPanel
 */

import React from 'react'

interface ReportPanelProps {
  className?: string
  activeTab?: 'preview' | 'source' | 'info' | 'history'
  onTabChange?: (tab: 'preview' | 'source' | 'info' | 'history') => void
}

/**
 * Empty State Component for Preview Tab
 */
const PreviewEmptyState: React.FC = () => (
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
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Your valuation report</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      Complete the conversation to generate your personalized valuation report with detailed insights and analysis
    </p>
  </div>
)

/**
 * Empty State Component for Source Tab
 */
const SourceEmptyState: React.FC = () => (
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
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Report source code</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      View the raw HTML markup and styling of your generated report for customization or integration
    </p>
  </div>
)

/**
 * Empty State Component for Info Tab
 */
const InfoEmptyState: React.FC = () => (
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Calculation breakdown</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      View detailed methodology, assumptions, and step-by-step calculations used in your valuation
    </p>
  </div>
)

/**
 * Empty State Component for History Tab
 */
const HistoryEmptyState: React.FC = () => (
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-ink">Version history</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed">
      Track all changes, revisions, and iterations of your valuation report with full audit trail
    </p>
  </div>
)

/**
 * ReportPanel Component
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders when props haven't changed
 */
export const ReportPanel: React.FC<ReportPanelProps> = React.memo(
  ({ className = '', activeTab = 'preview', onTabChange }) => {
    return (
      <div
        className={`h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-hidden w-full lg:w-auto border-t lg:border-t-0 border-zinc-800 ${className}`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Preview Tab */}
          {activeTab === 'preview' && <PreviewEmptyState />}

          {/* Source Tab */}
          {activeTab === 'source' && <SourceEmptyState />}

          {/* Info Tab */}
          {activeTab === 'info' && <InfoEmptyState />}

          {/* History Tab */}
          {activeTab === 'history' && <HistoryEmptyState />}
        </div>
      </div>
    )
  }
)

ReportPanel.displayName = 'ReportPanel'
