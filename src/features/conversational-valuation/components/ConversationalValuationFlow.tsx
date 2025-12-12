/**
 * ConversationalValuationFlow Component
 *
 * Main orchestrator for conversational AI-assisted valuation workflow.
 * Single Responsibility: Feature orchestration and state management setup.
 *
 * @module features/conversational-valuation/components/ConversationalValuationFlow
 */

import React, { useEffect } from 'react';
import { FeatureErrorBoundary } from '../../../features/shared/components/ErrorBoundary';
import { ConversationalLayout } from './ConversationalLayout';
import { ConversationProvider, useConversationActions } from '../context/ConversationContext';

interface ConversationalValuationFlowProps {
  reportId: string;
  onComplete: (result: any) => void;
  initialQuery?: string | null;
  autoSend?: boolean;
}

/**
 * Conversational Valuation Flow - Main Orchestrator
 *
 * Single Responsibility: Feature orchestration and context setup.
 * Delegates all business logic to focused components.
 */
export const ConversationalValuationFlow: React.FC<ConversationalValuationFlowProps> = ({
  reportId,
  onComplete,
  initialQuery = null,
  autoSend = false,
}) => {
  return (
    <FeatureErrorBoundary feature="conversational-valuation">
      <ConversationProvider initialState={{ sessionId: reportId }}>
        <ConversationalValuationFlowInner
          reportId={reportId}
          onComplete={onComplete}
          initialQuery={initialQuery}
          autoSend={autoSend}
        />
      </ConversationProvider>
    </FeatureErrorBoundary>
  );
};
