/**
 * Conversation Summary Block Component
 *
 * Displays a summary of collected data when loading an existing conversational report
 * Styled as a chat message card matching the dark theme of other chat components
 */

import { motion } from 'framer-motion'
import { CheckCircle2, FileText, TrendingUp } from 'lucide-react'
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
  completionPercentage: _completionPercentage,
  calculatedAt,
  valuationResult,
  onContinue,
  onViewReport,
}) => {
  // Extract key data points
  const companyName = collectedData?.company_name
  const industry = collectedData?.industry
  const revenue = collectedData?.current_year_data?.revenue || collectedData?.revenue
  const ebitda = collectedData?.current_year_data?.ebitda || collectedData?.ebitda
  const countryCode = collectedData?.country_code || 'BE'
  const businessType = collectedData?.business_type
  const country = collectedData?.country
  const foundedYear = collectedData?.founded_year || collectedData?.year_business_commenced
  const employees = collectedData?.number_of_employees || collectedData?.employees
  const owners = collectedData?.active_owner_managers || collectedData?.owners
  const sharesForSale = collectedData?.equity_stake_for_sale || collectedData?.shares_for_sale

  // Check if valuation is complete
  const isComplete = !!valuationResult && !!calculatedAt

  // Build list of fields to display
  const fieldsToDisplay: Array<{ label: string; value: string | number | null | undefined }> = []

  if (companyName && companyName !== 'Your business') {
    fieldsToDisplay.push({ label: 'Company Name', value: companyName })
  }
  if (businessType) {
    fieldsToDisplay.push({ label: 'Business Type', value: businessType })
  }
  if (industry) {
    fieldsToDisplay.push({ label: 'Industry', value: industry })
  }
  if (country) {
    fieldsToDisplay.push({ label: 'Country', value: country })
  }
  if (foundedYear) {
    fieldsToDisplay.push({ label: 'Founded', value: foundedYear })
  }
  if (revenue !== undefined && revenue !== null) {
    fieldsToDisplay.push({
      label: 'Revenue',
      value: formatCurrency(revenue, countryCode),
    })
  }
  if (ebitda !== undefined && ebitda !== null) {
    fieldsToDisplay.push({
      label: 'EBITDA',
      value: formatCurrency(ebitda, countryCode),
    })
  }
  if (employees !== undefined && employees !== null) {
    fieldsToDisplay.push({ label: 'Employees', value: employees })
  }
  if (owners !== undefined && owners !== null) {
    fieldsToDisplay.push({ label: 'Owners', value: owners })
  }
  if (sharesForSale !== undefined && sharesForSale !== null) {
    fieldsToDisplay.push({ label: 'Shares for Sale', value: `${sharesForSale}%` })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex justify-start w-full my-2"
    >
      <div className="max-w-[85%] mr-auto w-full">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-sm mt-1">
            <FileText className="w-4 h-4 text-primary-400" />
          </div>

          <div className="flex flex-col gap-1 w-full">
            {/* Main Card */}
            <div className="rounded-2xl rounded-tl-sm overflow-hidden border border-white/10 shadow-lg backdrop-blur-sm bg-zinc-900/40">
              {/* Header */}
              <div className="px-5 py-3 bg-gradient-to-r from-primary-900/20 to-transparent border-b border-white/10">
                <h4 className="text-sm font-semibold text-white">Collected Information</h4>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Fields Grid */}
                {fieldsToDisplay.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {fieldsToDisplay.map((field, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-400">{field.label}</p>
                          <p className="text-sm font-medium text-white truncate">
                            {field.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Valuation Result (if complete) */}
                {isComplete && valuationResult && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">Estimated Value</p>
                        <p className="text-lg font-bold text-green-400">
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

                {/* Footer with message and button */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-zinc-400 flex-1">
                      {isComplete
                        ? 'Your valuation report is ready to view'
                        : 'Continue the conversation to complete your valuation'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isComplete && onViewReport && (
                        <button
                          onClick={onViewReport}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          View Report
                        </button>
                      )}
                      {!isComplete && onContinue && (
                        <button
                          onClick={onContinue}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
