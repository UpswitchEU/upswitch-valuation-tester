/**
 * FormSubmitSection Component
 *
 * Single Responsibility: Render form submit button and error display
 * Extracted from ValuationForm to follow SRP
 *
 * @module components/ValuationForm/sections/FormSubmitSection
 */

import React, { useEffect } from 'react'
import type { ValuationFormData } from '../../../types/valuation'

interface FormSubmitSectionProps {
  isSubmitting: boolean
  error: string | null
  clearError: () => void
  formData: ValuationFormData
  /** Whether form is in regeneration mode (shows "Regenerate" instead of "Calculate") */
  isRegenerationMode?: boolean
}

/**
 * FormSubmitSection Component
 *
 * Renders submit button and error display
 */
export const FormSubmitSection: React.FC<FormSubmitSectionProps> = ({
  isSubmitting,
  error,
  clearError,
  formData,
  isRegenerationMode = false,
}) => {
  const isFormValid =
    formData.revenue && formData.ebitda && formData.industry && formData.country_code

  // Identify missing required fields for better UX
  const missingFields: string[] = []
  if (!formData.revenue) missingFields.push('Revenue')
  if (!formData.ebitda) missingFields.push('EBITDA')
  if (!formData.industry) missingFields.push('Industry')
  if (!formData.country_code) missingFields.push('Country')

  // Debug: Log form validation state
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[FormSubmitSection] Form validation state:', {
        isFormValid,
        isSubmitting,
        hasRevenue: !!formData.revenue,
        hasEbitda: !!formData.ebitda,
        hasIndustry: !!formData.industry,
        hasCountryCode: !!formData.country_code,
        revenue: formData.revenue,
        ebitda: formData.ebitda,
        industry: formData.industry,
        country_code: formData.country_code,
        missingFields,
      })
    }
  }, [isFormValid, isSubmitting, formData.revenue, formData.ebitda, formData.industry, formData.country_code, missingFields])

  return (
    <>
      {/* Submit Button */}
      <div className="pt-6 border-t border-zinc-700">
        {/* Show missing fields hint when form is invalid */}
        {!isFormValid && missingFields.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-600/10 border-l-4 border-yellow-600/30 rounded-r-lg">
            <p className="text-sm text-yellow-200">
              Please fill in required fields: <strong>{missingFields.join(', ')}</strong>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          onClick={(e) => {
            // Log button click for debugging
            if (process.env.NODE_ENV !== 'production') {
              console.log('[FormSubmitSection] Button clicked', {
                isSubmitting,
                isFormValid,
                disabled: isSubmitting || !isFormValid,
                revenue: formData.revenue,
                ebitda: formData.ebitda,
                industry: formData.industry,
                country_code: formData.country_code,
              })
            }
            // Don't prevent default - let form handle submission
          }}
          className={`
            w-full justify-center px-8 py-4 rounded-xl font-semibold text-lg shadow-lg
            transition-all duration-200 transform hover:-translate-y-0.5
            flex items-center gap-3
            ${
              isSubmitting || !isFormValid
                ? 'bg-zinc-800/30 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 hover:shadow-primary-500/20'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <span>{isRegenerationMode ? 'Regenerate Valuation' : 'Calculate Valuation'}</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-600/10 border-l-4 border-red-600/30 rounded-r-lg backdrop-blur-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-200">{error}</p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={clearError}
                  className="text-sm font-medium text-red-300 hover:text-red-200 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
