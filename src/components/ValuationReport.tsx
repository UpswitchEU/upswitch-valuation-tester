import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { generateReportId, isValidReportId } from '../utils/reportIdGenerator';
import UrlGeneratorService from '../services/urlGenerator';
import { AIAssistedValuation } from './AIAssistedValuation';
import { ManualValuationFlow } from './ManualValuationFlow';
import { useAuth } from '../hooks/useAuth';
import { guestCreditService } from '../services/guestCreditService';
import { OutOfCreditsModal } from './OutOfCreditsModal';
import { reportApiService } from '../services/reportApi';
import { useValuationSessionStore } from '../store/useValuationSessionStore';
import type { ValuationResponse } from '../types/valuation';

type Stage = 'loading' | 'data-entry' | 'processing' | 'flow-selection';

export const ValuationReport: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { session, initializeSession } = useValuationSessionStore();
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [stage, setStage] = useState<Stage>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  
  // Extract prefilled query from location state
  const prefilledQuery = (location.state as any)?.prefilledQuery || null;
  const autoSend = (location.state as any)?.autoSend || false;

  // Initialize session on mount
  const initializeSessionForReport = useCallback(async (reportId: string) => {
    try {
      // Check for flow parameter in URL to set initial view
      const searchParams = new URLSearchParams(window.location.search);
      const flowParam = searchParams.get('flow');
      const initialView = (flowParam === 'manual' || flowParam === 'ai-guided') 
        ? flowParam 
        : 'manual'; // Default to manual
      
      // Validate credits for AI-guided (guests only)
      if (initialView === 'ai-guided' && !isAuthenticated) {
        const hasCredits = guestCreditService.hasCredits();
        if (!hasCredits) {
          setShowOutOfCreditsModal(true);
          // Still initialize session but with manual view
          await initializeSession(reportId, 'manual');
          setStage('data-entry');
          return;
        }
      }
      
      // Initialize or load session
      await initializeSession(reportId, initialView);
      setStage('data-entry');
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize valuation session');
    }
  }, [isAuthenticated, initializeSession]);

  // Validate and set report ID, then initialize session
  useEffect(() => {
    if (!reportId || !isValidReportId(reportId)) {
      // Invalid or missing report ID - generate new one
      const newReportId = generateReportId();
      navigate(UrlGeneratorService.reportById(newReportId), { replace: true });
      return;
    }
    
    setCurrentReportId(reportId);
    initializeSessionForReport(reportId);
  }, [reportId, navigate, initializeSessionForReport]);

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
        
        {stage === 'data-entry' && session && (
          <div className="relative h-full w-full">
            {/* Manual Flow Container */}
            <div 
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                session.currentView === 'manual' 
                  ? 'opacity-100 z-10 pointer-events-auto' 
                  : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <ManualValuationFlow 
                reportId={currentReportId}
                onComplete={handleValuationComplete}
              />
            </div>

            {/* AI-Guided Flow Container */}
            <div 
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ease-in-out ${
                session.currentView === 'ai-guided' 
                  ? 'opacity-100 z-10 pointer-events-auto' 
                  : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <AIAssistedValuation 
                reportId={currentReportId}
                onComplete={handleValuationComplete}
                initialQuery={prefilledQuery}
                autoSend={autoSend}
              />
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
        onTryManual={async () => {
          setShowOutOfCreditsModal(false);
          if (session) {
            await useValuationSessionStore.getState().switchView('manual');
          }
        }}
      />
    </div>
  );
};
