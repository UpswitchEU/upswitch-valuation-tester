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
  const { createVersion, getLatestVersion, fetchVersions } = useVersionHistoryStore()

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

      // CRITICAL: Sync all form data to session IMMEDIATELY before calculation
      // This ensures all data is saved even if calculation fails or user navigates away
      const { syncFromManualForm } = useValuationSessionStore.getState()
      try {
        await syncFromManualForm()
        generalLogger.info('Form data synced to session before calculation', {
          reportId: session?.reportId,
        })
      } catch (syncError) {
        generalLogger.warn('Failed to sync form data before calculation, continuing anyway', {
          error: syncError instanceof Error ? syncError.message : String(syncError),
        })
        // Continue with calculation even if sync fails
      }

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
        // CRITICAL: Log html_report presence before storing
        generalLogger.info('Valuation calculation completed - checking html_report', {
          valuationId: result.valuation_id,
          hasHtmlReport: !!result.html_report,
          htmlReportLength: result.html_report?.length || 0,
          hasInfoTabHtml: !!result.info_tab_html,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
          resultKeys: Object.keys(result),
          htmlReportPreview: result.html_report?.substring(0, 200) || 'N/A',
          calculationDuration: `${calculationDuration.toFixed(2)}ms`,
        })
        
        // Use structured logger instead of console.log to avoid "Object" spam
        generalLogger.debug('Before setResult: checking html_report and info_tab_html', {
          hasHtmlReport: !!result.html_report,
          htmlReportLength: result.html_report?.length || 0,
          hasInfoTabHtml: !!result.info_tab_html,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
          resultKeys: Object.keys(result).join(','),
        })
        
        // Warn if html_report is missing
        if (!result.html_report || result.html_report.trim().length === 0) {
          generalLogger.error('CRITICAL: html_report missing or empty in valuation result', {
            valuationId: result.valuation_id,
            hasHtmlReport: !!result.html_report,
            htmlReportLength: result.html_report?.length || 0,
            resultKeys: Object.keys(result),
            resultType: typeof result,
            resultStringified: JSON.stringify(result).substring(0, 500),
          })
        }
        
        // CRITICAL: Warn if info_tab_html is missing
        if (!result.info_tab_html || result.info_tab_html.trim().length === 0) {
          generalLogger.error('CRITICAL: info_tab_html missing or empty in valuation result', {
            valuationId: result.valuation_id,
            hasInfoTabHtml: !!result.info_tab_html,
            infoTabHtmlLength: result.info_tab_html?.length || 0,
            resultKeys: Object.keys(result),
            infoTabHtmlInKeys: 'info_tab_html' in result,
            resultType: typeof result,
            resultStringified: JSON.stringify(result).substring(0, 1000),
          })
        } else {
          generalLogger.debug('info_tab_html present before setResult', {
            infoTabHtmlLength: result.info_tab_html.length,
          })
        }
        
        // Store result in results store
        setResult(result)

        // M&A Workflow: Create version for first calculation or regeneration
        if (reportId) {
          try {
            if (previousVersion && changes && areChangesSignificant(changes)) {
              // Regeneration - create new version with changes
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

              // Refetch versions to update the toolbar dropdown
              fetchVersions(reportId).catch(() => {
                // Silently fail - versions will be fetched on next render
              })
            } else if (!previousVersion) {
              // First calculation - create initial version
              const firstVersion = await createVersion({
                reportId,
                formData: request,
                valuationResult: result,
                htmlReport: result.html_report || undefined,
                changesSummary: { totalChanges: 0, significantChanges: [] },
                versionLabel: 'v1 - Initial valuation',
              })

              generalLogger.info('Initial version created on first calculation', {
                reportId,
                versionNumber: firstVersion.versionNumber,
                versionLabel: firstVersion.versionLabel,
              })

              // Refetch versions to update the toolbar dropdown
              fetchVersions(reportId).catch(() => {
                // Silently fail - versions will be fetched on next render
              })
            }
          } catch (versionError) {
            // Don't fail the valuation if versioning fails
            // BANK-GRADE: Specific error handling - version creation failure
            if (versionError instanceof Error) {
              generalLogger.error('Failed to create version', {
                reportId,
                error: versionError.message,
                stack: versionError.stack,
                isFirstVersion: !previousVersion,
              })
            } else {
              generalLogger.error('Failed to create version', {
                reportId,
                error: String(versionError),
                isFirstVersion: !previousVersion,
              })
            }
          }
        }

        // CRITICAL: Save valuation result, HTML reports, and info tab HTML to session
        // This ensures everything can be restored when user returns later
        const { markReportSaving, markReportSaved, markReportSaveFailed } = useValuationSessionStore.getState()
        markReportSaving()

        if (session?.reportId) {
          try {
            const { SessionAPI } = await import('../../../services/api/session/SessionAPI')
            const sessionAPI = new SessionAPI()
            
            await sessionAPI.saveValuationResult(session.reportId, {
              valuationResult: result,
              htmlReport: result.html_report,
              infoTabHtml: result.info_tab_html,
            })

            generalLogger.info('Valuation result saved to session after calculation', {
              reportId: session.reportId,
              hasHtmlReport: !!result.html_report,
              hasInfoTabHtml: !!result.info_tab_html,
            })

            markReportSaved()
          } catch (saveError) {
            generalLogger.error('Failed to save valuation result to session', {
              reportId: session.reportId,
              error: saveError instanceof Error ? saveError.message : String(saveError),
            })
            markReportSaveFailed(saveError instanceof Error ? saveError.message : 'Save failed')
            // Continue - don't block user even if save fails
          }
        } else {
          markReportSaved()
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
      fetchVersions,
    ]
  )

  return {
    handleSubmit,
    isSubmitting: isCalculating,
    validationError: null, // Validation errors are handled via setEmployeeCountError
  }
}
