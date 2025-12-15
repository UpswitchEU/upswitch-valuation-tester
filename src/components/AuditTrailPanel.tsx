/**
 * AuditTrailPanel Component
 *
 * Single Responsibility: Display version history timeline with detailed audit information
 * Split layout: Timeline on left/top, details on right/bottom
 *
 * @module components/AuditTrailPanel
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useVersionHistoryStore } from '../store/useVersionHistoryStore'
import { AuditDetailsView } from './AuditDetailsView'
import { VersionTimeline } from './VersionTimeline'

export interface AuditTrailPanelProps {
  reportId: string
  className?: string
}

/**
 * Audit Trail Panel
 *
 * Displays comprehensive audit trail with:
 * - Version timeline (left/top) using existing VersionTimeline component
 * - Detailed audit information (right/bottom) for selected version
 * - Responsive layout (vertical split on desktop, stacked on mobile)
 */
export function AuditTrailPanel({ reportId, className = '' }: AuditTrailPanelProps) {
  const {
    versions: allVersions,
    getActiveVersion,
    setActiveVersion,
    fetchVersions,
    loading,
  } = useVersionHistoryStore()

  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null)

  // Get versions for this report
  const versions = allVersions[reportId] || []
  const activeVersion = getActiveVersion(reportId)

  // Fetch versions on mount
  useEffect(() => {
    if (reportId && versions.length === 0 && !loading) {
      fetchVersions(reportId).catch((error) => {
        console.error('Failed to fetch versions:', error)
      })
    }
  }, [reportId, versions.length, loading, fetchVersions])

  // Auto-select latest version when versions load
  useEffect(() => {
    if (versions.length > 0 && selectedVersionNumber === null) {
      const latestVersion = Math.max(...versions.map((v) => v.versionNumber))
      setSelectedVersionNumber(latestVersion)
    }
  }, [versions, selectedVersionNumber])

  // Handle version selection
  const handleVersionSelect = (versionNumber: number) => {
    setSelectedVersionNumber(versionNumber)
    // Also update the active version in the store for consistency
    setActiveVersion(reportId, versionNumber)
  }

  // Handle version pinning
  const handleVersionPin = (versionNumber: number) => {
    // Pin/unpin functionality would be implemented here
    // For now, we'll just log it
    console.log('Pin version:', versionNumber)
  }

  // Get selected version data
  const selectedVersion = selectedVersionNumber
    ? versions.find((v) => v.versionNumber === selectedVersionNumber)
    : null

  // Loading state
  if (loading && versions.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-zinc-900 ${className}`}>
        <div className="text-center text-gray-400 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-sm">Loading version history...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (versions.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-zinc-900 ${className}`}>
        <div className="text-center text-gray-400 p-8 max-w-md">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Versions Yet</h3>
          <p className="text-sm leading-relaxed">
            Versions are created automatically when you regenerate valuations with updated data.
            Make changes to your valuation inputs and recalculate to create version history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col lg:flex-row h-full overflow-hidden ${className}`}>
      {/* Timeline Panel - Left on desktop, top on mobile */}
      <div className="w-full lg:w-[30%] h-64 lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800 overflow-y-auto bg-zinc-900">
        <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
          <h2 className="text-sm font-semibold text-gray-200">Version History</h2>
          <p className="text-xs text-gray-400 mt-1">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
        </div>
        <VersionTimeline
          versions={versions}
          activeVersion={selectedVersionNumber || activeVersion?.versionNumber || 1}
          onVersionSelect={handleVersionSelect}
          onVersionPin={handleVersionPin}
          compact={false}
        />
      </div>

      {/* Details Panel - Right on desktop, bottom on mobile */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
          <h2 className="text-sm font-semibold text-gray-200">Version Details</h2>
          {selectedVersion && (
            <p className="text-xs text-gray-400 mt-1">
              Viewing {selectedVersion.versionLabel}
            </p>
          )}
        </div>
        <AuditDetailsView version={selectedVersion || null} />
      </div>
    </div>
  )
}

