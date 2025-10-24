import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateReportId, isValidReportId } from '../utils/reportIdGenerator';
import UrlGeneratorService from '../services/urlGenerator';
import { FlowSelectionScreen } from './FlowSelectionScreen';
import { AIAssistedValuation } from './AIAssistedValuation';
import { ManualValuationFlow } from './ManualValuationFlow';
import { useAuth } from '../hooks/useAuth';
import { guestCreditService } from '../services/guestCreditService';
import { OutOfCreditsModal } from './OutOfCreditsModal';
import { reportApiService } from '../services/reportApi';
import type { ValuationResponse } from '../types/valuation';

type FlowType = 'manual' | 'ai-guided' | null;
type Stage = 'loading' | 'flow-selection' | 'data-entry' | 'processing';

export const ValuationReport: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  // Check if report exists and load appropriate state
  const checkReportExists = useCallback(async (reportId: string) => {
    try {
      // Try to load existing report from backend
      const response = await reportApiService.getReport(reportId);
      
      if (response.success && response.data) {
        // Report exists - load its state
        if (response.data.valuation_data) {
          // Report is completed - resume flow to show results in child component
          setFlowType(response.data.flow_type);
          setStage('data-entry');
          return;
        } else if (response.data.flow_type) {
          // Report exists but not completed - resume flow
          setFlowType(response.data.flow_type);
          setStage('data-entry');
          return;
        }
      }
    } catch (error) {
      // Report doesn't exist or error - check for flow parameter
      console.log('Report not found, checking for flow parameter');
    }
    
    // Check for flow parameter in URL
    const searchParams = new URLSearchParams(window.location.search);
    const flowParam = searchParams.get('flow');
    
    if (flowParam === 'manual' || flowParam === 'ai-guided') {
      // Validate credits for AI-guided (guests only)
      if (flowParam === 'ai-guided' && !isAuthenticated) {
        // For now, use local credit check as fallback
        const hasCredits = guestCreditService.hasCredits();
        if (!hasCredits) {
          setShowOutOfCreditsModal(true);
          setStage('flow-selection');
          return;
        }
      }
      
      // Auto-select flow and skip selection screen
      setFlowType(flowParam);
      setStage('data-entry');
    } else {
      setStage('flow-selection');
    }
  }, [isAuthenticated, navigate]);  // Add all dependencies

  // Validate and set report ID, then check if report exists
  useEffect(() => {
    if (!reportId || !isValidReportId(reportId)) {
      // Invalid or missing report ID - generate new one
      const newReportId = generateReportId();
      navigate(UrlGeneratorService.reportById(newReportId), { replace: true });
      return;
    }
    
    setCurrentReportId(reportId);
    checkReportExists(reportId);
  }, [reportId, navigate, checkReportExists]);

  // Handle flow selection
  const handleFlowSelection = async (flow: 'manual' | 'ai-guided') => {
    // Check credits for AI-guided flow (guests)
    if (flow === 'ai-guided' && !isAuthenticated) {
      const hasCredits = guestCreditService.hasCredits();
      if (!hasCredits) {
        setShowOutOfCreditsModal(true);
        return;
      }
    }
    
    setFlowType(flow);
    setStage('data-entry');
    
    // Update report in backend
    try {
      await reportApiService.updateReport(currentReportId, {
        flow_type: flow,
        stage: 'data-entry'
      });
    } catch (error) {
      console.error('Failed to update report flow type:', error);
    }
  };

  // Handle valuation completion
  const handleValuationComplete = async (result: ValuationResponse) => {
    // Don't change stage - let child components handle their own results display
    
    // Save completed valuation to backend
    try {
      await reportApiService.completeReport(currentReportId, result);
    } catch (error) {
      console.error('Failed to save completed valuation:', error);
      // Don't show error to user as the valuation is already complete locally
    }
  };



  // Render based on stage
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {stage === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              <p className="text-zinc-400">Loading report...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setStage('flow-selection');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {stage === 'flow-selection' && (
          <FlowSelectionScreen onSelectFlow={handleFlowSelection} />
        )}
        
        {stage === 'data-entry' && flowType === 'manual' && (
          <ManualValuationFlow 
            reportId={currentReportId}
            onComplete={handleValuationComplete}
          />
        )}
        
        {stage === 'data-entry' && flowType === 'ai-guided' && (
          <AIAssistedValuation 
            reportId={currentReportId}
            onComplete={handleValuationComplete}
          />
        )}
        
      </div>
      
      {/* Out of Credits Modal */}
      <OutOfCreditsModal
        isOpen={showOutOfCreditsModal}
        onClose={() => setShowOutOfCreditsModal(false)}
        onSignUp={() => {
          setShowOutOfCreditsModal(false);
          // TODO: Implement actual sign-up flow
          console.log('Sign up clicked');
        }}
        onTryManual={() => {
          setShowOutOfCreditsModal(false);
          setFlowType('manual');
          setStage('data-entry');
        }}
      />
    </div>
  );
};
