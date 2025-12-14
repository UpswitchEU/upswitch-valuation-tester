/**
 * Recent Reports Section Component
 * 
 * Single Responsibility: Display recent reports in Lovable-style grid layout
 * Handles loading states, empty states, and grid responsiveness
 */

'use client'

import { ArrowRight, FileText } from 'lucide-react'
import type { ValuationSession } from '../../../types/valuation'
import { ReportCard } from './ReportCard'

export interface RecentReportsSectionProps {
  reports: ValuationSession[]
  loading: boolean
  onReportClick: (reportId: string) => void
  onReportDelete: (reportId: string) => void
  onViewAll?: () => void
}

export function RecentReportsSection({
  reports,
  loading,
  onReportClick,
  onReportDelete,
  onViewAll,
}: RecentReportsSectionProps) {
  // Loading skeleton
  if (loading) {
    return (
      <section className="w-full bg-gradient-to-b from-black/5 to-transparent py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-gray-300 animate-pulse rounded" />
            <div className="h-8 w-24 bg-gray-300 animate-pulse rounded" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="p-4 bg-gray-200 animate-pulse h-24" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-300 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-gray-300 animate-pulse rounded w-1/2" />
                  <div className="h-2 bg-gray-300 animate-pulse rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  
  // Empty state
  if (reports.length === 0) {
    return (
      <section className="w-full bg-gradient-to-b from-black/5 to-transparent py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-white">Recent Valuations</h2>
          </div>
          
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white/60" />
            </div>
            <h3 className="text-xl font-medium text-white mb-3">
              No valuations yet
            </h3>
            <p className="text-white/70 mb-6">
              Start your first business valuation to see your reports here.
            </p>
          </div>
        </div>
      </section>
    )
  }
  
  // Reports grid
  return (
    <section className="w-full bg-gradient-to-b from-black/5 to-transparent py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-white">
            Recent Valuations
          </h2>
          
          {onViewAll && reports.length > 8 && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Grid of report cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reports.map((report) => (
            <ReportCard
              key={report.reportId || report.sessionId}
              report={report}
              onClick={() => onReportClick(report.reportId)}
              onDelete={() => onReportDelete(report.reportId)}
            />
          ))}
        </div>
        
        {/* Footer hint */}
        {reports.length > 0 && (
          <p className="text-center text-white/50 text-sm mt-8">
            Showing {Math.min(reports.length, 8)} of {reports.length} valuations
          </p>
        )}
      </div>
    </section>
  )
}
