/**
 * Version Comparison Modal Component
 * 
 * Single Responsibility: Display side-by-side version comparison
 * Critical for M&A workflow - compare valuations before/after discoveries
 * 
 * @module components/VersionComparisonModal
 */

'use client'

import { ArrowRight, TrendingDown, TrendingUp, X } from 'lucide-react'
import { formatCurrency } from '../config/countries'
import type { VersionComparison } from '../types/ValuationVersion'

export interface VersionComparisonModalProps {
  comparison: VersionComparison
  onClose: () => void
  onUseVersion?: (versionNumber: number) => void
}

/**
 * Version Comparison Modal
 * 
 * Shows side-by-side comparison of two versions with:
 * - Version metadata
 * - Field-by-field differences
 * - Valuation impact
 * - Highlighted significant changes
 * 
 * @example
 * ```tsx
 * <VersionComparisonModal
 *   comparison={comparisonResult}
 *   onClose={() => setShowComparison(false)}
 *   onUseVersion={(v) => loadVersion(v)}
 * />
 * ```
 */
export function VersionComparisonModal({
  comparison,
  onClose,
  onUseVersion,
}: VersionComparisonModalProps) {
  const { versionA, versionB, changes, valuationDelta, highlights } = comparison

  const countryCode = versionB.formData.country_code || 'BE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Compare Versions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {versionA.versionLabel} vs {versionB.versionLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Valuation Impact (if available) */}
          {valuationDelta && (
            <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Impact</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Previous Valuation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (typeof versionA.valuationResult === 'object' && versionA.valuationResult 
                        ? (versionA.valuationResult as any).valuation_summary?.final_valuation 
                        : null) || 0,
                      countryCode
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRight className="w-8 h-8 text-primary-600" />
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">New Valuation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (typeof versionB.valuationResult === 'object' && versionB.valuationResult 
                        ? (versionB.valuationResult as any).valuation_summary?.final_valuation 
                        : null) || 0,
                      countryCode
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div
                    className={`
                      px-4 py-2 rounded-lg font-semibold text-lg
                      ${
                        valuationDelta.direction === 'increase'
                          ? 'bg-green-100 text-green-700'
                          : valuationDelta.direction === 'decrease'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {valuationDelta.direction === 'increase' && (
                      <TrendingUp className="w-5 h-5 inline mr-2" />
                    )}
                    {valuationDelta.direction === 'decrease' && (
                      <TrendingDown className="w-5 h-5 inline mr-2" />
                    )}
                    {valuationDelta.percentChange > 0 ? '+' : ''}
                    {valuationDelta.percentChange.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Absolute change */}
              <div className="mt-4 pt-4 border-t border-primary-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Change: </span>
                  {valuationDelta.absoluteChange > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(valuationDelta.absoluteChange), countryCode)}
                </p>
              </div>
            </div>
          )}

          {/* Highlights (significant changes) */}
          {highlights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Changes</h3>
              <div className="space-y-3">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.field}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{highlight.label}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">
                            {String(highlight.oldValue)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {String(highlight.newValue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                          {highlight.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed field comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Field-by-Field Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Version A */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {versionA.versionNumber}
                  </span>
                  {versionA.versionLabel}
                </h4>
                <div className="space-y-2 text-sm">
                  <FieldRow
                    label="Revenue"
                    value={versionA.formData.current_year_data?.revenue}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="EBITDA"
                    value={versionA.formData.current_year_data?.ebitda}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="Assets"
                    value={versionA.formData.current_year_data?.total_assets}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="Debt"
                    value={versionA.formData.current_year_data?.total_debt}
                    countryCode={countryCode}
                  />
                  <FieldRow label="Employees" value={versionA.formData.number_of_employees} />
                  <FieldRow label="Owners" value={versionA.formData.number_of_owners} />
                </div>
              </div>

              {/* Version B */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {versionB.versionNumber}
                  </span>
                  {versionB.versionLabel}
                </h4>
                <div className="space-y-2 text-sm">
                  <FieldRow
                    label="Revenue"
                    value={versionB.formData.current_year_data?.revenue}
                    countryCode={countryCode}
                    isChanged={!!changes.revenue}
                  />
                  <FieldRow
                    label="EBITDA"
                    value={versionB.formData.current_year_data?.ebitda}
                    countryCode={countryCode}
                    isChanged={!!changes.ebitda}
                  />
                  <FieldRow
                    label="Assets"
                    value={versionB.formData.current_year_data?.total_assets}
                    countryCode={countryCode}
                    isChanged={!!changes.totalAssets}
                  />
                  <FieldRow
                    label="Debt"
                    value={versionB.formData.current_year_data?.total_debt}
                    countryCode={countryCode}
                    isChanged={!!changes.totalDebt}
                  />
                  <FieldRow
                    label="Employees"
                    value={versionB.formData.number_of_employees}
                    isChanged={!!changes.numberOfEmployees}
                  />
                  <FieldRow
                    label="Owners"
                    value={versionB.formData.number_of_owners}
                    isChanged={!!changes.numberOfOwners}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {changes.totalChanges} field{changes.totalChanges === 1 ? '' : 's'} changed
          </p>
          <div className="flex items-center gap-3">
            {onUseVersion && (
              <>
                <button
                  onClick={() => onUseVersion(versionA.versionNumber)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Use v{versionA.versionNumber}
                </button>
                <button
                  onClick={() => onUseVersion(versionB.versionNumber)}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Use v{versionB.versionNumber}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Field row in comparison
 */
function FieldRow({
  label,
  value,
  countryCode,
  isChanged = false,
}: {
  label: string
  value?: number
  countryCode?: string
  isChanged?: boolean
}): React.ReactElement {
  let displayText = 'N/A'
  if (value != null) {
    if (countryCode && value > 1000) {
      displayText = formatCurrency(value, countryCode)
    } else {
      displayText = value.toLocaleString()
    }
  }

  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2 rounded
        ${isChanged ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200'}
      `}
    >
      <span className="text-gray-700">{label}</span>
      <span className={`font-medium ${isChanged ? 'text-amber-900' : 'text-gray-900'}`}>
        {displayText}
      </span>
    </div>
  )
}

/**
 * Version Comparison Modal Component
 * 
 * Single Responsibility: Display side-by-side version comparison
 * Critical for M&A workflow - compare valuations before/after discoveries
 * 
 * @module components/VersionComparisonModal
 */

'use client'

import { ArrowRight, TrendingDown, TrendingUp, X } from 'lucide-react'
import { formatCurrency } from '../config/countries'
import type { VersionComparison } from '../types/ValuationVersion'

export interface VersionComparisonModalProps {
  comparison: VersionComparison
  onClose: () => void
  onUseVersion?: (versionNumber: number) => void
}

/**
 * Version Comparison Modal
 * 
 * Shows side-by-side comparison of two versions with:
 * - Version metadata
 * - Field-by-field differences
 * - Valuation impact
 * - Highlighted significant changes
 * 
 * @example
 * ```tsx
 * <VersionComparisonModal
 *   comparison={comparisonResult}
 *   onClose={() => setShowComparison(false)}
 *   onUseVersion={(v) => loadVersion(v)}
 * />
 * ```
 */
export function VersionComparisonModal({
  comparison,
  onClose,
  onUseVersion,
}: VersionComparisonModalProps) {
  const { versionA, versionB, changes, valuationDelta, highlights } = comparison

  const countryCode = versionB.formData.country_code || 'BE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Compare Versions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {versionA.versionLabel} vs {versionB.versionLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Valuation Impact (if available) */}
          {valuationDelta && (
            <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Impact</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Previous Valuation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (typeof versionA.valuationResult === 'object' && versionA.valuationResult 
                        ? (versionA.valuationResult as any).valuation_summary?.final_valuation 
                        : null) || 0,
                      countryCode
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRight className="w-8 h-8 text-primary-600" />
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">New Valuation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      (typeof versionB.valuationResult === 'object' && versionB.valuationResult 
                        ? (versionB.valuationResult as any).valuation_summary?.final_valuation 
                        : null) || 0,
                      countryCode
                    )}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <div
                    className={`
                      px-4 py-2 rounded-lg font-semibold text-lg
                      ${
                        valuationDelta.direction === 'increase'
                          ? 'bg-green-100 text-green-700'
                          : valuationDelta.direction === 'decrease'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {valuationDelta.direction === 'increase' && (
                      <TrendingUp className="w-5 h-5 inline mr-2" />
                    )}
                    {valuationDelta.direction === 'decrease' && (
                      <TrendingDown className="w-5 h-5 inline mr-2" />
                    )}
                    {valuationDelta.percentChange > 0 ? '+' : ''}
                    {valuationDelta.percentChange.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Absolute change */}
              <div className="mt-4 pt-4 border-t border-primary-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Change: </span>
                  {valuationDelta.absoluteChange > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(valuationDelta.absoluteChange), countryCode)}
                </p>
              </div>
            </div>
          )}

          {/* Highlights (significant changes) */}
          {highlights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Changes</h3>
              <div className="space-y-3">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.field}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">{highlight.label}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">
                            {String(highlight.oldValue)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-medium">
                            {String(highlight.newValue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                          {highlight.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed field comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Field-by-Field Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Version A */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {versionA.versionNumber}
                  </span>
                  {versionA.versionLabel}
                </h4>
                <div className="space-y-2 text-sm">
                  <FieldRow
                    label="Revenue"
                    value={versionA.formData.current_year_data?.revenue}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="EBITDA"
                    value={versionA.formData.current_year_data?.ebitda}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="Assets"
                    value={versionA.formData.current_year_data?.total_assets}
                    countryCode={countryCode}
                  />
                  <FieldRow
                    label="Debt"
                    value={versionA.formData.current_year_data?.total_debt}
                    countryCode={countryCode}
                  />
                  <FieldRow label="Employees" value={versionA.formData.number_of_employees} />
                  <FieldRow label="Owners" value={versionA.formData.number_of_owners} />
                </div>
              </div>

              {/* Version B */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {versionB.versionNumber}
                  </span>
                  {versionB.versionLabel}
                </h4>
                <div className="space-y-2 text-sm">
                  <FieldRow
                    label="Revenue"
                    value={versionB.formData.current_year_data?.revenue}
                    countryCode={countryCode}
                    isChanged={!!changes.revenue}
                  />
                  <FieldRow
                    label="EBITDA"
                    value={versionB.formData.current_year_data?.ebitda}
                    countryCode={countryCode}
                    isChanged={!!changes.ebitda}
                  />
                  <FieldRow
                    label="Assets"
                    value={versionB.formData.current_year_data?.total_assets}
                    countryCode={countryCode}
                    isChanged={!!changes.totalAssets}
                  />
                  <FieldRow
                    label="Debt"
                    value={versionB.formData.current_year_data?.total_debt}
                    countryCode={countryCode}
                    isChanged={!!changes.totalDebt}
                  />
                  <FieldRow
                    label="Employees"
                    value={versionB.formData.number_of_employees}
                    isChanged={!!changes.numberOfEmployees}
                  />
                  <FieldRow
                    label="Owners"
                    value={versionB.formData.number_of_owners}
                    isChanged={!!changes.numberOfOwners}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {changes.totalChanges} field{changes.totalChanges === 1 ? '' : 's'} changed
          </p>
          <div className="flex items-center gap-3">
            {onUseVersion && (
              <>
                <button
                  onClick={() => onUseVersion(versionA.versionNumber)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Use v{versionA.versionNumber}
                </button>
                <button
                  onClick={() => onUseVersion(versionB.versionNumber)}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Use v{versionB.versionNumber}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Field row in comparison
 */
function FieldRow({
  label,
  value,
  countryCode,
  isChanged = false,
}: {
  label: string
  value?: number
  countryCode?: string
  isChanged?: boolean
}): React.ReactElement {
  let displayText = 'N/A'
  if (value != null) {
    if (countryCode && value > 1000) {
      displayText = formatCurrency(value, countryCode)
    } else {
      displayText = value.toLocaleString()
    }
  }

  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2 rounded
        ${isChanged ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200'}
      `}
    >
      <span className="text-gray-700">{label}</span>
      <span className={`font-medium ${isChanged ? 'text-amber-900' : 'text-gray-900'}`}>
        {displayText}
      </span>
    </div>
  )
}

