/**
 * Manual Toolbar Hook
 *
 * Single Responsibility: Toolbar handlers for manual layout.
 *
 * @module features/manual/hooks/useManualToolbar
 */

import { useCallback, useState } from 'react'
import {
  useValuationToolbarRefresh,
} from '../../../hooks/valuationToolbar'
import { backendAPI } from '../../../services/backendApi'
import { RefreshService } from '../../../services/toolbar/refreshService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import type { ValuationResponse } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'
import { generateReportId } from '../../../utils/reportIdGenerator'

/**
 * Manual Toolbar Hook Return Type
 */
export interface UseManualToolbarReturn {
  /** Handle refresh action */
  handleRefresh: () => void
  /** Handle download action */
  handleDownload: () => Promise<void>
  /** Whether download is in progress */
  isDownloading: boolean
}

/**
 * Manual Toolbar Hook Options
 */
interface UseManualToolbarOptions {
  /** Current valuation result */
  result: ValuationResponse | null
}

/**
 * Manual Toolbar Hook
 *
 * Provides toolbar handlers for manual layout.
 */
export const useManualToolbar = ({ result }: UseManualToolbarOptions): UseManualToolbarReturn => {
  const { handleRefresh: handleHookRefresh } = useValuationToolbarRefresh()
  const { session } = useValuationSessionStore()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleRefresh = useCallback(() => {
    const newReportId = generateReportId()
    RefreshService.navigateTo(UrlGeneratorService.reportById(newReportId))
    handleHookRefresh()
  }, [handleHookRefresh])

  const handleDownload = useCallback(async () => {
    const currentResult = result || useValuationResultsStore.getState().result
    const reportId = session?.reportId

    if (!currentResult || !currentResult.html_report) {
      generalLogger.warn('Cannot download PDF: No valuation result or HTML report available', {
        hasResult: !!currentResult,
        hasHtmlReport: !!currentResult?.html_report,
      })
      return
    }

    if (!reportId) {
      generalLogger.error('Cannot download PDF: Report ID not available', {
        hasSession: !!session,
        reportId: session?.reportId,
      })
      return
    }

    setIsDownloading(true)
    try {
      generalLogger.info('Initiating backend PDF download', {
        reportId,
        valuationId: currentResult.valuation_id,
        companyName: currentResult.company_name,
      })

      // Use backend PDF generation endpoint
      const pdfBlob = await backendAPI.downloadAccountantViewPDF(reportId)

      // Generate filename
      const companyName = currentResult.company_name || 'Company'
      const filename = `valuation-${companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`

      // Trigger browser download
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      generalLogger.info('PDF download completed successfully', {
        reportId,
        filename,
        pdfSize: pdfBlob.size,
      })
    } catch (error) {
      // BANK-GRADE: Specific error handling - PDF download failure
      if (error instanceof Error) {
        generalLogger.error('PDF download failed', {
          error: error.message,
          stack: error.stack,
          reportId,
          valuationId: currentResult.valuation_id,
        })
      } else {
        generalLogger.error('PDF download failed', {
          error: String(error),
          reportId,
          valuationId: currentResult.valuation_id,
        })
      }
      // TODO: Show user-friendly error message with retry option
    } finally {
      setIsDownloading(false)
    }
  }, [result, session])

  return {
    handleRefresh,
    handleDownload,
    isDownloading,
  }
}
