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
          {activeTab === 'preview' && (
            <div className="h-full">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Report preview will be displayed here</p>
              </div>
            </div>
          )}

          {/* Source Tab */}
          {activeTab === 'source' && (
            <div className="h-full">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">HTML source will be displayed here</p>
              </div>
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="h-full">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Valuation info will be displayed here</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="h-full">
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Audit history will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

ReportPanel.displayName = 'ReportPanel'
