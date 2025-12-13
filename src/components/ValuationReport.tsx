import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportApiService } from '../services/reportApi';
import type { ValuationResponse } from '../types/valuation';
import { generalLogger } from '../utils/logger';
import { generateReportId, isValidReportId } from '../utils/reportIdGenerator';
import { ValuationFlowSelector } from './ValuationFlowSelector';
import { ValuationSessionManager } from './ValuationSessionManager';

/**
 * ValuationReport Component - Pure Router
 *
 * Single Responsibility: Route validation and delegation.
 * Handles URL parameter validation and delegates to session/flow management.
 */
export const ValuationReport: React.FC = React.memo(() => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();

  // Handle valuation completion
  const handleValuationComplete = async (result: ValuationResponse) => {
    // Save completed valuation to backend
    try {
      await reportApiService.completeReport(reportId!, result);
    } catch (error) {
      generalLogger.error('Failed to save completed valuation', { error, reportId });
      // Don't show error to user as the valuation is already complete locally
    }
  };

  // Validate report ID and redirect if invalid
  if (!reportId || !isValidReportId(reportId)) {
    // Invalid or missing report ID - generate new one
    const newReportId = generateReportId();
    navigate(`/reports/${newReportId}`, { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      <ValuationSessionManager reportId={reportId}>
        {({ session, stage, error, showOutOfCreditsModal, onCloseModal, prefilledQuery, autoSend }) => (
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
    </div>
  );
});

ValuationReport.displayName = 'ValuationReport';