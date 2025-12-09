import { Edit3, TrendingUp } from 'lucide-react';
import React, { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../constants/panelConstants';
import { useAuth } from '../hooks/useAuth';
import { shouldRetryNetworkError, useRetry } from '../hooks/useRetry';
import { DownloadService } from '../services/downloadService';
import { manualValuationStreamService } from '../services/manualValuationStreamService';
import { useValuationStore } from '../store/useValuationStore';
import type { ValuationResponse } from '../types/valuation';
import { NameGenerator } from '../utils/nameGenerator';
import { measureWebVitals, performanceTracker } from '../utils/performance';
import { HTMLView } from './HTMLView';
import { ProgressiveValuationReport } from './ProgressiveValuationReport';
import { ResizableDivider } from './ResizableDivider';
import { ValuationForm } from './ValuationForm';
import { ValuationToolbar } from './ValuationToolbar';

// Lazy load heavy components for code splitting
const Results = lazy(() => import('./Results').then(m => ({ default: m.Results })));
const ValuationInfoPanel = lazy(() => import('./ValuationInfoPanel').then(m => ({ default: m.ValuationInfoPanel })));

// Loading fallback component
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3 text-gray-600">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-sm">{message}</span>
    </div>
  </div>
);
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
// import { urls } from '../router'; // Removed reports link

interface ManualValuationFlowProps {
  reportId?: string;
  onComplete: (result: ValuationResponse) => void;
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = memo(({ onComplete }) => {
  const { result, clearResult, isCalculating, setIsCalculating, setResult, formData, calculateValuation } = useValuationStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [valuationName, setValuationName] = useState('');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  // Progressive rendering state
  const [reportSections, setReportSections] = useState<any[]>([]);
  const [reportPhase, setReportPhase] = useState<number>(0);
  const [finalReportHtml, setFinalReportHtml] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<Error | null>(null);
  const streamRef = useRef<any>(null);
  const requestIdRef = useRef<string | null>(null);
  
  // Performance tracking
  useEffect(() => {
    if (isCalculating && !requestIdRef.current) {
      requestIdRef.current = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      performanceTracker.markStart(requestIdRef.current);
      measureWebVitals(requestIdRef.current);
    }
  }, [isCalculating]);
  
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  // const [reportSaved, setReportSaved] = useState(false); // Removed with success banner
  
  // Owner Dependency state

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

  // 📝 DEPRECATED: Auto-save report to localStorage
  // Now handled by calculateValuation() → saveToBackend()
  // useEffect(() => {
  //   if (result && formData.company_name && stage === 'results' && !reportSaved) {
  //     addReport({
  //       company_name: formData.company_name,
  //       source: 'manual',
  //       result: result,
  //       form_data: formData,
  //     });
  //     setReportSaved(true);
  //   }
  // }, [result, formData, stage, reportSaved, addReport]);

  // Generate valuation name from company
  useEffect(() => {
    if (result?.company_name) {
      setValuationName(NameGenerator.generateFromCompany(result.company_name));
    }
  }, [result]);

  // Watch for result changes
  useEffect(() => {
    if (result && onComplete) {
      onComplete(result);
    }
  }, [result, onComplete]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        manualValuationStreamService.closeAllStreams();
      }
    };
  }, []);

  // Handle progressive report section updates
  const handleSectionUpdate = useCallback((section: string, html: string, phase: number, progress: number) => {
    const requestId = requestIdRef.current;
    if (requestId) {
      const duration = performanceTracker.markEnd(`${requestId}-section-${section}`);
      performanceTracker.trackSectionRendering(requestId, section, duration);
    }
    
    setReportSections(prev => {
      const existingIndex = prev.findIndex(s => s.id === section);
      const newSection = {
        id: section,
        phase,
        html,
        progress,
        timestamp: new Date(),
        status: 'completed' as const
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newSection;
        return updated;
      } else {
        return [...prev, newSection];
      }
    });
    setReportPhase(phase);
  }, []);

  // Handle section loading
  const handleSectionLoading = useCallback((section: string, phase: number, progress: number) => {
    const requestId = requestIdRef.current;
    if (requestId) {
      performanceTracker.markStart(`${requestId}-section-${section}`);
    }
    
    setReportSections(prev => {
      const existingIndex = prev.findIndex(s => s.id === section);
      const newSection = {
        id: section,
        phase,
        html: '',
        progress,
        timestamp: new Date(),
        status: 'loading' as const
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newSection;
        return updated;
      } else {
        return [...prev, newSection];
      }
    });
    setReportPhase(phase);
  }, []);

  // Handle stream completion
  const handleStreamComplete = useCallback((htmlReport: string, valuationId: string, fullResponse?: any) => {
    const requestId = requestIdRef.current;
    
    // Extract info_tab_html from fullResponse if available
    const infoTabHtml = fullResponse?.info_tab_html || null;
    const hasInfoTabHtml = !!(infoTabHtml && typeof infoTabHtml === 'string' && infoTabHtml.length > 0);
    
    // DIAGNOSTIC: Log stream completion with full details including info_tab_html
    console.log('[ManualValuationFlow] handleStreamComplete called', {
      requestId,
      valuationId,
      hasHtmlReport: !!htmlReport,
      htmlReportLength: htmlReport?.length || 0,
      htmlReportType: typeof htmlReport,
      htmlReportPreview: htmlReport?.substring(0, 200) || 'N/A',
      hasFullResponse: !!fullResponse,
      fullResponseKeys: fullResponse ? Object.keys(fullResponse) : [],
      hasInfoTabHtml,
      infoTabHtmlLength: infoTabHtml?.length || 0,
      infoTabHtmlPreview: infoTabHtml?.substring(0, 200) || 'N/A'
    });
    
    if (requestId) {
      const duration = performanceTracker.markEnd(requestId);
      performanceTracker.trackReportGeneration(requestId, duration);
      
      // Log performance summary
      const summary = performanceTracker.getSummary(requestId);
      console.log('[ManualValuationFlow] Performance Summary:', summary);
    }
    
    // CRITICAL: Ensure htmlReport is a valid string
    if (!htmlReport || typeof htmlReport !== 'string' || htmlReport.length === 0) {
      console.error('[ManualValuationFlow] Invalid htmlReport received in handleStreamComplete', {
        valuationId,
        htmlReportType: typeof htmlReport,
        htmlReportLength: htmlReport?.length || 0,
        htmlReportValue: htmlReport
      });
      return;
    }
    
    // Set final report HTML - this is used by ProgressiveValuationReport component
    setFinalReportHtml(htmlReport);
    setIsStreaming(false);
    setStreamError(null);
    
    // BANK-GRADE: Clear isCalculating only when report is actually ready
    // This ensures loading state persists until report is displayed
    setIsCalculating(false);
    
    // Clear progressive sections when full report is available
    setReportSections([]);
    
    // OPTIMISTIC UI: Update result with complete HTML report and info_tab_html immediately
    const completeResult = {
      ...(result || {}),
      ...(fullResponse || {}),
      html_report: htmlReport,
      info_tab_html: hasInfoTabHtml ? infoTabHtml : (result?.info_tab_html || undefined),
      valuation_id: valuationId
    } as ValuationResponse;
    
    // CRITICAL: Set result with html_report and info_tab_html from streaming BEFORE regular endpoint can overwrite it
    setResult(completeResult);
    
    // DIAGNOSTIC: Verify result was set correctly
    console.log('[ManualValuationFlow] Stream complete, result updated optimistically', {
      valuationId,
      hasHtmlReport: !!htmlReport,
      htmlReportLength: htmlReport.length,
      htmlReportPreview: htmlReport.substring(0, 200),
      hasInfoTabHtml: !!completeResult.info_tab_html,
      infoTabHtmlLength: completeResult.info_tab_html?.length || 0,
      completeResultKeys: Object.keys(completeResult),
      completeResultHasHtmlReport: !!completeResult.html_report,
      completeResultHasInfoTabHtml: !!completeResult.info_tab_html,
      finalReportHtmlSet: true,
      reportSectionsCleared: true,
      note: 'Both html_report and info_tab_html should be preserved when regular endpoint response arrives'
    });
    
    // Clear request ID after completion
    requestIdRef.current = null;
  }, [result, setResult]);

  // Handle stream errors
  const handleStreamError = useCallback((error: string, errorType?: string) => {
    console.error('[ManualValuationFlow] Stream error:', error, errorType);
    const errorObj = new Error(error);
    if (errorType) {
      errorObj.name = errorType;
    }
    setStreamError(errorObj);
    setIsStreaming(false);
    setIsCalculating(false);
    // Keep partial results if available
  }, [setIsCalculating]);

  // Handle progress updates
  const handleProgress = useCallback((progress: number, message: string) => {
    console.log('[ManualValuationFlow] Progress:', progress, message);
  }, []);

  // Retry handler with exponential backoff
  const startStreamingWithRetry = useCallback(async () => {
    const { formData } = useValuationStore.getState();
    
    // Build request from formData
    const currentYear = Math.min(Math.max(formData.current_year_data?.year || new Date().getFullYear(), 2000), 2100);
    const foundingYear = Math.min(Math.max(formData.founding_year || currentYear - 5, 1900), 2100);
    const companyName = formData.company_name?.trim() || 'Unknown Company';
    const countryCode = (formData.country_code || 'BE').toUpperCase().substring(0, 2);
    const industry = formData.industry || 'services';
    const businessModel = formData.business_model || 'services';
    const revenue = Math.max(Number(formData.revenue) || 100000, 1);
    const ebitda = formData.ebitda !== undefined && formData.ebitda !== null ? Number(formData.ebitda) : 20000;

    const request = {
      company_name: companyName,
      country_code: countryCode,
      industry: industry,
      business_model: businessModel,
      founding_year: foundingYear,
      current_year_data: {
        year: currentYear,
        revenue: revenue,
        ebitda: ebitda,
        ...(formData.current_year_data?.total_assets && formData.current_year_data.total_assets >= 0 && { total_assets: Number(formData.current_year_data.total_assets) }),
        ...(formData.current_year_data?.total_debt && formData.current_year_data.total_debt >= 0 && { total_debt: Number(formData.current_year_data.total_debt) }),
        ...(formData.current_year_data?.cash && formData.current_year_data.cash >= 0 && { cash: Number(formData.current_year_data.cash) }),
      },
      historical_years_data: formData.historical_years_data || [],
      number_of_employees: formData.number_of_employees,
      number_of_owners: formData.number_of_owners,
      recurring_revenue_percentage: formData.recurring_revenue_percentage || 0,
      use_dcf: true,
      use_multiples: true,
      projection_years: 10,
      comparables: formData.comparables || [],
      business_type_id: formData.business_type_id,
      business_type: formData.business_type,
      shares_for_sale: formData.shares_for_sale || 100,
      business_context: formData.business_type_id ? {
        dcfPreference: formData._internal_dcf_preference,
        multiplesPreference: formData._internal_multiples_preference,
        ownerDependencyImpact: formData._internal_owner_dependency_impact,
        keyMetrics: formData._internal_key_metrics,
        typicalEmployeeRange: formData._internal_typical_employee_range,
        typicalRevenueRange: formData._internal_typical_revenue_range,
      } : undefined,
    };

    try {
      setIsStreaming(true);
      setStreamError(null);
      setReportSections([]);
      setFinalReportHtml('');

      const stream = await manualValuationStreamService.streamManualValuation(
        request,
        {
          onProgress: handleProgress,
          onSectionLoading: handleSectionLoading,
          onSectionUpdate: handleSectionUpdate,
          onComplete: handleStreamComplete,
          onError: handleStreamError
        },
        undefined,
        {
          timeout: 90000,
          enableDeduplication: true
        }
      );

      streamRef.current = stream;
    } catch (error) {
      handleStreamError(
        error instanceof Error ? error.message : 'Failed to start stream',
        error instanceof Error ? error.constructor.name : 'UnknownError'
      );
    }
  }, [handleProgress, handleSectionLoading, handleSectionUpdate, handleStreamComplete, handleStreamError]);

  // Retry wrapper
  const [retryStream, retryState] = useRetry(
    startStreamingWithRetry,
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      shouldRetry: shouldRetryNetworkError,
      onRetry: (attempt, error) => {
        console.log(`[ManualValuationFlow] Retrying stream (attempt ${attempt})`, error);
      }
    }
  );

  // Watch for calculation start and initiate streaming with optimistic UI
  useEffect(() => {
    if (isCalculating && !isStreaming) {
      // OPTIMISTIC UI: Show skeleton immediately
      setIsStreaming(true);
      setReportSections([{
        id: 'initial_loading',
        phase: 0,
        html: '',
        progress: 0,
        timestamp: new Date(),
        status: 'loading'
      }]);
      setFinalReportHtml('');
      setStreamError(null);

      // Start streaming with retry
      retryStream().catch((error) => {
        // Error already handled by handleStreamError
        console.error('[ManualValuationFlow] Stream failed:', error);
      });
    }
  }, [isCalculating, isStreaming, retryStream]);
  
  // Toolbar handlers
  const handleRefresh = () => {
    // Clear result and reset form
    clearResult();
  };

  const handleDownload = async () => {
    if (!result || !formData) {
      console.warn('[ManualValuationFlow] Cannot download PDF: missing result or formData');
      return;
    }

    setIsDownloadingPDF(true);
    
    try {
      // Build ValuationRequest from formData (same structure as calculateValuation)
      const currentYear = Math.min(Math.max(formData.current_year_data?.year || new Date().getFullYear(), 2000), 2100);
      const foundingYear = Math.min(Math.max(formData.founding_year || currentYear - 5, 1900), 2100);
      const companyName = formData.company_name?.trim() || 'Unknown Company';
      const countryCode = (formData.country_code || 'BE').toUpperCase().substring(0, 2);
      const industry = formData.industry || 'services';
      const businessModel = formData.business_model || 'services';
      const revenue = Math.max(Number(formData.revenue) || 100000, 1);
      const ebitda = formData.ebitda !== undefined && formData.ebitda !== null ? Number(formData.ebitda) : 20000;

      const pdfRequest = {
        company_name: companyName,
        country_code: countryCode,
        industry: industry,
        business_model: businessModel,
        founding_year: foundingYear,
        current_year_data: {
          year: currentYear,
          revenue: revenue,
          ebitda: ebitda,
          ...(formData.current_year_data?.total_assets && formData.current_year_data.total_assets >= 0 && { total_assets: Number(formData.current_year_data.total_assets) }),
          ...(formData.current_year_data?.total_debt && formData.current_year_data.total_debt >= 0 && { total_debt: Number(formData.current_year_data.total_debt) }),
          ...(formData.current_year_data?.cash && formData.current_year_data.cash >= 0 && { cash: Number(formData.current_year_data.cash) }),
        },
        historical_years_data: formData.historical_years_data || [],
        number_of_employees: formData.number_of_employees,
        number_of_owners: formData.number_of_owners,
        recurring_revenue_percentage: formData.recurring_revenue_percentage || 0,
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
        comparables: formData.comparables || [],
        business_type_id: formData.business_type_id,
        business_type: formData.business_type,
        shares_for_sale: formData.shares_for_sale || 100,
        business_context: formData.business_type_id ? {
          dcfPreference: formData._internal_dcf_preference,
          multiplesPreference: formData._internal_multiples_preference,
          ownerDependencyImpact: formData._internal_owner_dependency_impact,
          keyMetrics: formData._internal_key_metrics,
          typicalEmployeeRange: formData._internal_typical_employee_range,
          typicalRevenueRange: formData._internal_typical_revenue_range,
        } : undefined,
      };

      // Download PDF using backend endpoint
      await DownloadService.downloadAccountantViewPDF(pdfRequest, {
        filename: DownloadService.getDefaultFilename(companyName, 'pdf'),
        onProgress: (progress) => {
          console.log(`[ManualValuationFlow] PDF download progress: ${progress}%`);
        }
      });

      console.log('[ManualValuationFlow] PDF downloaded successfully');
    } catch (error) {
      console.error('[ManualValuationFlow] PDF download failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      alert(`PDF download failed: ${errorMessage}\n\nPlease try again or use the browser's print function.`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleFullScreen = () => {
    document.documentElement.requestFullscreen();
  };

  const handleTabChange = (tab: 'preview' | 'source' | 'info') => {
    setActiveTab(tab);
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save panel width to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }, [leftPanelWidth]);

  // Resize handler with snap-to-default behavior
  const handleResize = (newWidth: number) => {
    const constrainedWidth = Math.max(
      PANEL_CONSTRAINTS.MIN_WIDTH,
      Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth)
    );
    
    // Snap to default (30%) if close (within 2% threshold)
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH);
    } else {
      setLeftPanelWidth(constrainedWidth);
    }
  };

  // const handleStartOver = () => { // Removed with success banner
  //   setStage('form');
  //   setReportSaved(false);
  // };

  // Handler for Owner Dependency completion
  
  // Handler for Owner Dependency skip

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ValuationToolbar */}
      <ValuationToolbar
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        onFullScreen={handleFullScreen}
        isGenerating={isCalculating || isStreaming || isDownloadingPDF}
        user={user}
        valuationName={valuationName}
        valuationId={result?.valuation_id}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        companyName={result?.company_name}
        valuationMethod="Manual Input"
      />



      {/* Full-screen Split Panel - Ilara Style */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800">
        {/* Left Panel: Form (resizable on desktop, full width on mobile) - Always visible */}
        <div 
          className="h-full flex flex-col bg-zinc-900 lg:border-r border-zinc-800 w-full lg:w-auto"
          style={{ width: isMobile ? '100%' : `${leftPanelWidth}%` }}
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Success Banner removed - report preview shows completion status */}
              
              {/* Form - Always visible */}
              <ValuationForm />
            </div>
          </div>
        </div>

        {/* Resizer */}
        {!isMobile && (
          <ResizableDivider 
            onResize={handleResize} 
            leftWidth={leftPanelWidth}
            isMobile={isMobile}
          />
        )}

        {/* Right Panel: Tabbed Content */}
        <div 
          className="h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-hidden w-full lg:w-auto border-t lg:border-t-0 border-zinc-800"
          style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
        >
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'preview' && (
              <div className="h-full">
                {/* Match AI-guided flow: Show ProgressiveValuationReport during streaming with finalHtml */}
                {/* ProgressiveValuationReport displays final HTML report when finalHtml prop is provided */}
                {(isStreaming || reportSections.length > 0 || finalReportHtml || streamError || isCalculating) ? (
                  <ProgressiveValuationReport
                    sections={reportSections}
                    phase={reportPhase}
                    finalHtml={finalReportHtml || result?.html_report || ''}
                    isGenerating={isStreaming || isCalculating || retryState.isRetrying}
                    error={streamError ? (streamError.message || "An unexpected error occurred") : null}
                    onRetry={async () => {
                      // Clear error state
                      setStreamError(null);
                      // Clear partial sections
                      setReportSections([]);
                      setFinalReportHtml('');
                      // Call calculateValuation() - same as clicking "Calculate Valuation" button
                      // This will validate form data, set isCalculating to true, and trigger streaming via useEffect
                      try {
                        await calculateValuation();
                      } catch (error) {
                        console.error('[ManualValuationFlow] Retry failed:', error);
                        handleStreamError(
                          error instanceof Error ? error.message : 'Failed to retry calculation',
                          error instanceof Error ? error.constructor.name : 'UnknownError'
                        );
                      }
                    }}
                  />
                ) : result?.html_report ? (
                  <Suspense fallback={<ComponentLoader message="Loading report..." />}>
                    <Results />
                  </Suspense>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                      Your valuation report will appear here once you submit the form.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'source' && (
              <HTMLView result={result} />
            )}
            
            {activeTab === 'info' && (
              <div className="h-full">
                {result ? (
                    <Suspense fallback={<ComponentLoader message="Loading calculation details..." />}>
                      <ValuationInfoPanel result={result} />
                    </Suspense>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                      <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Calculation Details</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                      Detailed calculation breakdown will appear here once you submit the form.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
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
});
