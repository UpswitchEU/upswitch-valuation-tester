import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { guestCreditService } from '../services/guestCreditService';
import { reportApiService } from '../services/reportApi';
import UrlGeneratorService from '../services/urlGenerator';
import { useValuationSessionStore } from '../store/useValuationSessionStore';
import type { ValuationResponse } from '../types/valuation';
import { generateReportId, isValidReportId } from '../utils/reportIdGenerator';
import { LoadingState } from './LoadingState';
import { INITIALIZATION_STEPS } from './LoadingState.constants';
import { OutOfCreditsModal } from './OutOfCreditsModal';

// Lazy load flow components for code splitting and performance
const ManualValuationFlow = lazy(() => import('./ManualValuationFlow').then(module => ({ default: module.ManualValuationFlow })));
const AIAssistedValuation = lazy(() => import('./AIAssistedValuation').then(module => ({ default: module.AIAssistedValuation })));

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

  // Track initialization state per reportId using ref to avoid dependency loops
  // Structure: Map<reportId, { initialized: boolean, isInitializing: boolean }>
  const initializationState = useRef<Map<string, { initialized: boolean; isInitializing: boolean }>>(new Map());
  
  // Initialize session on mount - only once per reportId
  const initializeSessionForReport = useCallback(async (reportId: string) => {
    const state = initializationState.current.get(reportId);
    
    // Prevent concurrent initialization attempts
    if (state?.isInitializing) {
      return; // Already initializing, wait for completion
    }
    
    // Prevent re-initialization if already initialized
    if (state?.initialized) {
      return; // Already initialized, don't re-initialize
    }
    
    // Check if we already have a session for this reportId
    const { session: currentSession } = useValuationSessionStore.getState();
    if (currentSession?.reportId === reportId && currentSession.currentView) {
      // Session exists, mark as initialized without calling initializeSession
      initializationState.current.set(reportId, { initialized: true, isInitializing: false });
      if (stage === 'loading') {
        setStage('data-entry');
      }
      return;
    }
    
    // Mark as initializing to prevent concurrent calls
    initializationState.current.set(reportId, { initialized: false, isInitializing: true });
    
    try {
      // Check for flow parameter in URL to set initial view
      const searchParams = new URLSearchParams(window.location.search);
      const flowParam = searchParams.get('flow');
      const initialView = (flowParam === 'manual' || flowParam === 'conversational') 
        ? flowParam 
        : 'manual'; // Default to manual
      
      // Validate credits for Conversational (guests only)
      if (initialView === 'conversational' && !isAuthenticated) {
        const hasCredits = guestCreditService.hasCredits();
        if (!hasCredits) {
          setShowOutOfCreditsModal(true);
          // Still initialize session but with manual view
          await initializeSession(reportId, 'manual');
          setStage('data-entry');
          initializationState.current.set(reportId, { initialized: true, isInitializing: false });
          return;
        }
      }
      
      // Initialize or load session with prefilled query from homepage
      await initializeSession(reportId, initialView, prefilledQuery);
      setStage('data-entry');
      initializationState.current.set(reportId, { initialized: true, isInitializing: false });
    } catch (error) {
      // On error, allow retry by not marking as initialized
      initializationState.current.set(reportId, { initialized: false, isInitializing: false });
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize valuation session');
    }
  }, [isAuthenticated, initializeSession, stage]);

  // Validate and set report ID, then initialize session
  useEffect(() => {
    if (!reportId || !isValidReportId(reportId)) {
      // Invalid or missing report ID - generate new one
      const newReportId = generateReportId();
      navigate(UrlGeneratorService.reportById(newReportId), { replace: true });
      return;
    }
    
    // Clean up initialization state for previous reportId if changed
    if (currentReportId && currentReportId !== reportId) {
      initializationState.current.delete(currentReportId);
    }
    
    setCurrentReportId(reportId);
    initializeSessionForReport(reportId);
  }, [reportId, navigate, initializeSessionForReport, currentReportId]);

  // Sync URL with current view - prevent loops by only updating when needed
  // Only sync after initialization is complete to avoid race conditions
  useEffect(() => {
    if (!session?.currentView || !session?.reportId) {
      return;
    }
    
    const state = initializationState.current.get(session.reportId);
    
    // Only sync URL if initialization is complete
    if (!state?.initialized) {
      return; // Wait for initialization to complete
    }
    
    const searchParams = new URLSearchParams(window.location.search);
    const currentFlow = searchParams.get('flow');
    
    // Only update URL if it's different - this prevents infinite loops
    if (currentFlow !== session.currentView) {
      searchParams.set('flow', session.currentView);
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [session?.currentView, session?.reportId]);

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
          <LoadingState 
            steps={INITIALIZATION_STEPS} 
            variant="dark" 
          />
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-rust-500/20 border border-rust-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-rust-400 mb-2">Error</h3>
                <p className="text-rust-300 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setStage('flow-selection');
                  }}
                  className="px-4 py-2 bg-rust-600 hover:bg-rust-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {stage === 'data-entry' && session && (
          <div className="relative h-full w-full">
            {/* Conditionally render only the active flow component for better performance */}
            {/* Smooth fade transition when switching flows */}
            {session.currentView === 'manual' && (
              <div className="absolute inset-0 animate-in fade-in duration-300">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      <span className="text-sm">Loading manual flow...</span>
                    </div>
                  </div>
                }>
                  <ManualValuationFlow 
                    reportId={currentReportId}
                    onComplete={handleValuationComplete}
                  />
                </Suspense>
              </div>
            )}

            {session.currentView === 'conversational' && (
              <div className="absolute inset-0 animate-in fade-in duration-300">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      <span className="text-sm">Loading conversational flow...</span>
                    </div>
                  </div>
                }>
                  <AIAssistedValuation 
                    reportId={currentReportId}
                    onComplete={handleValuationComplete}
                    initialQuery={prefilledQuery}
                    autoSend={autoSend}
                  />
                </Suspense>
              </div>
            )}
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
            // Skip confirmation for out-of-credits flow (user explicitly chose manual)
            await useValuationSessionStore.getState().switchView('manual', true, true);
          }
        }}
      />
    </div>
  );
};
