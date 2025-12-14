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
 */
interface ValuationReportProps {
  reportId: string
}

export const ValuationReport: React.FC<ValuationReportProps> = React.memo(({ reportId }) => {
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
        <ValuationSessionManager reportId={reportId}>
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
            />
          )}
        </ValuationSessionManager>
      </Suspense>
    </div>
  )
})

ValuationReport.displayName = 'ValuationReport'
