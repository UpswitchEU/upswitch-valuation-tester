/**
 * Version Timeline Component
 *
 * Single Responsibility: Display version history timeline
 * Shows v1, v2, v3... with dates, labels, and quick navigation
 *
 * @module components/VersionTimeline
 */

'use client'

import { ArrowDown, ArrowUp, Calendar, Check, ChevronDown, ChevronRight, Minus, Pin, Tag, User } from 'lucide-react'
import { useState } from 'react'
import type { ValuationVersion } from '../types/ValuationVersion'
import { formatCurrency } from '../config/countries'
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
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-medium">No versions yet</p>
        <p className="text-sm mt-2">Versions will appear here after regenerating the valuation</p>
      </div>
    )
  }

  // Sort versions by number (newest first for display)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Timeline connector */}
      <div className="relative">
        {sortedVersions.map((version, index) => (
          <div key={version.id} className="relative pb-8">
            {/* Vertical line connector (except for last item) */}
            {index < sortedVersions.length - 1 && (
              <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            <VersionTimelineItem
              version={version}
              previousVersion={index < sortedVersions.length - 1 ? sortedVersions[index + 1] : null}
              isActive={version.versionNumber === activeVersion}
              isLatest={index === 0}
              onClick={() => onVersionSelect(version.versionNumber)}
              onPin={onVersionPin ? () => onVersionPin(version.versionNumber) : undefined}
              compact={compact}
            />
          </div>
        ))}
      </div>
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
  previousVersion: ValuationVersion | null
  isActive: boolean
  isLatest: boolean
  onClick: () => void
  onPin?: () => void
  compact?: boolean
}

function VersionTimelineItem({
  version,
  previousVersion,
  isActive,
  isLatest,
  onClick,
  onPin,
  compact,
}: VersionTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Get valuation amounts
  const currentValuation = (version.valuationResult as any)?.valuation_summary?.final_valuation ||
                           (version.valuationResult as any)?.value ||
                           (version.valuationResult as any)?.equity_value_mid || 0
  const previousValuation = (previousVersion?.valuationResult as any)?.valuation_summary?.final_valuation ||
                            (previousVersion?.valuationResult as any)?.value ||
                            (previousVersion?.valuationResult as any)?.equity_value_mid || null
  
  // Calculate price difference
  let priceChange = 0
  let priceChangePercent = 0
  if (previousValuation !== null && previousValuation > 0) {
    priceChange = currentValuation - previousValuation
    priceChangePercent = ((currentValuation - previousValuation) / previousValuation) * 100
  }

  const countryCode = version.formData.country_code || 'BE'

  // Get author info
  const author = version.createdBy === 'guest' ? 'Guest User' : 
                 version.createdBy ? `User ${version.createdBy.substring(0, 8)}...` : 
                 'System'

  const hasChanges = version.changesSummary && version.changesSummary.totalChanges > 0
  const changeSummaries = hasChanges
    ? formatChangesSummary(version.changesSummary, countryCode)
    : []

  return (
    <div
      className={`
        relative transition-all duration-200 rounded-lg
        ${isActive ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'}
      `}
    >
      <div 
        className="flex gap-4 p-6 cursor-pointer"
        onClick={onClick}
      >
        {/* Timeline dot */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              ${isActive ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-white border-2 border-gray-300 text-gray-700'}
            `}
          >
            v{version.versionNumber}
          </div>
          {isLatest && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {version.versionLabel}
                </h3>
                {isActive && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                    Active
                  </span>
                )}
              </div>
              
              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(version.createdAt)}</span>
                </div>
                {isLatest && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Latest
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
                        ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  title={version.isPinned ? 'Unpin version' : 'Pin version'}
                >
                  <Pin className={`w-4 h-4 ${version.isPinned ? 'fill-current' : ''}`} />
                </button>
              )}
              
              {/* Expand/Collapse button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Valuation amount */}
          <div className="flex items-baseline gap-3 mb-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Final Valuation</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentValuation, countryCode)}
              </div>
            </div>
            
            {/* Price change indicator */}
            {previousValuation !== null && priceChange !== 0 ? (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {priceChange > 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : priceChange < 0 ? (
                  <ArrowDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                <span>
                  {formatCurrency(Math.abs(priceChange), countryCode)} 
                  ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
                </span>
              </div>
            ) : previousValuation === null && !isLatest ? (
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                Initial version
              </span>
            ) : null}
          </div>

          {/* Changes summary */}
          {!compact && hasChanges && changeSummaries.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Key Changes:</p>
              <div className="space-y-1.5">
                {changeSummaries.slice(0, 3).map((change, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{change}</span>
                  </div>
                ))}
                {changeSummaries.length > 3 && (
                  <p className="text-sm text-gray-500 ml-4">
                    +{changeSummaries.length - 3} more changes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {!compact && version.notes && (
            <div className="mt-3 p-3 bg-amber-50 border-l-2 border-amber-400 rounded">
              <p className="text-sm text-gray-700 italic">"{version.notes}"</p>
            </div>
          )}

          {/* Tags */}
          {!compact && version.tags && version.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {version.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Details Section */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-0 ml-14 space-y-4 border-t border-gray-200 mt-4">
          {/* Valuation Breakdown */}
          {version.valuationResult && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Valuation Details</h4>
              <div className="grid grid-cols-2 gap-3">
                {version.valuationResult.valuation_summary && typeof version.valuationResult.valuation_summary === 'object' && (
                  <>
                    {(version.valuationResult.valuation_summary as any).base_valuation && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Base Valuation</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency((version.valuationResult.valuation_summary as any).base_valuation, countryCode)}
                        </p>
                      </div>
                    )}
                    {(version.valuationResult.valuation_summary as any).adjustments_total !== undefined && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Total Adjustments</p>
                        <p className={`text-sm font-semibold ${
                          (version.valuationResult.valuation_summary as any).adjustments_total >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {(version.valuationResult.valuation_summary as any).adjustments_total >= 0 ? '+' : ''}
                          {formatCurrency((version.valuationResult.valuation_summary as any).adjustments_total, countryCode)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {version.formData.current_year_data?.revenue && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Revenue</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(version.formData.current_year_data.revenue, countryCode)}
                  </p>
                </div>
              )}
              {version.formData.current_year_data?.ebitda !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">EBITDA</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(version.formData.current_year_data.ebitda, countryCode)}
                  </p>
                </div>
              )}
              {version.formData.number_of_employees && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Employees</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {version.formData.number_of_employees}
                  </p>
                </div>
              )}
              {version.formData.number_of_owners && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Owners</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {version.formData.number_of_owners}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Business Information</h4>
            <div className="space-y-2 text-sm">
              {version.formData.company_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium text-gray-900">{version.formData.company_name}</span>
                </div>
              )}
              {version.formData.industry && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="font-medium text-gray-900">{version.formData.industry}</span>
                </div>
              )}
              {version.formData.business_type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Business Type:</span>
                  <span className="font-medium text-gray-900">{version.formData.business_type}</span>
                </div>
              )}
              {version.formData.country_code && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium text-gray-900">{version.formData.country_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Calculation Info */}
          {version.calculationDuration_ms && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Calculation Time:</span>
                <span className="font-semibold text-blue-700">
                  {(version.calculationDuration_ms / 1000).toFixed(2)}s
                </span>
              </div>
            </div>
          )}

          {/* Initial Version Message */}
          {!previousVersion && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                This is the initial version. No previous version to compare against.
              </p>
            </div>
          )}
        </div>
      )}
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
          <option
            key={version.id}
            value={version.versionNumber}
            className="bg-zinc-800 text-gray-200"
          >
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
