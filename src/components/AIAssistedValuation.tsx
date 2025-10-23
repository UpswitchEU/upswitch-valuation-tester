import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
import { CheckCircle, Save, Building2 } from 'lucide-react';
import { PANEL_CONSTRAINTS, MOBILE_BREAKPOINT } from '../constants/panelConstants';
import { StreamingChat } from './StreamingChat';
import { LiveValuationReport } from './LiveValuationReport';
import { ErrorBoundary } from './ErrorBoundary';
import { ValuationToolbar } from './ValuationToolbar';
import { ValuationInfoPanel } from './ValuationInfoPanel';
import { FullScreenModal } from './FullScreenModal';
import { ResizableDivider } from './ResizableDivider';
import { ValuationEmptyState } from './ValuationEmptyState';
import { businessDataService, type BusinessProfileData } from '../services/businessDataService';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ValuationResponse } from '../types/valuation';
import { chatLogger } from '../utils/logger';
import { DownloadService } from '../services/downloadService';


type FlowStage = 'chat' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  
  // New state for lovable experience features (commented out for now)
  // const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  // const [valuationPreview, setValuationPreview] = useState<any>(null);
  // const [progressSummary, setProgressSummary] = useState<any>(null);
  // const [calculateOption, setCalculateOption] = useState<any>(null);
  
  // Panel resize state with localStorage persistence
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat');
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save panel width to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }, [leftPanelWidth]);
  
  // Resize handler
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(PANEL_CONSTRAINTS.MIN_WIDTH, Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth));
    setLeftPanelWidth(constrainedWidth);
  }, []);

  // Mobile panel switcher
  const switchMobilePanel = useCallback((panel: 'chat' | 'preview') => {
    setMobileActivePanel(panel);
  }, []);
  
  // NEW: Business profile data state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // NEW: Live HTML report state
  const [liveHtmlReport, setLiveHtmlReport] = useState<string>('');
  const [reportProgress, setReportProgress] = useState<number>(0);

  // NEW: Toolbar state
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [valuationName] = useState('Valuation test123');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // NEW: Handle live report updates from streaming
  const handleReportUpdate = useCallback((htmlContent: string, progress: number) => {
    setLiveHtmlReport(htmlContent);
    setReportProgress(progress);
  }, []);

  // NEW: Handle data collection events
  const handleDataCollected = useCallback((data: any) => {
    console.log('Data collected in AIAssistedValuation:', data);
    // Update local state if needed
  }, []);

  // NEW: Handle valuation preview events
  const handleValuationPreview = useCallback((preview: any) => {
    console.log('Valuation preview in AIAssistedValuation:', preview);
    // Update local state if needed
  }, []);

  // NEW: Handle calculate option events
  const handleCalculateOption = useCallback((option: any) => {
    console.log('Calculate option in AIAssistedValuation:', option);
    // Update local state if needed
  }, []);

  // NEW: Handle progress update events
  const handleProgressUpdate = useCallback((progress: any) => {
    console.log('Progress update in AIAssistedValuation:', progress);
    // Update local state if needed
  }, []);

  // NEW: Start intelligent conversation with pre-filled data
  const startIntelligentConversation = useCallback(async (profileData: BusinessProfileData) => {
    try {
      chatLogger.info('Starting intelligent conversation');
      
      // Transform business data to conversation request
      const conversationRequest = businessDataService.transformToConversationStartRequest(profileData, {
        time_commitment: 'detailed',
        focus_area: 'all'
      });

      // Start conversation with valuation engine
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
  }, []);

  // NEW: Fetch business profile data on component mount
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
          
          // Check if we have enough data to start conversation
          if (businessDataService.hasCompleteBusinessProfile(profileData)) {
            chatLogger.info('Starting intelligent conversation with pre-filled data');
            await startIntelligentConversation(profileData);
          } else {
            chatLogger.warn('Incomplete business profile, will collect missing data');
            const missingFields = businessDataService.getMissingFields(profileData);
            chatLogger.debug('Missing fields', { missingFields });
          }
        } else {
          chatLogger.info('No business profile found, starting fresh conversation');
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
  }, [isAuthenticated, user?.id, startIntelligentConversation]);



  const handleValuationComplete = (valuationResult: ValuationResponse) => {
    chatLogger.info('Valuation complete callback triggered', { 
      hasResult: !!valuationResult,
      valuationId: valuationResult?.valuation_id,
      equityValue: valuationResult?.equity_value_mid
    });
    
    setValuationResult(valuationResult);
    setStage('results');
    
    chatLogger.info('Valuation complete, moving to results stage', { 
      stage: 'results',
      hasValuationResult: !!valuationResult
    });
  };


  const handleStartOver = () => {
    setStage('chat');
    setValuationResult(null);
    setReportSaved(false);
  };

  // NEW: Toolbar handlers
  const handleRefresh = () => {
    if (valuationResult) {
      setIsGenerating(true);
      // Regenerate valuation with same inputs
      // This would typically call the API again
      setTimeout(() => {
        setIsGenerating(false);
      }, 2000);
    }
  };

  const handleDownload = async () => {
    if (valuationResult && liveHtmlReport) {
      try {
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
          htmlContent: liveHtmlReport
        };

        await DownloadService.downloadPDF(valuationData, {
          format: 'pdf',
          filename: DownloadService.getDefaultFilename(businessProfile?.company_name, 'pdf')
        });
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleFullScreen = () => {
    setIsFullScreen(true);
  };

  const handleTabChange = (tab: 'preview' | 'source' | 'info') => {
    setActiveTab(tab);
  };

  return (
    <>
      {/* NEW: ValuationToolbar */}
      <ValuationToolbar
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        onFullScreen={handleFullScreen}
        isGenerating={isGenerating || stage === 'chat'}
        user={user}
        valuationName={valuationName}
        valuationId={valuationResult?.valuation_id}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        companyName={businessProfile?.company_name}
        valuationMethod={valuationResult?.methodology}
      />

      {/* Business Profile Summary */}
      {businessProfile && !isLoadingProfile && (
        <div className="border-b border-zinc-800 bg-zinc-900/30 px-3 sm:px-4 md:px-6 py-3 mx-2 sm:mx-4">
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

      {/* Error Message */}
      {profileError && (
        <div className="border-b border-red-800 bg-red-900/20 px-3 sm:px-4 md:px-6 py-3 mx-2 sm:mx-4">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <span>⚠️</span>
            <span>{profileError}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingProfile && (
        <div className="flex items-center justify-center h-32 mx-2 sm:mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-zinc-400 text-sm">Loading your business profile...</p>
          </div>
        </div>
      )}

      {/* Full-screen Split Panel - Ilara Style */}
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
          {/* Success Banner when results are ready */}
          {stage === 'results' && valuationResult && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 m-3 sm:m-6 mb-0">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      Valuation Complete!
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 mb-2 sm:mb-3">
                      <span className="hidden lg:inline">Your report is displayed on the right. Scroll below to see the conversation history.</span>
                      <span className="lg:hidden">Your report is displayed below. Scroll down to see the conversation history.</span>
                    </p>
                    {reportSaved && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-green-400">
                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-medium">Auto-saved to Reports</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
                  >
                    Value Another Company
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat - Always visible */}
          {(stage === 'chat' || stage === 'results') && (
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary 
                componentName="StreamingChat"
                onRetry={() => {
                  // Clear any problematic state and reinitialize
                  setValuationResult(null);
                  setLiveHtmlReport('');
                  setReportProgress(0);
                }}
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-zinc-400 mb-4">Chat temporarily unavailable. Please refresh.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                }
              >
                <StreamingChat
                  sessionId={`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}
                  userId={user?.id}
                  onValuationComplete={handleValuationComplete}
                  onReportUpdate={handleReportUpdate}
                  onDataCollected={handleDataCollected}
                  onValuationPreview={handleValuationPreview}
                  onCalculateOptionAvailable={handleCalculateOption}
                  onProgressUpdate={handleProgressUpdate}
                  className="h-full"
                  placeholder="Ask about your business valuation..."
                />
              </ErrorBoundary>
            </div>
          )}

        </div>

        {/* Resizable Divider */}
        <ResizableDivider 
          onResize={handleResize} 
          leftWidth={leftPanelWidth}
          isMobile={isMobile}
        />

        {/* Right Panel: Live Report */}
        <div 
          className={`${
            isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
          } h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-y-auto w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
          style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
        >
          {/* Tab Content */}
          {activeTab === 'preview' && (
            liveHtmlReport ? (
              <LiveValuationReport
                htmlContent={liveHtmlReport}
                isGenerating={stage === 'chat'}
                progress={reportProgress}
              />
            ) : (
              <ValuationEmptyState />
            )
          )}

          {activeTab === 'source' && (
            <div className="h-full bg-white p-6 overflow-y-auto">
              <div className="relative">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(liveHtmlReport || '');
                      // You could add a toast notification here
                    } catch (err) {
                      console.error('Failed to copy text:', err);
                    }
                  }}
                  className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy code"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <pre
                  className="p-4 bg-gray-50 rounded-lg overflow-auto border border-gray-200 max-h-[calc(100vh-200px)] min-h-[400px]"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 #F1F5F9',
                  }}
                >
                  <code
                    className="text-sm text-black block whitespace-pre-wrap"
                    style={{
                      WebkitUserSelect: 'text',
                      userSelect: 'text',
                    }}
                  >
                    {liveHtmlReport || 'No source code available'}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'info' && valuationResult && (
            <ValuationInfoPanel
              valuationId={valuationResult.valuation_id}
              companyName={businessProfile?.company_name}
              valuationMethod={valuationResult.methodology}
              valuationDate={new Date(valuationResult.valuation_date || Date.now())}
              inputs={{
                revenue: businessProfile?.revenue,
                ebitda: businessProfile?.ebitda,
                industry: businessProfile?.industry,
                employees: businessProfile?.employees
              }}
              assumptions={{
                growth_rate: '5%',
                discount_rate: '10%',
                terminal_growth: '2%'
              }}
              confidenceScore={valuationResult.confidence_score}
              dataQuality="High"
            />
          )}

          {stage === 'results' && valuationResult && activeTab === 'preview' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Valuation Complete</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-zinc-900 mb-2">Equity Value</h4>
                    <div className="text-2xl font-bold text-green-600">
                      €{valuationResult.equity_value_mid?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-zinc-900 mb-2">Valuation Range</h4>
                    <div className="text-sm text-zinc-600">
                      €{valuationResult.equity_value_low?.toLocaleString()} - €{valuationResult.equity_value_high?.toLocaleString()}
                    </div>
                  </div>
                  
                  {valuationResult.confidence_score && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-zinc-900 mb-2">Confidence Score</h4>
                      <div className="text-sm text-zinc-600">
                        {(valuationResult.confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                  
                  {valuationResult.methodology && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-zinc-900 mb-2">Methodology</h4>
                      <div className="text-sm text-zinc-600">
                        {valuationResult.methodology}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Panel Switcher */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-zinc-800 p-1 rounded-full shadow-lg">
          <button
            onClick={() => switchMobilePanel('chat')}
            className={`px-4 py-2 rounded-full transition-colors ${
              mobileActivePanel === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => switchMobilePanel('preview')}
            className={`px-4 py-2 rounded-full transition-colors ${
              mobileActivePanel === 'preview'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      )}

      {/* Full Screen Modal */}
      <FullScreenModal
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title={`${valuationName} - Full Screen`}
      >
        {activeTab === 'preview' && (
          <LiveValuationReport
            htmlContent={liveHtmlReport}
            isGenerating={stage === 'chat'}
            progress={reportProgress}
          />
        )}
        {activeTab === 'source' && (
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="relative">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(liveHtmlReport || '');
                    // You could add a toast notification here
                  } catch (err) {
                    console.error('Failed to copy text:', err);
                  }
                }}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy code"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <pre
                className="p-4 bg-gray-50 rounded-lg overflow-auto border border-gray-200 max-h-[calc(100vh-200px)] min-h-[400px]"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 #F1F5F9',
                }}
              >
                <code
                  className="text-sm text-black block whitespace-pre-wrap"
                  style={{
                    WebkitUserSelect: 'text',
                    userSelect: 'text',
                  }}
                >
                  {liveHtmlReport || 'No source code available'}
                </code>
              </pre>
            </div>
          </div>
        )}
        {activeTab === 'info' && valuationResult && (
          <ValuationInfoPanel
            valuationId={valuationResult.valuation_id}
            companyName={businessProfile?.company_name}
            valuationMethod={valuationResult.methodology}
            valuationDate={new Date(valuationResult.valuation_date || Date.now())}
            inputs={{
              revenue: businessProfile?.revenue,
              ebitda: businessProfile?.ebitda,
              industry: businessProfile?.industry,
              employees: businessProfile?.employees
            }}
            assumptions={{
              growth_rate: '5%',
              discount_rate: '10%',
              terminal_growth: '2%'
            }}
            confidenceScore={valuationResult.confidence_score}
            dataQuality="High"
          />
        )}
      </FullScreenModal>
    </>
  );
};
