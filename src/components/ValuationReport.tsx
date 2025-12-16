'use client'

import { useRouter } from 'next/navigation'
import React, { Suspense } from 'react'
import { reportApiService } from '../services/reportApi'
import UrlGeneratorService from '../services/urlGenerator'
import { useValuationSessionStore } from '../store/useValuationSessionStore'
import type { ValuationResponse } from '../types/valuation'
import { generalLogger } from '../utils/logger'
import { generateReportId, isValidReportId } from '../utils/reportIdGenerator'
import { ValuationFlowSelector } from './ValuationFlowSelector'
import { ValuationSessionManager } from './ValuationSessionManager'

/**
 * ValuationReport Component - Next.js Compatible
 *
 * Single Responsibility: Route validation and delegation.
 * Handles URL parameter validation and delegates to session/flow management.
 *
 * Enhanced for M&A workflow:
 * - Supports edit/view mode switching
 * - Supports version selection
 * - Always editable by default (M&A requirement)
 */
interface ValuationReportProps {
  reportId: string
  /** Initial mode (edit = editable form, view = static report) */
  initialMode?: 'edit' | 'view'
  /** Initial version number to load */
  initialVersion?: number
}

export const ValuationReport: React.FC<ValuationReportProps> = React.memo(
  ({
    reportId,
    initialMode = 'edit', // Default to edit mode for M&A workflow
    initialVersion,
  }) => {
    const router = useRouter()

    // Handle valuation completion
    // NOTE: saveCompleteSession is already called in useValuationFormSubmission
    // This callback only handles report API completion for credit tracking
    const handleValuationComplete = async (result: ValuationResponse) => {
      const { markReportSaving, markReportSaved, markReportSaveFailed } = useValuationSessionStore.getState()

      // Mark as saving during completion process
      markReportSaving()

      try {
        // Save via report API (for credit tracking and other persistence)
        // NOTE: Session save is already handled by saveCompleteSession in useValuationFormSubmission
        await reportApiService.completeReport(reportId, result)
        generalLogger.info('Valuation report saved successfully', {
          reportId,
          valuationId: result.valuation_id,
        })

        // Mark save as completed - report is automatically saved after generation
        markReportSaved()
      } catch (error) {
        // Mark save as failed
        markReportSaveFailed(error instanceof Error ? error.message : 'Save failed')
        // BANK-GRADE: Specific error handling - report save failure
        // Don't show error to user as the valuation is already complete locally
        if (error instanceof Error) {
          generalLogger.error('Failed to save completed valuation', {
            error: error.message,
            stack: error.stack,
            reportId,
            valuationId: result.valuation_id,
          })
        } else {
          generalLogger.error('Failed to save completed valuation', {
            error: String(error),
            reportId,
            valuationId: result.valuation_id,
          })
        }
      }
    }

    // Validate report ID and redirect if invalid
    React.useEffect(() => {
      if (!reportId || !isValidReportId(reportId)) {
        // Invalid or missing report ID - generate new one
        const newReportId = generateReportId()
        router.replace(UrlGeneratorService.reportById(newReportId))
      }
    }, [reportId, router])

    if (!reportId || !isValidReportId(reportId)) {
      return null
    }

    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <Suspense
          fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}
        >
          <ValuationSessionManager
            reportId={reportId}
            initialMode={initialMode}
            initialVersion={initialVersion}
          >
            {({
              session,
              stage,
              error,
              showOutOfCreditsModal,
              onCloseModal,
              prefilledQuery,
              autoSend,
            }) => (
              <ValuationFlowSelector
                session={session}
                stage={stage}
                error={error}
                prefilledQuery={prefilledQuery}
                autoSend={autoSend}
                onComplete={handleValuationComplete}
                initialMode={initialMode}
                initialVersion={initialVersion}
              />
            )}
          </ValuationSessionManager>
        </Suspense>
      </div>
    )
  }
)

ValuationReport.displayName = 'ValuationReport'
