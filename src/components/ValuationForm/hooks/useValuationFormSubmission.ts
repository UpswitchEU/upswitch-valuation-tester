/**
 * useValuationFormSubmission Hook
 *
 * Single Responsibility: Form submission logic and validation
 * Extracted from ValuationForm to follow SRP
 *
 * @module components/ValuationForm/hooks/useValuationFormSubmission
 */

import { useCallback } from 'react'
import { valuationAuditService } from '../../../services/audit/ValuationAuditService'
import { useValuationApiStore } from '../../../store/useValuationApiStore'
import { useValuationFormStore } from '../../../store/useValuationFormStore'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import { useVersionHistoryStore } from '../../../store/useVersionHistoryStore'
import { buildValuationRequest } from '../../../utils/buildValuationRequest'
import { generalLogger } from '../../../utils/logger'
import {
  areChangesSignificant,
  detectVersionChanges,
  generateAutoLabel,
} from '../../../utils/versionDiffDetection'
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
 * - Creating new version on regeneration (M&A workflow)
 * - Logging to audit trail
 */
export const useValuationFormSubmission = (
  setEmployeeCountError: (error: string | null) => void
): UseValuationFormSubmissionReturn => {
  const { formData, setCollectedData } = useValuationFormStore()
  const { calculateValuation, isCalculating } = useValuationApiStore()
  const { setResult } = useValuationResultsStore()
  const { session } = useValuationSessionStore()
  const { createVersion, getLatestVersion } = useVersionHistoryStore()

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
      
      // Explicitly set dataSource for manual flow
      // This ensures backend knows this is a manual (FREE) calculation
      ;(request as any).dataSource = 'manual'

      // M&A Workflow: Check if this is a regeneration
      const reportId = session?.reportId
      let previousVersion: any = null
      let changes: any = null

      if (reportId) {
        previousVersion = getLatestVersion(reportId)
        if (previousVersion) {
          // Detect changes from previous version
          changes = detectVersionChanges(previousVersion.formData, request)

          generalLogger.info('Regeneration detected', {
            reportId,
            previousVersion: previousVersion.versionNumber,
            totalChanges: changes.totalChanges,
            significantChanges: changes.significantChanges,
          })
        }
      }

      // Calculate valuation
      const calculationStart = performance.now()
      const result = await calculateValuation(request)
      const calculationDuration = performance.now() - calculationStart

      if (result) {
        // Store result in results store
        setResult(result)

        // M&A Workflow: Create new version if this is a regeneration
        if (reportId && previousVersion && changes && areChangesSignificant(changes)) {
          try {
            const newVersion = await createVersion({
              reportId,
              formData: request,
              valuationResult: result,
              htmlReport: result.html_report || undefined,
              changesSummary: changes,
              versionLabel: generateAutoLabel(previousVersion.versionNumber + 1, changes),
            })

            generalLogger.info('New version created on regeneration', {
              reportId,
              versionNumber: newVersion.versionNumber,
              versionLabel: newVersion.versionLabel,
            })

            // Log regeneration to audit trail
            valuationAuditService.logRegeneration(
              reportId,
              newVersion.versionNumber,
              changes,
              calculationDuration
            )
          } catch (versionError) {
            // Don't fail the valuation if versioning fails
            // BANK-GRADE: Specific error handling - version creation failure
            if (versionError instanceof Error) {
              generalLogger.error('Failed to create version on regeneration', {
                reportId,
                error: versionError.message,
                stack: versionError.stack,
              })
            } else {
              generalLogger.error('Failed to create version on regeneration', {
                reportId,
                error: String(versionError),
              })
            }
          }
        }

        generalLogger.info('Valuation calculated successfully', {
          valuationId: result.valuation_id,
          calculationDuration_ms: calculationDuration.toFixed(2),
        })
      }
    },
    [
      formData,
      calculateValuation,
      setResult,
      setEmployeeCountError,
      setCollectedData,
      session,
      getLatestVersion,
      createVersion,
    ]
  )

  return {
    handleSubmit,
    isSubmitting: isCalculating,
    validationError: null, // Validation errors are handled via setEmployeeCountError
  }
}
