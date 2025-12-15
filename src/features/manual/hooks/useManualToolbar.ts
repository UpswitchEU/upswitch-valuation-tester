/**
 * Manual Toolbar Hook
 *
 * Single Responsibility: Toolbar handlers for manual layout.
 *
 * @module features/manual/hooks/useManualToolbar
 */

import { useCallback } from 'react'
import {
  useValuationToolbarDownload,
  useValuationToolbarRefresh,
} from '../../../hooks/valuationToolbar'
import { RefreshService } from '../../../services/toolbar/refreshService'
import UrlGeneratorService from '../../../services/urlGenerator'
import { useValuationResultsStore } from '../../../store/useValuationResultsStore'
import type { ValuationResponse } from '../../../types/valuation'
import { generateReportId } from '../../../utils/reportIdGenerator'

/**
 * Manual Toolbar Hook Return Type
 */
interface UseManualToolbarReturn {
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
  const { handleDownload: handleHookDownload, isDownloading } = useValuationToolbarDownload()

  const handleRefresh = useCallback(() => {
    const newReportId = generateReportId()
    RefreshService.navigateTo(UrlGeneratorService.reportById(newReportId))
    handleHookRefresh()
  }, [handleHookRefresh])

  const handleDownload = useCallback(async () => {
    const currentResult = result || useValuationResultsStore.getState().result
    if (currentResult && currentResult.html_report) {
      await handleHookDownload({
        companyName: currentResult.company_name || 'Company',
        valuationAmount: currentResult.equity_value_mid,
        valuationDate: new Date(),
        method: currentResult.methodology || 'DCF Analysis',
        confidenceScore: currentResult.confidence_score,
        htmlContent: currentResult.html_report || '',
      })
    }
  }, [result, handleHookDownload])

  return {
    handleRefresh,
    handleDownload,
    isDownloading,
  }
}
