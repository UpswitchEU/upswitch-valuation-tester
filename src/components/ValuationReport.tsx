'use client'

import { useRouter } from 'next/navigation'
import React, { Suspense } from 'react'
import { reportApiService } from '../services/reportApi'
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

export const ValuationReport: React.FC<ValuationReportProps> = React.memo(({ 
  reportId,
  initialMode = 'edit', // Default to edit mode for M&A workflow
  initialVersion,
}) => {
  const router = useRouter()

  // Handle valuation completion
  const handleValuationComplete = async (result: ValuationResponse) => {
    // Save completed valuation to backend
    try {
      await reportApiService.completeReport(reportId, result)
    } catch (error) {
      generalLogger.error('Failed to save completed valuation', { error, reportId })
      // Don't show error to user as the valuation is already complete locally
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
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
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
})

ValuationReport.displayName = 'ValuationReport'
