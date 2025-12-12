/**
 * ConversationalValuationFlow Component
 * 
 * Orchestrator for conversational AI-assisted valuation workflow.
 * Handles conversation persistence, session restoration, and progressive report generation.
 * 
 * Features:
 * - Loads existing conversations from backend persistence
 * - Starts new conversations when needed
 * - Robust race condition handling
 * - Progressive report generation
 * 
 * @module features/valuation/components/ConversationalValuationFlow
 */

import { Building2, Edit3, TrendingUp } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { FullScreenModal } from '../../../components/FullScreenModal';
import { HTMLView } from '../../../components/HTMLView';
import { LoadingState } from '../../../components/LoadingState';
import { GENERATION_STEPS } from '../../../components/LoadingState.constants';
import { RegenerationWarningModal } from '../../../components/RegenerationWarningModal';
import { ResizableDivider } from '../../../components/ResizableDivider';
import { ValuationEmptyState } from '../../../components/ValuationEmptyState';
import { ValuationToolbar } from '../../../components/ValuationToolbar';
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../../../constants/panelConstants';
import { useAuth } from '../../../hooks/useAuth';
import { backendAPI } from '../../../services/backendApi';
import { businessDataService, type BusinessProfileData } from '../../../services/businessDataService';
import { guestCreditService } from '../../../services/guestCreditService';
import UrlGeneratorService from '../../../services/urlGenerator';
import { useValuationSessionStore } from '../../../store/useValuationSessionStore';
import { useValuationStore } from '../../../store/useValuationStore';
import type { ConversationContext, ValuationRequest, ValuationResponse } from '../../../types/valuation';
import { chatLogger } from '../../../utils/logger';
import { generateReportId } from '../../../utils/reportIdGenerator';
import { CreditGuard } from '../../auth/components/CreditGuard';
import { ConversationPanel } from '../../conversation/components/ConversationPanel';
import { useConversationStateManager } from '../../conversation/hooks/useConversationStateManager';
import { useValuationOrchestrator } from '../hooks/useValuationOrchestrator';
const ValuationInfoPanel = React.lazy(() => import('../../../components/ValuationInfoPanel').then(m => ({ default: m.ValuationInfoPanel })));
const Results = React.lazy(() => import('../../../components/Results').then(m => ({ default: m.Results })));

// Loader component for Suspense fallback (matches ManualValuationFlow)
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-zinc-600">{message}</span>
    </div>
  </div>
);

interface AIAssistedValuationProps {
  reportId: string;
  onComplete: (result: ValuationResponse) => void;
  initialQuery?: string | null;
  autoSend?: boolean;
}

/**
 * Refactored AI-Assisted Valuation Component
 * 
 * Orchestrates the valuation workflow by:
 * - Managing session and restoration via useValuationOrchestrator
 * - Rendering conversation panel (left)
 * - Rendering report panel (right)
 * - Handling UI state (panels, modals, toolbars)
 */
export const ConversationalValuationFlow: React.FC<AIAssistedValuationProps> = ({ 
  reportId, 
  onComplete,
  initialQuery = null,
  autoSend = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const { session, updateSessionData, getSessionData, clearSession } = useValuationSessionStore();
  const { setResult: setStoreResult } = useValuationStore();
  
  // Session IDs
  const [sessionId] = useState<string>(() => {
    if (session?.sessionId) return session.sessionId;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomId}`;
  });
  const [pythonSessionId, setPythonSessionId] = useState<string | null>(null);
  const [isRestoredSessionId, setIsRestoredSessionId] = useState(false);
  
  // Business profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false);
  
  // Conversation context (for future use)
  const [_conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  
  // Collected data state (for syncing to session)
  const [_collectedData, setCollectedData] = useState<Record<string, any>>({});
  
  // Final report HTML (from backend when valuation completes)
  const [finalReportHtmlState, setFinalReportHtmlState] = useState<string>('');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat');
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('upswitch-panel-width');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= PANEL_CONSTRAINTS.MIN_WIDTH && parsed <= PANEL_CONSTRAINTS.MAX_WIDTH) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved panel width:', error);
    }
    return PANEL_CONSTRAINTS.DEFAULT_WIDTH;
  });
  
  // Regeneration modal
  const [showRegenerationWarning, setShowRegenerationWarning] = useState(false);
  const [pendingValuationResult, setPendingValuationResult] = useState<ValuationResponse | null>(null);
  const [regenerateConfirmed, setRegenerateConfirmed] = useState(false);
  
  // Main orchestrator hook
  const {
    stage,
    setStage,
    valuationResult,
    setValuationResult,
    error,
    setError: _setError,
    restoredMessages,
    isRestoring,
    isRestorationComplete,
    isSessionInitialized,
    hasCredits,
    isBlocked,
    showOutOfCreditsModal,
    setShowOutOfCreditsModal,
    finalReportHtml,
    isGenerating,
    setIsGenerating,
    handleValuationComplete: handleValuationCompleteInternal,
  } = useValuationOrchestrator({
    reportId,
    sessionId,
    pythonSessionId,
    isRestoredSessionId,
    session,
    user,
    isAuthenticated,
    onComplete,
  });

  // Session management is now handled by the centralized state manager in useValuationOrchestrator
  // This component just needs to handle session ID updates from the conversation
  const handlePythonSessionIdReceived = useCallback((newPythonSessionId: string) => {
    chatLogger.info('Python sessionId received, updating centralized state', {
      pythonSessionId: newPythonSessionId,
      reportId
    });

    // The centralized state manager will handle this
    // Just save to backend session for persistence
    updateSessionData({
      pythonSessionId: newPythonSessionId
    } as Partial<ValuationRequest>).catch(err => {
      chatLogger.error('Failed to save pythonSessionId', { error: err });
    });
  }, [updateSessionData, reportId]);

  // Handle data collection events - sync to session store
  const handleDataCollected = useCallback((data: any) => {
    chatLogger.debug('Data collected in AIAssistedValuation', { 
      field: data.field,
      hasValue: !!data.value 
    });
    
    // Preserve sanitized structure from StreamEventHandler
    setCollectedData(prev => {
      if (data.field && typeof data.field === 'string') {
        return {
          ...prev,
          [data.field]: {
            ...data,
            value: typeof data.value === 'string' ? data.value : String(data.value || 'Not provided')
          }
        };
      } else {
        chatLogger.warn('Data collected in unexpected format', { 
          hasField: !!data.field,
          dataKeys: Object.keys(data)
        });
        return {
          ...prev,
          ...data
        };
      }
    });
    
    // Sync collected data to session store
    if (data.field && data.value !== undefined) {
      const sessionUpdate: Partial<any> = {};
      
      // Map common fields
      if (data.field === 'revenue' || data.field === 'ebitda' || data.field === 'net_income') {
        const numValue = typeof data.value === 'string' ? parseFloat(data.value.replace(/[^0-9.-]/g, '')) : data.value;
        if (!isNaN(numValue)) {
          if (!sessionUpdate.current_year_data) {
            sessionUpdate.current_year_data = {};
          }
          sessionUpdate.current_year_data[data.field] = numValue;
        }
      } else if (data.field === 'company_name') {
        sessionUpdate.company_name = data.value;
      } else if (data.field === 'industry') {
        sessionUpdate.industry = data.value;
      } else if (data.field === 'country_code') {
        sessionUpdate.country_code = data.value;
      } else if (data.field === 'founding_year') {
        sessionUpdate.founding_year = parseInt(data.value) || undefined;
      }
      
      // Update session if we have data to sync
      if (Object.keys(sessionUpdate).length > 0) {
        updateSessionData(sessionUpdate).catch(err => {
          chatLogger.warn('Failed to sync collected data to session:', err);
        });
      }
    }
  }, [updateSessionData]);

  // Handle report update (for final HTML report from backend)
  const handleReportUpdate = useCallback((htmlContent: string, _progress: number) => {
    setFinalReportHtmlState(htmlContent);
  }, []);


  // No-op handlers (kept for backward compatibility)
  const handleValuationPreview = useCallback((_preview: any) => {
    // Valuation preview handled silently
  }, []);

  const handleCalculateOption = useCallback((_option: any) => {
    // Calculate option handled silently
  }, []);

  const handleProgressUpdate = useCallback((_progress: any) => {
    // Progress updates handled silently
  }, []);

  const handleHtmlPreviewUpdate = useCallback((_html: string, _previewType: string) => {
    // HTML preview is now handled by the progressive report system
  }, []);

  // Handle valuation complete with regeneration check
  const handleValuationComplete = useCallback(async (result: ValuationResponse) => {
    const hasExistingReport = result?.valuation_id && result?.html_report;
    if (hasExistingReport && !regenerateConfirmed) {
      setPendingValuationResult(result);
      setShowRegenerationWarning(true);
      return;
    }
    setRegenerateConfirmed(false);
    await handleValuationCompleteInternal(result);
    
    // Update frontend credit count
    if (!isAuthenticated && (result as any).creditsRemaining !== undefined) {
      guestCreditService.setCredits((result as any).creditsRemaining);
    }
    
    // Mark session as completed
    if (session) {
      try {
        await backendAPI.updateValuationSession(session.reportId, {
          completedAt: new Date().toISOString(),
        });
      } catch (error) {
        chatLogger.warn('Failed to mark session as completed', { error });
      }
    }
  }, [regenerateConfirmed, handleValuationCompleteInternal, isAuthenticated, session]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save panel width
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }, [leftPanelWidth]);

  // Fetch business profile data on component mount
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setProfileError(null);

        // Check if user is authenticated
        if (!isAuthenticated || !user?.id) {
          chatLogger.info('No authenticated user, skipping profile fetch');
          setIsLoadingProfile(false);
          return;
        }

        const userId = user.id;
        
        chatLogger.debug('Fetching business profile for instant valuation');
        const profileData = await businessDataService.fetchUserBusinessData(userId);
        
        if (profileData) {
          setBusinessProfile(profileData);
          chatLogger.info('Business profile loaded', { profileData });

          // Automatically start intelligent conversation with pre-filled data
          startIntelligentConversation(profileData);
        } else {
          chatLogger.info('No business profile found, starting fresh conversation');
          // For fresh conversations (guest users), start the conversation automatically
          setStage('chat');
        }
        
      } catch (error) {
        chatLogger.error('Error fetching business profile', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setProfileError('Failed to load business profile. Starting fresh conversation.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchBusinessProfile();
  }, [isAuthenticated, user?.id]);

  // Start intelligent conversation with pre-filled data
  const startIntelligentConversation = useCallback(async (profileData: BusinessProfileData) => {
    // CHECK CREDITS BEFORE STARTING (for guests)
    if (!isAuthenticated && !guestCreditService.hasCredits()) {
      chatLogger.warn('Guest user out of credits - blocking conversation start');
      setShowOutOfCreditsModal(true);
      return;
    }
    
    try {
      chatLogger.info('Starting intelligent conversation with pre-filled data');
      
      // Transform business data to conversation request
      const conversationRequest = businessDataService.transformToConversationStartRequest(profileData, {
        time_commitment: 'detailed',
        focus_area: 'all'
      });

      // Add user_id for intelligent triage
      if (user?.id) {
        conversationRequest.user_id = user.id;
        chatLogger.info('Added user_id for intelligent triage', { userId: user.id });
      }

      // Start conversation with valuation engine
      const { api } = await import('../../../services/api');
      const response = await api.startConversation(conversationRequest);
      
      chatLogger.info('Intelligent conversation started', { response });
      
      // If we have financial data from KBO lookup, go to results
      if (response.valuation_result) {
        setStage('results');
        setValuationResult(response.valuation_result);
      } else {
        // Start with conversational data collection
        setStage('chat');
      }
      
    } catch (error) {
      chatLogger.error('Error starting intelligent conversation', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setProfileError('Failed to start intelligent conversation. Using manual flow.');
      setStage('chat');
    }
  }, [isAuthenticated, user?.id, setStage, setValuationResult, setShowOutOfCreditsModal]);

  // Sync valuationResult to store so Results component can access it (like ManualValuationFlow)
  useEffect(() => {
    if (valuationResult) {
      setStoreResult(valuationResult);
    }
  }, [valuationResult, setStoreResult]);

  // Handle resize
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(PANEL_CONSTRAINTS.MIN_WIDTH, Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth));
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH);
    } else {
      setLeftPanelWidth(constrainedWidth);
    }
  }, []);

  // Toolbar handlers
  const handleRefresh = useCallback(() => {
    clearSession();
    const newReportId = generateReportId();
    window.location.href = UrlGeneratorService.reportById(newReportId);
  }, [clearSession]);

  return (
    <CreditGuard
      hasCredits={hasCredits}
      isBlocked={isBlocked}
      showOutOfCreditsModal={showOutOfCreditsModal}
      onCloseModal={() => setShowOutOfCreditsModal(false)}
      onSignUp={() => {
        setShowOutOfCreditsModal(false);
        console.log('Sign up clicked');
      }}
      onTryManual={() => {
        setShowOutOfCreditsModal(false);
        console.log('Try manual flow clicked');
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <ValuationToolbar
          onRefresh={handleRefresh}
          onDownload={async () => {
            if (valuationResult && finalReportHtml) {
              try {
                const { DownloadService } = await import('../../../services/downloadService');
                const valuationData = {
                  companyName: businessProfile?.company_name || 'Company',
                  valuationAmount: valuationResult.equity_value_mid,
                  valuationDate: new Date(),
                  method: valuationResult.methodology || 'DCF Analysis',
                  confidenceScore: valuationResult.confidence_score,
                  inputs: {
                    revenue: businessProfile?.revenue,
                    ebitda: businessProfile?.ebitda,
                    industry: businessProfile?.industry,
                    employees: businessProfile?.employees
                  },
                  assumptions: {
                    growth_rate: '5%',
                    discount_rate: '10%',
                    terminal_growth: '2%'
                  },
                  htmlContent: finalReportHtmlState || finalReportHtml || valuationResult?.html_report || ''
                };
                await DownloadService.downloadPDF(valuationData, {
                  format: 'pdf',
                  filename: DownloadService.getDefaultFilename(businessProfile?.company_name, 'pdf')
                });
              } catch (error) {
                console.error('Download failed:', error);
              }
            }
          }}
          onFullScreen={() => setIsFullScreen(true)}
          isGenerating={isGenerating}
          user={user}
          valuationName="Valuation"
          valuationId={valuationResult?.valuation_id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          companyName={businessProfile?.company_name}
          valuationMethod={valuationResult?.methodology}
        />

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4">
            <div className="bg-rust-500/20 border border-rust-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-rust-300">
                <span className="text-rust-400">⚠️</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-rust-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Business Profile Summary */}
        {businessProfile && !isLoadingProfile && (
          <div className="border-b border-zinc-800 bg-zinc-900/30 px-3 sm:px-4 md:px-6 py-3 mx-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-white truncate">
                  {businessProfile.company_name || 'Your Business'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {businessProfile.industry && (
                    <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.industry}</span>
                  )}
                  {businessProfile.business_type && (
                    <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.business_type}</span>
                  )}
                  {businessProfile.revenue_range && (
                    <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.revenue_range}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {businessDataService.getDataCompleteness(businessProfile)}% complete
              </div>
            </div>
          </div>
        )}

        {/* Pre-Conversation Summary */}
        {showPreConversationSummary && businessProfile && (
          <div className="mx-4 mb-4">
            <div className="bg-primary-900/20 border border-primary-700/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-400 text-sm">🧠</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary-300 mb-2">Intelligent Triage Active</h3>
                  <p className="text-sm text-primary-200 mb-3">
                    We found your business profile! We'll skip the questions we already know and only ask for missing information.
                  </p>
                  
                  {(() => {
                    const analysis = businessDataService.getFieldAnalysis(businessProfile);
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-primary-300">Data completeness:</span>
                          <span className="font-semibold text-primary-200">{analysis.completeness}%</span>
                          <div className="flex-1 bg-zinc-700 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${analysis.completeness}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="text-sm text-primary-200">
                          <span className="text-primary-300">Estimated time:</span> {analysis.estimatedTime} minutes
                        </div>
                        
                        {analysis.complete.length > 0 && (
                          <div className="text-sm">
                            <span className="text-primary-300">We already know:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.complete.map(field => (
                                <span key={field} className="bg-primary-800/50 px-2 py-1 rounded text-xs">
                                  {field.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {analysis.priority.length > 0 && (
                          <div className="text-sm">
                            <span className="text-primary-300">We need to ask about:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysis.priority.map(field => (
                                <span key={field} className="bg-accent-800/50 px-2 py-1 rounded text-xs">
                                  {field.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              setShowPreConversationSummary(false);
                              startIntelligentConversation(businessProfile);
                            }}
                            className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Start Smart Conversation
                          </button>
                          <button
                            onClick={() => {
                              setShowPreConversationSummary(false);
                              // Start fresh conversation without pre-filled data
                              setStage('chat');
                            }}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            Start Fresh
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {profileError && (
          <div className="border-b border-rust-700 bg-rust-500/20 px-3 sm:px-4 md:px-6 py-3 mx-4">
            <div className="flex items-center gap-2 text-sm text-rust-300">
              <span>⚠️</span>
              <span>{profileError}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingProfile && (
          <div className="flex items-center justify-center h-32 mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-zinc-400 text-sm">Loading your business profile...</p>
            </div>
          </div>
        )}

        {/* Split Panel */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800" style={{transition: 'width 150ms ease-out'}}>
          {/* Left Panel: Chat */}
          <div 
            className={`${
              isMobile ? (mobileActivePanel === 'chat' ? 'w-full' : 'hidden') : ''
            } h-full flex flex-col bg-zinc-900 border-r border-zinc-800 w-full lg:w-auto`}
            style={{ 
              width: isMobile ? '100%' : `${leftPanelWidth}%`
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <ConversationPanel
              sessionId={sessionId}
              userId={user?.id}
              restoredMessages={restoredMessages}
              isRestoring={isRestoring}
              isRestorationComplete={isRestorationComplete}
              isSessionInitialized={isSessionInitialized}
              pythonSessionId={pythonSessionId}
              onPythonSessionIdReceived={handlePythonSessionIdReceived}
              onValuationComplete={handleValuationComplete}
              onValuationStart={() => setIsGenerating(true)}
              onReportUpdate={handleReportUpdate}
              onDataCollected={handleDataCollected}
              onValuationPreview={handleValuationPreview}
              onCalculateOptionAvailable={handleCalculateOption}
              onProgressUpdate={handleProgressUpdate}
              onReportSectionUpdate={(_section: string, _html: string, _phase: number, _progress: number, _isFallback?: boolean, _isError?: boolean, _errorMessage?: string) => {
                // Progressive report generation not used in conversational flow
              }}
              onSectionLoading={(_section: string, _html: string, _phase: number, _data?: any) => {
                // Progressive report generation not used in conversational flow
              }}
              onSectionComplete={(_event: any) => {
                // Progressive report generation not used in conversational flow
              }}
              onReportComplete={(html: string, _valuationId: string) => {
                setFinalReportHtmlState(html);
              }}
              onContextUpdate={setConversationContext}
              onHtmlPreviewUpdate={handleHtmlPreviewUpdate}
              initialMessage={initialQuery}
              autoSend={autoSend}
              initialData={getSessionData() || undefined}
            />
            </div>
          </div>

          {/* Resizable Divider */}
          <ResizableDivider 
            onResize={handleResize} 
            leftWidth={leftPanelWidth}
            isMobile={isMobile}
          />

          {/* Right Panel: Report Display (matches manual flow exactly) */}
          <div 
            className={`${
              isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
            } h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-hidden w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
            style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
          >
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
            {activeTab === 'preview' && (
              <div className="h-full">
                {/* During conversation: Show empty state (no progressive reports per requirements) */}
                {stage === 'chat' && (
                  <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                      Your valuation report will appear here once the conversation is complete.
                    </p>
                  </div>
                )}
                
                {/* After conversation: Show Results component (same as manual flow) */}
                {stage === 'results' && valuationResult?.html_report ? (
                  <Suspense fallback={<ComponentLoader message="Loading report..." />}>
                    <Results />
                  </Suspense>
                ) : stage !== 'chat' ? (
                  <ValuationEmptyState />
                ) : null}
              </div>
            )}

            {activeTab === 'source' && (
              <HTMLView result={valuationResult} />
            )}

            {activeTab === 'info' && (
              <div className="h-full">
                {/* Show loading state during generation */}
                {isGenerating ? (
                  <LoadingState 
                    steps={GENERATION_STEPS}
                    variant="light"
                    centered={true}
                  />
                ) : valuationResult ? (
                  <Suspense fallback={<ComponentLoader message="Loading calculation details..." />}>
                    <ValuationInfoPanel result={valuationResult} />
                  </Suspense>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Calculation Details</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                      Detailed calculation breakdown will appear here once the conversation is complete.
                    </p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        {isMobile && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-zinc-800 p-1 rounded-full shadow-lg">
            <button
              onClick={() => setMobileActivePanel('chat')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'chat' ? 'bg-accent-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileActivePanel('preview')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'preview' ? 'bg-accent-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        {/* Regeneration Warning Modal */}
        <RegenerationWarningModal
          isOpen={showRegenerationWarning}
          completedAt={session?.completedAt}
          onConfirm={async () => {
            setShowRegenerationWarning(false);
            setRegenerateConfirmed(true);
            if (pendingValuationResult) {
              setTimeout(async () => {
                await handleValuationComplete(pendingValuationResult);
                setPendingValuationResult(null);
              }, 0);
            }
          }}
          onCancel={() => {
            setShowRegenerationWarning(false);
            setPendingValuationResult(null);
            setRegenerateConfirmed(false);
          }}
        />

        {/* Full Screen Modal */}
        <FullScreenModal
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          title="Valuation - Full Screen"
        >
          {activeTab === 'preview' && valuationResult?.html_report && (
            <Suspense fallback={<ComponentLoader message="Loading report..." />}>
              <Results />
            </Suspense>
          )}
          {activeTab === 'source' && valuationResult && (
            <HTMLView result={valuationResult} />
          )}
          {activeTab === 'info' && (
            <div className="h-full">
              {/* Show loading state during generation */}
              {isGenerating ? (
                <LoadingState 
                  steps={GENERATION_STEPS}
                  variant="light"
                  centered={true}
                />
              ) : valuationResult ? (
                <Suspense fallback={<ComponentLoader message="Loading calculation details..." />}>
                  <ValuationInfoPanel result={valuationResult} />
                </Suspense>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                    <Edit3 className="w-6 h-6 sm:w-8 sm:w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Calculation Details</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                    Detailed calculation breakdown will appear here once the conversation is complete.
                  </p>
                </div>
              )}
            </div>
          )}
        </FullScreenModal>
      </div>

      <style>{`
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        
        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </CreditGuard>
  );
};

