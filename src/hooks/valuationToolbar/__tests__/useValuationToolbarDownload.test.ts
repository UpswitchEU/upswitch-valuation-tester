/**
 * Unit tests for useValuationToolbarDownload hook
 *
 * @module hooks/valuationToolbar/__tests__/useValuationToolbarDownload.test
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ValuationData } from '../../../services/downloadService'
import { useValuationToolbarDownload } from '../useValuationToolbarDownload'

// Mock DownloadService
vi.mock('../../../services/downloadService', () => ({
  DownloadService: {
    downloadPDF: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useValuationToolbarDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useValuationToolbarDownload())

    expect(result.current.isDownloading).toBe(false)
    expect(result.current.downloadError).toBeNull()
  })

  it('should set isDownloading to true during download', async () => {
    const { DownloadService } = await import('../../../services/downloadService')
    const downloadSpy = vi.spyOn(DownloadService, 'downloadPDF').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { result } = renderHook(() => useValuationToolbarDownload())

    const valuationData: ValuationData = {
      companyName: 'Test Company',
      valuationAmount: 1000000,
      valuationDate: new Date(),
      method: 'DCF Analysis',
      confidenceScore: 0.85,
      htmlContent: '<html>Test</html>',
    }

    act(() => {
      result.current.handleDownload(valuationData)
    })

    expect(result.current.isDownloading).toBe(true)

    await waitFor(() => {
      expect(result.current.isDownloading).toBe(false)
    })

    downloadSpy.mockRestore()
  })

  it('should handle download success', async () => {
    const { DownloadService } = await import('../../../services/downloadService')
    const downloadSpy = vi.spyOn(DownloadService, 'downloadPDF').mockResolvedValue(undefined)

    const { result } = renderHook(() => useValuationToolbarDownload())

    const valuationData: ValuationData = {
      companyName: 'Test Company',
      valuationAmount: 1000000,
    }

    await act(async () => {
      await result.current.handleDownload(valuationData)
    })

    expect(downloadSpy).toHaveBeenCalledWith(valuationData, expect.objectContaining({
      format: 'pdf',
    }))
    expect(result.current.isDownloading).toBe(false)
    expect(result.current.downloadError).toBeNull()

    downloadSpy.mockRestore()
  })

  it('should handle download error', async () => {
    const { DownloadService } = await import('../../../services/downloadService')
    const error = new Error('Download failed')
    const downloadSpy = vi.spyOn(DownloadService, 'downloadPDF').mockRejectedValue(error)

    const { result } = renderHook(() => useValuationToolbarDownload())

    const valuationData: ValuationData = {
      companyName: 'Test Company',
    }

    await act(async () => {
      await result.current.handleDownload(valuationData)
    })

    expect(result.current.isDownloading).toBe(false)
    expect(result.current.downloadError).toBeInstanceOf(Error)
    expect(result.current.downloadError?.message).toBe('Download failed')

    downloadSpy.mockRestore()
  })
})
