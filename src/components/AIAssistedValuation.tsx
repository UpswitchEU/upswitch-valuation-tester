import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CheckCircle, Save, ArrowLeft, Building2 } from 'lucide-react';
import { ConversationalChat } from './ConversationalChat';
import { businessDataService, type BusinessProfileData } from '../services/businessDataService';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { ValuationResponse } from '../types/valuation';

type FlowStage = 'chat' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // NEW: Business profile data state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // NEW: Start intelligent conversation with pre-filled data
  const startIntelligentConversation = useCallback(async (profileData: BusinessProfileData) => {
    try {
      console.log('🤖 Starting intelligent conversation...');
      
      // Transform business data to conversation request
      const conversationRequest = businessDataService.transformToConversationStartRequest(profileData, {
        time_commitment: 'detailed',
        focus_area: 'all'
      });

      // Start conversation with valuation engine
      const response = await api.startConversation(conversationRequest);
      
      console.log('✅ Intelligent conversation started:', response);
      
      // If we have financial data from KBO lookup, go to preview
      if (response.current_valuation) {
        setStage('preview');
        setValuationResult(response.current_valuation);
      } else {
        // Start with conversational data collection
        setStage('chat');
      }
      
    } catch (error) {
      console.error('❌ Error starting intelligent conversation:', error);
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
          console.log('ℹ️ No authenticated user, skipping profile fetch');
          setIsLoadingProfile(false);
          return;
        }

        const userId = user.id;
        
        console.log('🔍 Fetching business profile for instant valuation...');
        const profileData = await businessDataService.fetchUserBusinessData(userId);
        
        if (profileData) {
          setBusinessProfile(profileData);
          console.log('✅ Business profile loaded:', profileData);
          
          // Check if we have enough data to start conversation
          if (businessDataService.hasCompleteBusinessProfile(profileData)) {
            console.log('🚀 Starting intelligent conversation with pre-filled data...');
            await startIntelligentConversation(profileData);
          } else {
            console.log('⚠️ Incomplete business profile, will collect missing data');
            const missingFields = businessDataService.getMissingFields(profileData);
            console.log('Missing fields:', missingFields);
          }
        } else {
          console.log('ℹ️ No business profile found, starting fresh conversation');
        }
        
      } catch (error) {
        console.error('❌ Error fetching business profile:', error);
        setProfileError('Failed to load business profile. Starting fresh conversation.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchBusinessProfile();
  }, [isAuthenticated, user?.id, startIntelligentConversation]);


  const handleCompanyFound = (data: any) => {
    setCompanyData(data);
    setSelectedCompanyId(data.company_id);
    
    // DON'T change stage - keep conversation active
    // The chat will continue to collect financial data via conversation
    // Only move to 'results' stage when valuation is complete
    
    console.log('✅ Company found, keeping conversation active:', data.company_name);
  };

  const handleValuationComplete = (valuationResult: ValuationResponse) => {
    setValuationResult(valuationResult);
    setStage('results');
    console.log('✅ Valuation complete, moving to results stage');
  };


  const handleStartOver = () => {
    setStage('chat');
    setCompanyData(null);
    setSelectedCompanyId(null);
    setValuationResult(null);
    setReportSaved(false);
  };

  return (
    <>
      {/* Ilara-style Toolbar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800 flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Other Methods</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-4 sm:h-6 w-px bg-zinc-700 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">Instant Valuation</h1>
              <p className="text-xs text-zinc-400 hidden sm:block">
                {isLoadingProfile ? 'Loading your business profile...' : 
                 businessProfile ? `AI-powered valuation for ${businessProfile.company_name || 'your business'}` :
                 'AI-powered company lookup'}
              </p>
            </div>
          </div>

          {/* Simple status indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {stage === 'chat' && (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>AI conversation active</span>
              </>
            )}
            {stage === 'results' && (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Valuation complete</span>
              </>
            )}
          </div>
        </div>
      </div>

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
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-2 sm:mx-4 my-2 sm:my-4 rounded-lg border border-zinc-800">
        {/* Left Panel: Chat (60% on desktop, full width on mobile) */}
        <div className="h-full flex flex-col bg-zinc-900 lg:border-r border-zinc-800 w-full lg:w-[60%]">
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
              <ConversationalChat
                onCompanyFound={handleCompanyFound}
                onValuationComplete={handleValuationComplete}
                businessProfile={businessProfile}
              />
            </div>
          )}

        </div>

        {/* Right Panel: Preview/Results (40% on desktop, full width on mobile below chat) */}
        <div className="h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-y-auto w-full lg:w-[40%] border-t lg:border-t-0 border-zinc-800">
          {stage === 'chat' && !valuationResult && (
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


          {stage === 'results' && valuationResult && (
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
    </>
  );
};
