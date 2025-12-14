/**
 * useValuationFormSubmission Hook
 *
 * Single Responsibility: Form submission logic and validation
 * Extracted from ValuationForm to follow SRP
 *
 * @module components/ValuationForm/hooks/useValuationFormSubmission
 */

import { useCallback } from 'react'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { buildValuationRequest } from '../../../utils/buildValuationRequest'
import { generalLogger } from '../../../utils/logger'
import { convertFormDataToDataResponses } from '../utils/convertFormDataToDataResponses'

interface UseValuationFormSubmissionReturn {
  handleSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
  validationError: string | null
}

/**
 * Hook for handling form submission
 *
 * Handles:
 * - Form validation (employee count check)
 * - Building ValuationRequest from formData
 * - Calling calculateValuation
 * - Storing result in results store
 */
export const useValuationFormSubmission = (
  setEmployeeCountError: (error: string | null) => void
): UseValuationFormSubmissionReturn => {
  const { formData, setCollectedData } = useValuationFormStore()
  const { calculateValuation, isCalculating } = useValuationApiStore()
  const { setResult } = useValuationResultsStore()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate employee count when owner count is provided
      // NOTE: 0 employees is valid when there are only owner-managers (no other staff)
      if (
        formData.business_type === 'company' &&
        formData.number_of_owners &&
        formData.number_of_owners > 0 &&
        formData.number_of_employees === undefined
      ) {
        setEmployeeCountError(
          'Employee count is required when owner count is provided to calculate owner concentration risk. Enter 0 if there are no employees besides the owner-managers.'
        )
        return
      }

      // Clear validation error if validation passes
      setEmployeeCountError(null)

      // Convert formData to DataResponse[] for unified pipeline
      const dataResponses = convertFormDataToDataResponses(formData)
      
      // Sync to store (unified pipeline - both flows use this)
      setCollectedData(dataResponses)
      
      generalLogger.info('Form data converted to DataResponse[] and synced to store', {
        responseCount: dataResponses.length,
        fields: dataResponses.map((r) => r.fieldId),
      })

      // Build ValuationRequest using unified function
      const request = buildValuationRequest(formData)

      // Calculate valuation
      const result = await calculateValuation(request)

      if (result) {
        // Store result in results store
        setResult(result)
        generalLogger.info('Valuation calculated successfully', {
          valuationId: result.valuation_id,
        })
      }
    },
    [formData, calculateValuation, setResult, setEmployeeCountError, setCollectedData]
  )

  return {
    handleSubmit,
    isSubmitting: isCalculating,
    validationError: null, // Validation errors are handled via setEmployeeCountError
  }
}
