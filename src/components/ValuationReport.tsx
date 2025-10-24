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
type Stage = 'loading' | 'flow-selection' | 'data-entry' | 'processing' | 'results';

export const ValuationReport: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
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
          // Report is completed - show results
          setValuationResult(response.data.valuation_data);
          setStage('results');
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
    setValuationResult(result);
    setStage('results');
    
    // Save completed valuation to backend
    try {
      await reportApiService.completeReport(currentReportId, result);
    } catch (error) {
      console.error('Failed to save completed valuation:', error);
      // Don't show error to user as the valuation is already complete locally
    }
  };

  // Handle restart
  const handleRestart = () => {
    setFlowType(null);
    setStage('flow-selection');
    setValuationResult(null);
  };


  // Render based on stage
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      {/* Header with report info */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            Valuation Report
          </h1>
          <span className="text-sm text-zinc-400 font-mono">
            {currentReportId}
          </span>
        </div>
        
        {stage === 'results' && (
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            New Valuation
          </button>
        )}
      </div>
      
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
        
        {stage === 'results' && valuationResult && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
              <h2 className="text-3xl font-bold text-white text-center mb-8">
                Valuation Complete
              </h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {valuationResult.company_name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        €{valuationResult.equity_value_low?.toLocaleString()}
                      </div>
                      <div className="text-sm text-zinc-400">Low Estimate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        €{valuationResult.equity_value_mid?.toLocaleString()}
                      </div>
                      <div className="text-sm text-zinc-400">Mid Estimate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        €{valuationResult.equity_value_high?.toLocaleString()}
                      </div>
                      <div className="text-sm text-zinc-400">High Estimate</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-zinc-300 mb-2">
                      Recommended Asking Price
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      €{valuationResult.recommended_asking_price?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expiration warning for guest users */}
              {!isAuthenticated && (
                <div className="mt-6 bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-sm">⏰</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-orange-300 mb-1">
                        Report Expires in 7 Days
                      </h3>
                      <p className="text-sm text-orange-200 mb-3">
                        This report will be deleted after 7 days. Sign up to save your reports forever and get 3 more free AI valuations.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement actual sign-up flow
                            console.log('Sign up to save report');
                          }}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Sign Up to Save Forever
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement download functionality
                            console.log('Download report');
                          }}
                          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Download Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
