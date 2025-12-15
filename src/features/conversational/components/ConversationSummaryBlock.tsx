/**
 * Conversation Summary Block Component
 *
 * Displays a summary of collected data when loading an existing conversational report
 * Shows key data points, completion status, and quick actions
 */

import { CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import React from 'react'
import { formatCurrency } from '../../../config/countries'

export interface ConversationSummaryBlockProps {
  collectedData: Record<string, any>
  completionPercentage?: number
  calculatedAt?: Date | string
  valuationResult?: any
  onContinue?: () => void
  onViewReport?: () => void
}

export const ConversationSummaryBlock: React.FC<ConversationSummaryBlockProps> = ({
  collectedData,
  completionPercentage = 0,
  calculatedAt,
  valuationResult,
  onContinue,
  onViewReport,
}) => {
  // Extract key data points
  const companyName = collectedData?.company_name || 'Your business'
  const industry = collectedData?.industry
  const revenue = collectedData?.current_year_data?.revenue || collectedData?.revenue
  const ebitda = collectedData?.current_year_data?.ebitda || collectedData?.ebitda
  const countryCode = collectedData?.country_code || 'BE'
  const businessType = collectedData?.business_type

  // Check if valuation is complete
  const isComplete = !!valuationResult && !!calculatedAt

  // Format date
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <Clock className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isComplete ? 'Valuation Complete' : 'Session Restored'}
              </h3>
              <p className="text-sm text-gray-600">
                {isComplete
                  ? `Calculated on ${formatDate(calculatedAt!)}`
                  : `${completionPercentage}% complete`}
              </p>
            </div>
          </div>
          {!isComplete && completionPercentage > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Collected Data Summary */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Collected Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {companyName && companyName !== 'Your business' && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-xs text-gray-600">Company Name</p>
                <p className="text-sm font-medium text-gray-900">{companyName}</p>
              </div>
            </div>
          )}

          {businessType && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-xs text-gray-600">Business Type</p>
                <p className="text-sm font-medium text-gray-900">{businessType}</p>
              </div>
            </div>
          )}

          {industry && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-xs text-gray-600">Industry</p>
                <p className="text-sm font-medium text-gray-900">{industry}</p>
              </div>
            </div>
          )}

          {revenue && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(revenue, countryCode)}
                </p>
              </div>
            </div>
          )}

          {ebitda !== undefined && ebitda !== null && (
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <p className="text-xs text-gray-600">EBITDA</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(ebitda, countryCode)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Valuation Result (if complete) */}
        {isComplete && valuationResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Estimated Value</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(
                    valuationResult?.valuation_summary?.final_valuation ||
                      valuationResult?.value ||
                      0,
                    countryCode
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-white/50 border-t border-blue-200 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {isComplete
            ? 'Your valuation report is ready to view'
            : 'Continue the conversation to complete your valuation'}
        </p>
        <div className="flex items-center gap-2">
          {isComplete && onViewReport && (
            <button
              onClick={onViewReport}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              View Report
            </button>
          )}
          {!isComplete && onContinue && (
            <button
              onClick={onContinue}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

