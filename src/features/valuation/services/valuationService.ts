/**
 * Valuation Service Implementation
 *
 * Concrete implementation of IValuationService interface.
 * Provides valuation calculation functionality with DIP compliance.
 */

import { ValuationRequest, ValuationResponse } from '../../../types/valuation';
import { IValuationService } from './interfaces';
import { manualValuationStreamService } from '../../../services/manualValuationStreamService';
import { generalLogger } from '../../../utils/logger';

/**
 * Valuation Service Implementation
 *
 * Provides concrete implementation of valuation calculations.
 * Follows Single Responsibility Principle - only handles valuation logic.
 */
export class ValuationService implements IValuationService {
  /**
   * Calculate valuation synchronously
   */
  async calculateValuation(request: ValuationRequest): Promise<ValuationResponse> {
    try {
      generalLogger.info('Starting valuation calculation', {
        companyName: request.company_name,
        industry: request.industry,
      });

      // Use existing manual valuation stream service
      // This is a temporary adapter - should be refactored to not use streaming
      const result = await new Promise<ValuationResponse>((resolve, reject) => {
        let finalResult: ValuationResponse | null = null;

        const stream = manualValuationStreamService.startStreaming(
          request,
          {
            onReportComplete: (htmlReport: string, valuationId: string, fullResponse?: any) => {
              finalResult = {
                ...fullResponse,
                html_report: htmlReport,
                valuation_id: valuationId,
              } as ValuationResponse;
            },
            onError: (error: string) => {
              reject(new Error(error));
            },
          }
        );

        // Wait a bit for completion (this is a temporary solution)
        setTimeout(() => {
          if (finalResult) {
            resolve(finalResult);
          } else {
            reject(new Error('Valuation calculation timed out'));
          }
          stream.stop?.();
        }, 30000); // 30 second timeout
      });

      generalLogger.info('Valuation calculation completed', {
        valuationId: result.valuation_id,
        hasHtmlReport: !!result.html_report,
      });

      return result;
    } catch (error) {
      generalLogger.error('Valuation calculation failed', { error });
      throw error instanceof Error ? error : new Error('Valuation calculation failed');
    }
  }

  /**
   * Start streaming valuation calculation
   */
  async startStreamingValuation(
    request: ValuationRequest,
    onProgress?: (progress: number, message: string) => void,
    onComplete?: (result: ValuationResponse) => void,
    onError?: (error: string) => void
  ): Promise<{ stop: () => void }> {
    try {
      generalLogger.info('Starting streaming valuation', {
        companyName: request.company_name,
      });

      const stream = manualValuationStreamService.startStreaming(
        request,
        {
          onProgress,
          onReportComplete: (htmlReport: string, valuationId: string, fullResponse?: any) => {
            const result: ValuationResponse = {
              ...fullResponse,
              html_report: htmlReport,
              valuation_id: valuationId,
            } as ValuationResponse;
            onComplete?.(result);
          },
          onError,
        }
      );

      return {
        stop: () => stream.stop?.(),
      };
    } catch (error) {
      generalLogger.error('Failed to start streaming valuation', { error });
      onError?.(error instanceof Error ? error.message : 'Failed to start valuation');
      throw error;
    }
  }
}

// Export singleton instance
export const valuationService = new ValuationService();
