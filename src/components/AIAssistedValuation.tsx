import React, { useCallback, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, Save, TrendingUp } from 'lucide-react';
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../constants/panelConstants';
import { LiveValuationReport } from './LiveValuationReport';
import { StreamingChat } from './StreamingChat';
// Progressive report component - now implemented
import { ProgressiveValuationReport } from './ProgressiveValuationReport';
// NEW: HTML Preview component (IlaraAI-style)
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { backendAPI } from '../services/backendApi';
import { useValuationSessionStore } from '../store/useValuationSessionStore';
import { businessDataService, type BusinessProfileData } from '../services/businessDataService';
import { DownloadService } from '../services/downloadService';
import { guestCreditService } from '../services/guestCreditService';
import type { ConversationContext, ValuationRequest, ValuationResponse } from '../types/valuation';
import { chatLogger } from '../utils/logger';
import { ErrorBoundary } from './ErrorBoundary';
import { FullScreenModal } from './FullScreenModal';
import { OutOfCreditsModal } from './OutOfCreditsModal';
import { ResizableDivider } from './ResizableDivider';
import { ValuationEmptyState } from './ValuationEmptyState';
import { ValuationInfoPanel } from './ValuationInfoPanel';
import { ValuationToolbar } from './ValuationToolbar';


type FlowStage = 'chat' | 'results' | 'blocked';

interface AIAssistedValuationProps {
  reportId: string;
  onComplete: (result: ValuationResponse) => void;
  initialQuery?: string | null;
  autoSend?: boolean;
}

export const AIAssistedValuation: React.FC<AIAssistedValuationProps> = ({ 
  reportId, 
  onComplete,
  initialQuery = null,
  autoSend = false
}) => {
  const { user, isAuthenticated } = useAuth();
  const { session, updateSessionData, getSessionData } = useValuationSessionStore();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  // Update context when conversation progresses
  const handleConversationUpdate = useCallback((context: ConversationContext) => {
    setConversationContext(context);
    
    chatLogger.info('Conversation context updated', {
      extractedBusinessModel: context.extracted_business_model,
      extractedFoundingYear: context.extracted_founding_year,
      confidence: context.extraction_confidence
    });
  }, []);
  
  // NEW: Store session ID in component state (created once on mount)
  const [sessionId] = useState(() => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const newSessionId = `session_${timestamp}_${randomId}`;
    chatLogger.debug('Created new session', { sessionId: newSessionId });
    return newSessionId;
  });
  
  // Progressive report state - now implemented
  const [reportSections, setReportSections] = useState<any[]>([]);
  const [reportPhase, setReportPhase] = useState(0);
  const [finalReportHtml, setFinalReportHtml] = useState<string>('');
  const [finalValuationId, setFinalValuationId] = useState<string>('');
  
  const [previewGenerated25, setPreviewGenerated25] = useState(false);
  const [previewGenerated50, setPreviewGenerated50] = useState(false);
  const [previewGenerated75, setPreviewGenerated75] = useState(false);
  const [previewGenerated100, setPreviewGenerated100] = useState(false);
  
  // Debug: Log final valuation ID when it changes
  useEffect(() => {
    if (finalValuationId) {
      console.log('Final valuation ID updated:', finalValuationId);
    }
  }, [finalValuationId]);
  
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

  // Credit check for guest users - block conversation if no credits
  useEffect(() => {
    if (!isAuthenticated) {
      const hasCredits = guestCreditService.hasCredits();
      if (!hasCredits) {
        chatLogger.warn('Guest user out of credits - blocking conversation');
        setShowOutOfCreditsModal(true);
        setStage('blocked');
      }
    }
  }, [isAuthenticated]);

  // Save panel width to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }, [leftPanelWidth]);
  
  // Resize handler with snap-to-default behavior (matching Ilara)
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(PANEL_CONSTRAINTS.MIN_WIDTH, Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth));
    
    // Snap to default (30%) if close (within 2% threshold)
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH);
    } else {
      setLeftPanelWidth(constrainedWidth);
    }
  }, []);

  // Mobile panel switcher
  const switchMobilePanel = useCallback((panel: 'chat' | 'preview') => {
    setMobileActivePanel(panel);
  }, []);
  
  // NEW: Business profile data state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false);

  // NEW: Live HTML report state
  const [liveHtmlReport, setLiveHtmlReport] = useState<string>('');
  const [reportProgress, setReportProgress] = useState<number>(0);
  
  // NEW: Optimistic UI state
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [_dataCollectionProgress, setDataCollectionProgress] = useState<number>(0);
  // REMOVED: placeholderValuation and showInstantPreview - no longer needed with progressive reports

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

  // NEW: Handle data collection events with optimistic UI updates
  const handleDataCollected = useCallback((data: any) => {
    chatLogger.debug('Data collected in AIAssistedValuation', { 
      field: data.field,
      hasValue: !!data.value 
    });
    
    // CRITICAL FIX: Preserve sanitized structure from StreamEventHandler
    // StreamEventHandler stores: {[field]: {field, value: string, ...}}
    // We must preserve this structure, not overwrite it
    setCollectedData(prev => {
      // If data has a 'field' property, it's already in the correct structure
      // from StreamEventHandler.handleDataCollected
      if (data.field && typeof data.field === 'string') {
        // Preserve the sanitized structure: {[field]: {field, value, ...}}
        return {
          ...prev,
          [data.field]: {
            ...data,
            // Ensure value is always a string (defensive)
            value: typeof data.value === 'string' ? data.value : String(data.value || 'Not provided')
          }
        };
      } else {
        // Fallback: data might be in wrong format, sanitize it
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
    
    // IMMEDIATE: Show placeholder valuation for key fields
    // REMOVED: placeholderValuation logic - progressive reports handle this now
    
    // IMMEDIATE: Update progress indicator
    const newProgress = Object.keys({ ...collectedData, ...data }).length;
    setDataCollectionProgress(newProgress);
    // Progressive report handles preview automatically
    
    // Sync collected data to session store
    if (data.field && data.value !== undefined) {
      // Convert collected data to ValuationRequest format
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
  }, [collectedData, updateSessionData]);

  // NOTE: Progressive preview generation is now handled by the streaming backend
  // via section_loading and section_complete events. This function is kept for
  // backward compatibility but does nothing as preview is handled by the new system.
  const generateProgressivePreview = useCallback(async (_collectedData: Partial<ValuationRequest>) => {
    // Progressive preview is now handled by handleSectionLoading and handleSectionComplete
    // via the streaming conversation system
    console.log('Progressive preview generation handled by streaming system');
  }, []);

  // Calculate data completeness percentage
  const calculateCompleteness = useCallback((data: Record<string, any>): number => {
    const requiredFields = ['company_name', 'revenue', 'ebitda', 'industry', 'country_code'];
    const collectedFields = requiredFields.filter(field => {
      const value = data[field] || data.current_year_data?.[field];
      return value !== undefined && value !== null && value !== '';
    });
    return Math.round((collectedFields.length / requiredFields.length) * 100);
  }, []);

  // NOTE: HTML preview updates are now handled by handleSectionLoading and handleSectionComplete
  // This callback is kept for backward compatibility but does nothing as the new system
  // uses the progressive report sections directly.
  const handleHtmlPreviewUpdate = useCallback((_html: string, _previewType: string) => {
    // HTML preview is now handled by the progressive report system via sections
  }, []);

  // NEW: Handle valuation preview events
  const handleValuationPreview = useCallback((_preview: any) => {
    // Valuation preview handled silently
  }, []);

  // NEW: Handle calculate option events
  const handleCalculateOption = useCallback((_option: any) => {
    // Calculate option handled silently
  }, []);

  // NEW: Handle progress update events
  const handleProgressUpdate = useCallback((_progress: any) => {
    // Progress updates handled silently - UI removed
  }, []);

  // NEW: Progressive preview generation at data collection milestones
  useEffect(() => {
    const collectedData = conversationContext?.collected_data;
    if (collectedData) {
      const dataCompleteness = calculateCompleteness(collectedData);
      
      // Trigger preview at 25%, 50%, 75%, 100% thresholds
      if (dataCompleteness >= 25 && dataCompleteness < 50 && !previewGenerated25) {
        generateProgressivePreview(collectedData);
        setPreviewGenerated25(true);
      } else if (dataCompleteness >= 50 && dataCompleteness < 75 && !previewGenerated50) {
        generateProgressivePreview(collectedData);
        setPreviewGenerated50(true);
      } else if (dataCompleteness >= 75 && dataCompleteness < 100 && !previewGenerated75) {
        generateProgressivePreview(collectedData);
        setPreviewGenerated75(true);
      } else if (dataCompleteness >= 100 && !previewGenerated100) {
        generateProgressivePreview(collectedData);
        setPreviewGenerated100(true);
      }
    }
  }, [conversationContext?.collected_data, calculateCompleteness, generateProgressivePreview, previewGenerated25, previewGenerated50, previewGenerated75, previewGenerated100]);

  // REMOVED: Legacy optimistic preview - replaced by ProgressiveValuationReport


  // Progressive report handlers - now implemented
  const handleReportSectionUpdate = useCallback((
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => {
    chatLogger.info('Report section update received', { section, phase, progress, htmlLength: html.length, is_fallback, is_error });
    
    setReportSections(prevSections => {
      // Check if section already exists
      const existingIndex = prevSections.findIndex(
        s => s.section === section && s.phase === phase
      );
      
      if (existingIndex >= 0) {
        // UPDATE existing section
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html,
          progress,
          is_fallback,
          is_error,
          error_message,
          timestamp: new Date()
        };
        return updated;
      } else {
        // APPEND new section
        return [...prevSections, {
          id: section,
          section,
          phase,
          html,
          progress,
          is_fallback,
          is_error,
          error_message,
          timestamp: new Date()
        }];
      }
    });
    setReportPhase(phase);
  }, []);

  // Handle section loading event type
  const handleSectionLoading = useCallback((
    section: string | undefined | null,
    html: string | undefined | null,
    phase: number | undefined | null,
    data?: any
  ) => {
    // Validate required fields - try multiple possible sources for section ID
    const sectionId = section || data?.section_id || 'unknown';
    const sectionHtml = html || '';
    const sectionPhase = phase ?? 0;
    
    if (!sectionId || sectionId === 'unknown') {
      chatLogger.warn('Section loading received with invalid section ID', { 
        section, 
        section_id: data?.section_id,
        phase,
        dataKeys: data ? Object.keys(data) : []
      });
      return;
    }
    
    chatLogger.info('Section loading received', { section: sectionId, phase: sectionPhase, htmlLength: sectionHtml.length });
    
    setReportSections(prevSections => {
      const existingIndex = prevSections.findIndex(
        s => s.section === sectionId && s.phase === sectionPhase
      );
      
      if (existingIndex >= 0) {
        // Update existing with loading state
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html: sectionHtml,
          status: 'loading'
        };
        return updated;
      } else {
        // Add new loading section
        return [...prevSections, {
          id: sectionId,
          section: sectionId,
          phase: sectionPhase,
          html: sectionHtml,
          status: 'loading',
          timestamp: new Date()
        }];
      }
    });
  }, []);

  // Handle section complete event type (new progressive report system)
  const handleSectionComplete = useCallback((event: {
    sectionId?: string;
    sectionName?: string;
    html?: string;
    progress?: number;
    phase?: number;
  }) => {
    // Validate required fields
    const sectionId = event.sectionId || event.sectionName || 'unknown';
    const html = event.html || '';
    const progress = event.progress || 0;
    
    if (!sectionId || sectionId === 'unknown') {
      chatLogger.warn('Section complete received with invalid sectionId', { event });
      return;
    }
    
    chatLogger.info('✅ Section complete received', {
      sectionId,
      sectionName: event.sectionName,
      progress,
      htmlLength: html.length
    });
    
    // Update report sections with completed section
    setReportSections(prevSections => {
      const existingIndex = prevSections.findIndex(
        s => s.id === sectionId || s.section === sectionId
      );
      
      if (existingIndex >= 0) {
        // Update existing section with complete state
        const updated = [...prevSections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          html,
          status: 'complete',
          timestamp: new Date()
        };
        return updated;
      } else {
        // Add new complete section
        return [...prevSections, {
          id: sectionId,
          section: sectionId,
          phase: event.phase || 0,
          html,
          status: 'complete',
          timestamp: new Date()
        }];
      }
    });
    
    // Progress is now tracked via reportPhase state, not previewProgress
    setReportPhase(event.phase || 0);
  }, []);

  const handleReportComplete = useCallback((html: string, valuationId: string) => {
    chatLogger.info('Report complete received', { valuationId, htmlLength: html.length });
    setFinalReportHtml(html);
    setFinalValuationId(valuationId);
    setStage('results');
    console.log('Final valuation ID set:', valuationId);
  }, []);

  // NEW: Start intelligent conversation with pre-filled data
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
  
  // Load session data into conversation context when switching to conversational view
  useEffect(() => {
    if (session && session.currentView === 'conversational') {
      const sessionData = getSessionData();
      if (sessionData && Object.keys(sessionData).length > 0) {
        // Check completeness to determine if we have meaningful data
        const completeness = useValuationSessionStore.getState().getCompleteness();
        
        if (completeness > 0) {
          // Build summary of what data we have
          const fields = [];
          if (sessionData.company_name) fields.push('company name');
          if (sessionData.industry) fields.push('industry');
          if (sessionData.current_year_data?.revenue || (sessionData as any).revenue) fields.push('revenue');
          if (sessionData.current_year_data?.ebitda !== undefined || (sessionData as any).ebitda !== undefined) fields.push('EBITDA');
          if (sessionData.founding_year) fields.push('founding year');
          if (sessionData.number_of_employees) fields.push('employees');
          
          chatLogger.info('Pre-existing session data detected', { 
            completeness,
            fieldsCount: fields.length,
            fields 
          });
        }
        
        // Pre-populate conversation context with session data
        const context: ConversationContext = {
          // If conversationContext is null, we need to provide defaults for required fields
          session_id: session.sessionId,
          owner_profile: conversationContext?.owner_profile || { 
            involvement_level: 'hands_on',
            time_commitment: 40,
            succession_plan: 'uncertain',
            risk_tolerance: 'moderate',
            growth_ambition: 'moderate_growth',
            industry_experience: 0,
            management_team_strength: 'adequate',
            key_man_risk: false,
            personal_guarantees: false
          },
          conversation_history: conversationContext?.conversation_history || [],
          current_step: conversationContext?.current_step || 0,
          total_steps: conversationContext?.total_steps || 0,
          
          ...conversationContext,
          
          // Populate extracted data
          extracted_business_model: (sessionData.business_model as any) || undefined,
          extracted_founding_year: sessionData.founding_year,
          
          // Populate business context
          business_context: {
            ...conversationContext?.business_context,
            company_name: sessionData.company_name,
            industry: sessionData.industry,
            business_model: sessionData.business_model,
            founding_year: sessionData.founding_year,
            country_code: sessionData.country_code,
            current_year_data: {
              ...sessionData.current_year_data,
              revenue: sessionData.current_year_data?.revenue || (sessionData as any).revenue,
              ebitda: sessionData.current_year_data?.ebitda || (sessionData as any).ebitda,
            }
          },
          
          extraction_confidence: { 
            business_model: 0.9,
            founding_year: 0.9
          }, 
        };
        setConversationContext(context);
        chatLogger.info('Loaded session data into conversation context', { 
          hasCompanyName: !!sessionData.company_name,
          hasRevenue: !!(sessionData.current_year_data?.revenue || (sessionData as any).revenue)
        });
      }
    }
  }, [session?.currentView, session?.sessionId, getSessionData]);

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
          
          // Show pre-conversation summary for intelligent triage
          setShowPreConversationSummary(true);
          chatLogger.info('Showing pre-conversation summary for intelligent triage');
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



  const handleValuationComplete = async (valuationResult: ValuationResponse) => {
    chatLogger.info('Valuation complete callback triggered', { 
      hasResult: !!valuationResult,
      valuationId: valuationResult?.valuation_id,
      equityValue: valuationResult?.equity_value_mid,
      reportId: reportId
    });
    
    try {
      // Credit validation and deduction now handled by backend
      // Frontend only needs to check localStorage for UI display
      if (!isAuthenticated) {
        const hasCredits = guestCreditService.hasCredits();
        if (!hasCredits) {
          chatLogger.error('No credits available for guest user');
          setError('No credits available. Please sign up to get more credits.');
          return;
        }
        chatLogger.info('Guest user has credits, proceeding with backend validation', { 
          remainingCredits: guestCreditService.getCredits() 
        });
      }
      
      // Extract business_model and founding_year from multiple sources with validation and error handling
      let extractedBusinessModel: string;
      let extractedFoundingYear: number;
      
      try {
        // Extract business model with validation
        const validBusinessModels = ['b2b_saas', 'b2c', 'marketplace', 'ecommerce', 'manufacturing', 'services', 'other'];
        const rawBusinessModel = 
          (valuationResult as any).business_model ||  // From valuation result
          businessProfile?.business_model ||  // From business profile
          conversationContext?.extracted_business_model ||  // From conversation
          (businessProfile ? businessDataService.extractBusinessModel(businessProfile) : 'services');  // Inferred
        
        // Validate business model against enum
        extractedBusinessModel = validBusinessModels.includes(String(rawBusinessModel)) 
          ? String(rawBusinessModel) 
          : 'services';  // Safe fallback
        
        chatLogger.info('Business model extraction', {
          sources: {
            valuationResult: (valuationResult as any).business_model,
            businessProfile: businessProfile?.business_model,
            conversation: conversationContext?.extracted_business_model,
            inferred: businessProfile ? businessDataService.extractBusinessModel(businessProfile) : 'services'
          },
          selected: extractedBusinessModel,
          reason: 'validated_against_enum'
        });
      } catch (error) {
        chatLogger.warn('Failed to extract business model, using fallback', { error });
        extractedBusinessModel = 'services';  // Safe fallback
      }
      
      try {
        // Extract founding year with validation
        const rawFoundingYear = 
          (valuationResult as any).founding_year ||  // From valuation result
          businessProfile?.founded_year ||  // From business profile
          conversationContext?.extracted_founding_year ||  // From conversation
          (businessProfile ? businessDataService.extractFoundingYear(businessProfile) : new Date().getFullYear() - 5);  // Calculated
        
        // Validate founding year is reasonable
        const currentYear = new Date().getFullYear();
        extractedFoundingYear = (rawFoundingYear >= 1900 && rawFoundingYear <= currentYear) 
          ? rawFoundingYear 
          : currentYear - 5;  // Safe fallback
        
        chatLogger.info('Founding year extraction', {
          sources: {
            valuationResult: (valuationResult as any).founding_year,
            businessProfile: businessProfile?.founded_year,
            conversation: conversationContext?.extracted_founding_year,
            inferred: businessProfile ? businessDataService.extractFoundingYear(businessProfile) : new Date().getFullYear() - 5
          },
          selected: extractedFoundingYear,
          reason: 'validated_year_range'
        });
      } catch (error) {
        chatLogger.warn('Failed to extract founding year, using fallback', { error });
        extractedFoundingYear = new Date().getFullYear() - 5;  // Safe fallback
      }
      
      // Convert the valuation result to a proper ValuationRequest for backend processing
      const request: ValuationRequest = {
        company_name: valuationResult.company_name || businessProfile?.company_name || 'AI Generated Company',
        country_code: businessProfile?.country || 'BE',
        industry: businessProfile?.industry || 'services',
        business_model: extractedBusinessModel,  // ✅ Extracted from context
        founding_year: extractedFoundingYear,  // ✅ Extracted from context
        current_year_data: {
          year: new Date().getFullYear(),
          revenue: (valuationResult as any).revenue || 1000000,
          ebitda: (valuationResult as any).ebitda || 200000,
        },
        historical_years_data: [],
        number_of_employees: 10,
        recurring_revenue_percentage: 0.8,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: [],
      };

      chatLogger.info('Processing AI-guided valuation with extracted data', {
        companyName: request.company_name,
        businessModel: request.business_model,
        foundingYear: request.founding_year,
        extractionSource: {
          businessModel: (valuationResult as any).business_model ? 'valuation_result' : 
                         businessProfile?.business_model ? 'business_profile' : 
                         conversationContext?.extracted_business_model ? 'conversation' : 'inferred',
          foundingYear: (valuationResult as any).founding_year ? 'valuation_result' : 
                       businessProfile?.founded_year ? 'business_profile' : 
                       conversationContext?.extracted_founding_year ? 'conversation' : 'calculated'
        }
      });

      // Get session dataSource for unified calculation
      const { session } = useValuationSessionStore.getState();
      const dataSource = session?.dataSource || 'conversational';
      
      // Use unified calculation endpoint with dataSource
      const backendResult = await backendAPI.calculateValuationUnified(request, dataSource as 'manual' | 'conversational' | 'mixed');
      
      chatLogger.info('Unified valuation completed through backend', {
        valuationId: backendResult.valuation_id,
        dataSource,
        flowType: 'ai-guided'
      });
      
      // Mark session as completed
      if (session) {
        try {
          await backendAPI.updateValuationSession(session.reportId, {
            completedAt: new Date().toISOString(),
          });
          chatLogger.info('Session marked as completed', { reportId: session.reportId });
        } catch (error) {
          chatLogger.warn('Failed to mark session as completed', { error });
        }
      }

      // Update frontend credit count using backend's creditsRemaining
      if (!isAuthenticated && (backendResult as any).creditsRemaining !== undefined) {
        const creditsRemaining = (backendResult as any).creditsRemaining;
        guestCreditService.setCredits(creditsRemaining);
        chatLogger.info('Frontend credit count synced with backend', { 
          remainingCredits: creditsRemaining
        });
      }

      setValuationResult(backendResult);
      
      // Input data no longer needed - Info tab uses server-generated HTML (info_tab_html)
      
      setStage('results');
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(backendResult);
      }
    } catch (error) {
      chatLogger.error('Failed to process AI-guided valuation through backend', {
        error: error instanceof Error ? error.message : 'Unknown error',
        flowType: 'ai-guided'
      });
      
      // Handle credit-related errors
      if (error instanceof Error && error.message.includes('Insufficient credits')) {
        setError('You need 1 credit to run this valuation. Please sign up to get more credits.');
        setShowOutOfCreditsModal(true);
        return;
      }
      
      // Fallback to original result if backend fails
      setValuationResult(valuationResult);
      setStage('results');
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(valuationResult);
      }
    }
    
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
    <div className="flex flex-col h-full overflow-hidden">
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

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4">
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-300">
              <span className="text-red-400">⚠️</span>
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-200 text-sm mt-1">{error}</p>
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
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-sm">🧠</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Intelligent Triage Active</h3>
                <p className="text-sm text-blue-200 mb-3">
                  We found your business profile! We'll skip the questions we already know and only ask for missing information.
                </p>
                
                {(() => {
                  const analysis = businessDataService.getFieldAnalysis(businessProfile);
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-blue-300">Data completeness:</span>
                        <span className="font-semibold text-blue-200">{analysis.completeness}%</span>
                        <div className="flex-1 bg-zinc-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${analysis.completeness}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-blue-200">
                        <span className="text-blue-300">Estimated time:</span> {analysis.estimatedTime} minutes
                      </div>
                      
                      {analysis.complete.length > 0 && (
                        <div className="text-sm">
                          <span className="text-blue-300">We already know:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.complete.map(field => (
                              <span key={field} className="bg-blue-800/50 px-2 py-1 rounded text-xs">
                                {field.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.priority.length > 0 && (
                        <div className="text-sm">
                          <span className="text-blue-300">We need to ask about:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.priority.map(field => (
                              <span key={field} className="bg-orange-800/50 px-2 py-1 rounded text-xs">
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
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Start Smart Conversation
                        </button>
                        <button
                          onClick={() => {
                            setShowPreConversationSummary(false);
                            // Start fresh conversation without pre-filled data
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
        <div className="border-b border-red-800 bg-red-900/20 px-3 sm:px-4 md:px-6 py-3 mx-4">
          <div className="flex items-center gap-2 text-sm text-red-300">
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

          {/* Resume Conversation Banner REMOVED - replaced by in-chat context message */}
          {/* {hasPreExistingData && !reportSaved && stage === 'chat' && (
            <div className="bg-blue-900/20 border-b border-blue-700/30 px-4 py-3 mx-4 mt-4 rounded-lg">
              ...
            </div>
          )} */}

          {/* Chat - Always visible */}
          {(stage === 'chat' || stage === 'results') && (
            <div className="flex-1 overflow-y-auto">
              <ErrorBoundary
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
                  sessionId={sessionId}
                  userId={user?.id}
                  onValuationComplete={handleValuationComplete}
                  onReportUpdate={handleReportUpdate}
                  onDataCollected={handleDataCollected}
                  onValuationPreview={handleValuationPreview}
                  onCalculateOptionAvailable={handleCalculateOption}
                  onProgressUpdate={handleProgressUpdate}
                  onReportSectionUpdate={handleReportSectionUpdate}
                  onSectionLoading={handleSectionLoading}
                  onSectionComplete={handleSectionComplete}
                  onReportComplete={handleReportComplete}
                  onContextUpdate={handleConversationUpdate}
                  onHtmlPreviewUpdate={handleHtmlPreviewUpdate}
                  className="h-full"
                  placeholder="Ask about your business valuation..."
                  initialMessage={initialQuery}
                  autoSend={autoSend}
                  initialData={getSessionData() || undefined} // Pass session data for resuming
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
            <div className="flex flex-col h-full">
              {/* During conversation: Show progressive streaming */}
              {stage === 'chat' && (
                <>
                  {reportSections.length === 0 && !finalReportHtml && !error ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
                      <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                        Your valuation report will appear here once you submit the form.
                      </p>
                    </div>
                  ) : (
                    <ProgressiveValuationReport
                      sections={reportSections}
                      phase={reportPhase}
                      finalHtml={finalReportHtml}
                      isGenerating={isGenerating || stage === 'chat'}
                      error={error}
                      onRetry={handleRefresh}
                    />
                  )}
                </>
              )}
              
              {/* After conversation: Show Accountant View HTML from valuationResult */}
              {stage === 'results' && valuationResult?.html_report && (
                <div className="h-full overflow-y-auto bg-white px-4 sm:px-6 lg:px-8">
                  <style>{`
                    .accountant-view-report {
                      font-family: 'Times New Roman', Times, serif;
                      line-height: 1.6;
                      color: #000;
                      background: #fff;
                      padding: 2rem;
                      max-width: 8.5in;
                      margin: 0 auto;
                    }

                    .accountant-view-report h1,
                    .accountant-view-report h2,
                    .accountant-view-report h3 {
                      page-break-after: avoid;
                    }

                    .accountant-view-report table {
                      page-break-inside: avoid;
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1rem 0;
                    }

                    .accountant-view-report th,
                    .accountant-view-report td {
                      border: 1px solid #ddd;
                      padding: 8px;
                      text-align: left;
                    }

                    .accountant-view-report th {
                      background-color: #f5f5f5;
                      font-weight: bold;
                    }

                    @media print {
                      .accountant-view-report {
                        padding: 0;
                        max-width: 100%;
                      }
                    }
                  `}</style>
                  <div
                    className="accountant-view-report"
                    dangerouslySetInnerHTML={{ __html: valuationResult.html_report }}
                  />
                </div>
              )}
              
              {/* Empty state */}
              {stage !== 'chat' && stage !== 'results' && <ValuationEmptyState />}
            </div>
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
            <ValuationInfoPanel result={valuationResult} />
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
          <ValuationInfoPanel result={valuationResult} />
        )}
      </FullScreenModal>

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
          // TODO: Switch to manual flow
          console.log('Try manual flow clicked');
        }}
      />

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
    </div>
  );
};
