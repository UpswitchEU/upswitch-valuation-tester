/**
 * Version Timeline Component
 * 
 * Single Responsibility: Display version history timeline
 * Shows v1, v2, v3... with dates, labels, and quick navigation
 * 
 * @module components/VersionTimeline
 */

'use client'

import { Calendar, Check, Pin, Tag } from 'lucide-react'
import type { ValuationVersion } from '../types/ValuationVersion'
import { formatChangesSummary } from '../utils/versionDiffDetection'

export interface VersionTimelineProps {
  versions: ValuationVersion[]
  activeVersion: number
  onVersionSelect: (versionNumber: number) => void
  onVersionPin?: (versionNumber: number) => void
  compact?: boolean
}

/**
 * Version Timeline
 * 
 * Displays chronological version history with:
 * - Version numbers (v1, v2, v3...)
 * - Labels and dates
 * - Change summaries
 * - Active version indicator
 * - Pin functionality
 * 
 * @example
 * ```tsx
 * <VersionTimeline
 *   versions={versions}
 *   activeVersion={3}
 *   onVersionSelect={(v) => loadVersion(v)}
 *   onVersionPin={(v) => pinVersion(v)}
 * />
 * ```
 */
export function VersionTimeline({
  versions,
  activeVersion,
  onVersionSelect,
  onVersionPin,
  compact = false,
}: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No versions yet</p>
        <p className="text-sm mt-2">Versions will appear here after regenerating the valuation</p>
      </div>
    )
  }

  // Sort versions by number (newest first for display)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)

  return (
    <div className="divide-y divide-gray-200">
      {sortedVersions.map((version, index) => (
        <VersionTimelineItem
          key={version.id}
          version={version}
          isActive={version.versionNumber === activeVersion}
          isLatest={index === 0}
          onClick={() => onVersionSelect(version.versionNumber)}
          onPin={onVersionPin ? () => onVersionPin(version.versionNumber) : undefined}
          compact={compact}
        />
      ))}
    </div>
  )
}

/**
 * Version Timeline Item
 * 
 * Individual version entry in timeline.
 */
interface VersionTimelineItemProps {
  version: ValuationVersion
  isActive: boolean
  isLatest: boolean
  onClick: () => void
  onPin?: () => void
  compact?: boolean
}

function VersionTimelineItem({
  version,
  isActive,
  isLatest,
  onClick,
  onPin,
  compact,
}: VersionTimelineItemProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasChanges =
    version.changesSummary &&
    version.changesSummary.totalChanges > 0

  const changeSummaries = hasChanges
    ? formatChangesSummary(
        version.changesSummary,
        version.formData.country_code || 'BE'
      )
    : []

  return (
    <div
      className={`
        p-4 cursor-pointer transition-all duration-200
        ${isActive ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Version info */}
        <div className="flex-1 min-w-0">
          {/* Version number and label */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                inline-flex items-center justify-center
                w-8 h-8 rounded-full text-sm font-semibold
                ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }
              `}
            >
              {version.versionNumber}
            </span>
            <h3
              className={`
                font-semibold truncate
                ${isActive ? 'text-primary-900' : 'text-gray-900'}
              `}
            >
              {version.versionLabel}
            </h3>

            {/* Badges */}
            {isLatest && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Latest
              </span>
            )}
            {version.isPinned && (
              <Pin className="w-4 h-4 text-amber-500" />
            )}
            {isActive && (
              <Check className="w-4 h-4 text-primary-600" />
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(version.createdAt)}</span>
          </div>

          {/* Changes summary */}
          {!compact && hasChanges && changeSummaries.length > 0 && (
            <div className="mt-2 space-y-1">
              {changeSummaries.slice(0, 3).map((change, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <span className="text-gray-500">•</span> {change}
                </p>
              ))}
              {changeSummaries.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{changeSummaries.length - 3} more changes
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {!compact && version.tags && version.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {version.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes preview */}
          {!compact && version.notes && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">
              "{version.notes}"
            </p>
          )}
        </div>

        {/* Right: Actions */}
        {onPin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className={`
              p-2 rounded-lg transition-colors
              ${
                version.isPinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-gray-400 hover:text-gray-600'
              }
            `}
            title={version.isPinned ? 'Unpin version' : 'Pin version'}
          >
            <Pin className={`w-4 h-4 ${version.isPinned ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact Version Selector
 * 
 * Dropdown selector for version navigation.
 * Used in toolbar for quick version switching.
 */
export interface CompactVersionSelectorProps {
  versions: ValuationVersion[]
  activeVersion: number
  onVersionSelect: (versionNumber: number) => void
}

export function CompactVersionSelector({
  versions,
  activeVersion,
  onVersionSelect,
}: CompactVersionSelectorProps) {
  if (versions.length === 0) return null

  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
  const activeVersionData = versions.find((v) => v.versionNumber === activeVersion)

  return (
    <div className="relative">
      <select
        value={activeVersion}
        onChange={(e) => onVersionSelect(parseInt(e.target.value))}
        className="
          px-2 py-1.5 pr-6 rounded-lg border border-zinc-700
          bg-zinc-800 text-gray-200 text-xs font-medium
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          cursor-pointer hover:bg-zinc-750 transition-colors
          appearance-none
        "
        title={`Select version (${versions.length} total)`}
      >
        {sortedVersions.map((version) => (
          <option key={version.id} value={version.versionNumber} className="bg-zinc-800 text-gray-200">
            {version.versionLabel}
            {version.isPinned ? ' 📌' : ''}
          </option>
        ))}
      </select>

      {/* Dropdown icon */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-3 h-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Version Timeline Component
 * 
 * Single Responsibility: Display version history timeline
 * Shows v1, v2, v3... with dates, labels, and quick navigation
 * 
 * @module components/VersionTimeline
 */

'use client'

import { Calendar, Check, Pin, Tag } from 'lucide-react'
import type { ValuationVersion } from '../types/ValuationVersion'
import { formatChangesSummary } from '../utils/versionDiffDetection'

export interface VersionTimelineProps {
  versions: ValuationVersion[]
  activeVersion: number
  onVersionSelect: (versionNumber: number) => void
  onVersionPin?: (versionNumber: number) => void
  compact?: boolean
}

/**
 * Version Timeline
 * 
 * Displays chronological version history with:
 * - Version numbers (v1, v2, v3...)
 * - Labels and dates
 * - Change summaries
 * - Active version indicator
 * - Pin functionality
 * 
 * @example
 * ```tsx
 * <VersionTimeline
 *   versions={versions}
 *   activeVersion={3}
 *   onVersionSelect={(v) => loadVersion(v)}
 *   onVersionPin={(v) => pinVersion(v)}
 * />
 * ```
 */
export function VersionTimeline({
  versions,
  activeVersion,
  onVersionSelect,
  onVersionPin,
  compact = false,
}: VersionTimelineProps) {
  if (versions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No versions yet</p>
        <p className="text-sm mt-2">Versions will appear here after regenerating the valuation</p>
      </div>
    )
  }

  // Sort versions by number (newest first for display)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)

  return (
    <div className="divide-y divide-gray-200">
      {sortedVersions.map((version, index) => (
        <VersionTimelineItem
          key={version.id}
          version={version}
          isActive={version.versionNumber === activeVersion}
          isLatest={index === 0}
          onClick={() => onVersionSelect(version.versionNumber)}
          onPin={onVersionPin ? () => onVersionPin(version.versionNumber) : undefined}
          compact={compact}
        />
      ))}
    </div>
  )
}

/**
 * Version Timeline Item
 * 
 * Individual version entry in timeline.
 */
interface VersionTimelineItemProps {
  version: ValuationVersion
  isActive: boolean
  isLatest: boolean
  onClick: () => void
  onPin?: () => void
  compact?: boolean
}

function VersionTimelineItem({
  version,
  isActive,
  isLatest,
  onClick,
  onPin,
  compact,
}: VersionTimelineItemProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasChanges =
    version.changesSummary &&
    version.changesSummary.totalChanges > 0

  const changeSummaries = hasChanges
    ? formatChangesSummary(
        version.changesSummary,
        version.formData.country_code || 'BE'
      )
    : []

  return (
    <div
      className={`
        p-4 cursor-pointer transition-all duration-200
        ${isActive ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Version info */}
        <div className="flex-1 min-w-0">
          {/* Version number and label */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                inline-flex items-center justify-center
                w-8 h-8 rounded-full text-sm font-semibold
                ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }
              `}
            >
              {version.versionNumber}
            </span>
            <h3
              className={`
                font-semibold truncate
                ${isActive ? 'text-primary-900' : 'text-gray-900'}
              `}
            >
              {version.versionLabel}
            </h3>

            {/* Badges */}
            {isLatest && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Latest
              </span>
            )}
            {version.isPinned && (
              <Pin className="w-4 h-4 text-amber-500" />
            )}
            {isActive && (
              <Check className="w-4 h-4 text-primary-600" />
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(version.createdAt)}</span>
          </div>

          {/* Changes summary */}
          {!compact && hasChanges && changeSummaries.length > 0 && (
            <div className="mt-2 space-y-1">
              {changeSummaries.slice(0, 3).map((change, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <span className="text-gray-500">•</span> {change}
                </p>
              ))}
              {changeSummaries.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{changeSummaries.length - 3} more changes
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {!compact && version.tags && version.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {version.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes preview */}
          {!compact && version.notes && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">
              "{version.notes}"
            </p>
          )}
        </div>

        {/* Right: Actions */}
        {onPin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className={`
              p-2 rounded-lg transition-colors
              ${
                version.isPinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-gray-400 hover:text-gray-600'
              }
            `}
            title={version.isPinned ? 'Unpin version' : 'Pin version'}
          >
            <Pin className={`w-4 h-4 ${version.isPinned ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact Version Selector
 * 
 * Dropdown selector for version navigation.
 * Used in toolbar for quick version switching.
 */
export interface CompactVersionSelectorProps {
  versions: ValuationVersion[]
  activeVersion: number
  onVersionSelect: (versionNumber: number) => void
}

export function CompactVersionSelector({
  versions,
  activeVersion,
  onVersionSelect,
}: CompactVersionSelectorProps) {
  if (versions.length === 0) return null

  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
  const activeVersionData = versions.find((v) => v.versionNumber === activeVersion)

  return (
    <div className="relative">
      <select
        value={activeVersion}
        onChange={(e) => onVersionSelect(parseInt(e.target.value))}
        className="
          px-2 py-1.5 pr-6 rounded-lg border border-zinc-700
          bg-zinc-800 text-gray-200 text-xs font-medium
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          cursor-pointer hover:bg-zinc-750 transition-colors
          appearance-none
        "
        title={`Select version (${versions.length} total)`}
      >
        {sortedVersions.map((version) => (
          <option key={version.id} value={version.versionNumber} className="bg-zinc-800 text-gray-200">
            {version.versionLabel}
            {version.isPinned ? ' 📌' : ''}
          </option>
        ))}
      </select>

      {/* Dropdown icon */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-3 h-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}


