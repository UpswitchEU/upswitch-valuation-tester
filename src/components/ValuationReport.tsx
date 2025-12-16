'use client'

import { useRouter } from 'next/navigation'
import React, { Suspense } from 'react'
import { reportService } from '../services'
import UrlGeneratorService from '../services/urlGenerator'
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
 * Architecture: Flow-agnostic (shared by Manual and Conversational)
 * - Uses service layer for backend operations
 * - No direct store access (stores are flow-specific)
 * - Delegates to flow-specific components via ValuationFlowSelector
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
      try {
        // Complete report via service layer (for credit tracking and persistence)
        // NOTE: Session save is already handled by sessionService in useValuationFormSubmission
        const sessionId = result.valuation_id // Use valuation_id as session identifier
        await reportService.completeReport(reportId, sessionId, result)

        generalLogger.info('Valuation report completed successfully', {
          reportId,
          valuationId: result.valuation_id,
        })
      } catch (error) {
        // BANK-GRADE: Specific error handling - report completion failure
        // Don't show error to user as the valuation is already complete locally
        // Report completion is for credit tracking, not critical for user experience
        if (error instanceof Error) {
          generalLogger.error('Failed to complete valuation report', {
            error: error.message,
            stack: error.stack,
            reportId,
            valuationId: result.valuation_id,
          })
        } else {
          generalLogger.error('Failed to complete valuation report', {
            error: String(error),
            reportId,
            valuationId: result.valuation_id,
          })
        }
        // Continue - don't block user even if completion fails
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
              onRetry,
              onStartOver,
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
                onRetry={onRetry}
                onStartOver={onStartOver}
              />
            )}
          </ValuationSessionManager>
        </Suspense>
      </div>
    )
  }
)

ValuationReport.displayName = 'ValuationReport'
