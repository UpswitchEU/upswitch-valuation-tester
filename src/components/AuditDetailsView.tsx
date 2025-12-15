/**
 * AuditDetailsView Component
 *
 * Single Responsibility: Display detailed audit information for a selected version
 * Shows field changes, statistics, and metadata
 *
 * @module components/AuditDetailsView
 */

'use client'

import { ArrowDownRight, ArrowUpRight, Calendar, Clock, Tag, User } from 'lucide-react'
import type { ValuationVersion } from '../types/ValuationVersion'
import { formatCurrency } from '../utils/formatters'

export interface AuditDetailsViewProps {
  version: ValuationVersion | null
  className?: string
}

/**
 * Audit Details View
 *
 * Displays comprehensive information about a selected version:
 * - Version header (number, label, date, creator)
 * - Field-level changes with old/new values and percent changes
 * - Statistics summary
 * - Metadata (tags, notes)
 */
export function AuditDetailsView({ version, className = '' }: AuditDetailsViewProps) {
  if (!version) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-400 p-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Select a Version</h3>
          <p className="text-sm">Choose a version from the timeline to view its details</p>
        </div>
      </div>
    )
  }

  const countryCode = version.formData.country_code || 'BE'
  const hasChanges = version.changesSummary && version.changesSummary.totalChanges > 0

  return (
    <div className={`h-full overflow-y-auto bg-zinc-900 ${className}`}>
      <div className="p-6 space-y-6">
        {/* Version Header */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white text-lg font-bold">
                  {version.versionNumber}
                </span>
                <h2 className="text-xl font-semibold text-gray-200">{version.versionLabel}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(version.createdAt)}</span>
                </div>
                {version.createdBy && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{version.createdBy === 'guest' ? 'Guest User' : 'User'}</span>
                  </div>
                )}
                {version.calculationDuration_ms && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{(version.calculationDuration_ms / 1000).toFixed(2)}s</span>
                  </div>
                )}
              </div>
            </div>
            {version.isActive && (
              <span className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                Active
              </span>
            )}
          </div>

          {/* Tags */}
          {version.tags && version.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-700">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {version.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-zinc-700 text-gray-300 rounded border border-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {version.notes && (
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <p className="text-sm text-gray-300 italic">"{version.notes}"</p>
            </div>
          )}
        </div>

        {/* Statistics Card */}
        {hasChanges && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Change Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Changes</p>
                <p className="text-2xl font-bold text-gray-200">
                  {version.changesSummary.totalChanges}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Significant Changes</p>
                <p className="text-2xl font-bold text-amber-400">
                  {version.changesSummary.significantChanges.length}
                </p>
              </div>
            </div>
            {version.changesSummary.significantChanges.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-xs text-gray-400 mb-2">Significant Fields (&gt;10% change):</p>
                <div className="flex flex-wrap gap-1.5">
                  {version.changesSummary.significantChanges.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 text-xs bg-amber-500/10 text-amber-400 rounded border border-amber-500/20"
                    >
                      {formatFieldLabel(field)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Field Changes */}
        {hasChanges && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Field Changes</h3>
            <div className="space-y-3">
              {renderFieldChanges(version.changesSummary, countryCode)}
            </div>
          </div>
        )}

        {/* Empty state for no changes */}
        {!hasChanges && version.versionNumber === 1 && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">
              This is the initial version. No previous version to compare against.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Format timestamp for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format field name to readable label
 */
function formatFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    revenue: 'Revenue',
    ebitda: 'EBITDA',
    totalAssets: 'Total Assets',
    totalDebt: 'Total Debt',
    cash: 'Cash',
    companyName: 'Company Name',
    foundingYear: 'Founding Year',
    numberOfEmployees: 'Employees',
    numberOfOwners: 'Owners',
    businessTypeId: 'Business Type',
    countryCode: 'Country',
  }
  return labels[field] || field
}

/**
 * Format numeric value for display
 */
function formatValue(value: any, field: string, countryCode: string): string {
  if (value === null || value === undefined) return 'N/A'
  
  // Numeric fields
  if (['revenue', 'ebitda', 'totalAssets', 'totalDebt', 'cash'].includes(field)) {
    return formatCurrency(value)
  }
  
  // Year field
  if (field === 'foundingYear') {
    return value.toString()
  }
  
  // Count fields
  if (['numberOfEmployees', 'numberOfOwners'].includes(field)) {
    return value.toLocaleString()
  }
  
  // Default string representation
  return String(value)
}

/**
 * Render all field changes
 */
function renderFieldChanges(changes: any, countryCode: string) {
  const fields = [
    'revenue',
    'ebitda',
    'totalAssets',
    'totalDebt',
    'cash',
    'companyName',
    'foundingYear',
    'numberOfEmployees',
    'numberOfOwners',
    'businessTypeId',
    'countryCode',
  ]

  const changeElements = []

  for (const field of fields) {
    const change = changes[field]
    if (change) {
      const isSignificant = changes.significantChanges.includes(field)
      changeElements.push(
        <FieldChangeRow
          key={field}
          field={field}
          change={change}
          countryCode={countryCode}
          isSignificant={isSignificant}
        />
      )
    }
  }

  return changeElements.length > 0 ? (
    changeElements
  ) : (
    <p className="text-gray-400 text-sm text-center py-4">No field changes detected</p>
  )
}

/**
 * Field Change Row Component
 */
interface FieldChangeRowProps {
  field: string
  change: {
    from: any
    to: any
    percentChange?: number
  }
  countryCode: string
  isSignificant: boolean
}

function FieldChangeRow({ field, change, countryCode, isSignificant }: FieldChangeRowProps) {
  const hasPercentChange = change.percentChange !== undefined && change.percentChange !== null
  const isIncrease = hasPercentChange && change.percentChange! > 0
  const isDecrease = hasPercentChange && change.percentChange! < 0

  return (
    <div
      className={`p-3 rounded-lg border ${
        isSignificant
          ? 'bg-amber-500/5 border-amber-500/20'
          : 'bg-zinc-900 border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-sm font-medium text-gray-200">{formatFieldLabel(field)}</h4>
            {isSignificant && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                Significant
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">{formatValue(change.from, field, countryCode)}</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-200 font-medium">
              {formatValue(change.to, field, countryCode)}
            </span>
          </div>
        </div>
        {hasPercentChange && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isIncrease ? 'text-green-400' : isDecrease ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {isIncrease && <ArrowUpRight className="w-4 h-4" />}
            {isDecrease && <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(change.percentChange!).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

