/**
 * useValuationOrchestrator Hook
 *
 * Main orchestrator for valuation workflow.
 * Coordinates session, conversation, reports, and UI state.
 * Uses centralized conversation state management to prevent race conditions.
 *
 * @module features/valuation/hooks/useValuationOrchestrator
 */

import { useCallback, useEffect, useState } from 'react';
import type { ValuationResponse } from '../../../types/valuation';
import { chatLogger } from '../../../utils/logger';
import { useCreditGuard } from '../../auth/hooks/useCreditGuard';
import { useConversationStateManager } from '../../conversation/hooks/useConversationStateManager';

type FlowStage = 'chat' | 'results' | 'blocked';

interface UseValuationOrchestratorOptions {
  reportId: string;
  sessionId: string;
  pythonSessionId: string | null;
  isRestoredSessionId: boolean;
  session: any;
  user: any;
  isAuthenticated: boolean;
  onComplete?: (result: ValuationResponse) => void;
  // Note: reportId, sessionId, user are used internally but may appear unused in destructuring
}

interface UseValuationOrchestratorReturn {
  // Stage
  stage: FlowStage;
  setStage: (stage: FlowStage) => void;
  
  // Valuation result
  valuationResult: ValuationResponse | null;
  setValuationResult: (result: ValuationResponse | null) => void;
  
  // Error
  error: string | null;
  setError: (error: string | null) => void;
  
  // Session restoration
  restoredMessages: any[];
  isRestoring: boolean;
  isRestorationComplete: boolean;
  isSessionInitialized: boolean;
  
  // Credit guard
  hasCredits: boolean;
  isBlocked: boolean;
  showOutOfCreditsModal: boolean;
  setShowOutOfCreditsModal: (show: boolean) => void;
  
  // Report generation (simplified - no progressive reports)
  finalReportHtml: string;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  
  // Event handlers
  handleValuationComplete: (valuationResult: ValuationResponse) => Promise<void>;
}

/**
 * Main orchestrator hook for valuation workflow
 * 
 * Combines:
 * - Session restoration (useSessionRestoration)
 * - Credit management (useCreditGuard)
 * - Flow stage management
 * - Valuation completion logic
 * 
 * Note: No progressive report generation - conversational flow shows final report from backend
 * 
 * @param options Configuration options
 * @returns Orchestrated state and handlers
 */
export function useValuationOrchestrator({
  reportId: _reportId,
  sessionId: _sessionId,
  pythonSessionId,
  isRestoredSessionId,
  session,
  user: _user,
  isAuthenticated,
  onComplete,
}: UseValuationOrchestratorOptions): UseValuationOrchestratorReturn {
  // Flow stage
  const [stage, setStage] = useState<FlowStage>('chat');
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Centralized conversation state management
  const conversationState = useConversationStateManager({
    reportId: _reportId,
    sessionId: _sessionId,
    initialPythonSessionId: pythonSessionId,
    onStateChange: (state, event) => {
      chatLogger.debug('Conversation state changed', {
        state,
        event,
        reportId: _reportId,
        sessionId: _sessionId,
      });
    },
    onMessagesRestored: (messages) => {
      chatLogger.info('Messages restored in orchestrator', {
        messageCount: messages.length,
        reportId: _reportId,
        sessionId: _sessionId,
      });
    },
    onSessionIdUpdate: (newSessionId) => {
      chatLogger.info('Python session ID updated in orchestrator', {
        newSessionId,
        reportId: _reportId,
        sessionId: _sessionId,
      });
    },
  });

  // Initialize conversation state when component mounts
  useEffect(() => {
    if (session) {
      conversationState.handleSessionLoaded(pythonSessionId, isRestoredSessionId);
    }
  }, [session, pythonSessionId, isRestoredSessionId, conversationState]);

  // Credit guard
  const {
    hasCredits,
    isBlocked,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
  } = useCreditGuard({
    isAuthenticated,
    onOutOfCredits: () => {
      setStage('blocked');
    },
  });

  // Report generation (simplified - no progressive reports)
  const [finalReportHtml, setFinalReportHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Update finalReportHtml when valuationResult changes
  useEffect(() => {
    if (valuationResult?.html_report) {
      setFinalReportHtml(valuationResult.html_report);
    }
  }, [valuationResult]);

  /**
   * Handle valuation completion
   */
  const handleValuationComplete = useCallback(async (result: ValuationResponse) => {
    chatLogger.info('Valuation complete callback triggered', {
      hasResult: !!result,
      valuationId: result?.valuation_id,
    });

    // Clear any previous errors
    setError(null);

    // Store the valuation result - HTML report will come via report_complete event
    setValuationResult(result);

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(result);
    }

    chatLogger.info('Valuation result stored, waiting for HTML report');
  }, [onComplete]);

  return {
    // Stage
    stage,
    setStage,

    // Valuation result
    valuationResult,
    setValuationResult,

    // Error
    error,
    setError,

    // Session restoration (from centralized state manager)
    restoredMessages: conversationState.messages,
    isRestoring: conversationState.isRestoring,
    isRestorationComplete: conversationState.restorationComplete,
    isSessionInitialized: conversationState.isSessionInitialized,
    
    // Credit guard
    hasCredits,
    isBlocked,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
    
    // Report generation (simplified - no progressive reports)
    finalReportHtml,
    isGenerating,
    setIsGenerating,
    
    // Event handlers
    handleValuationComplete,
  };
}

