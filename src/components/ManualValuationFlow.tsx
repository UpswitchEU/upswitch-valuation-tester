import { Edit3, TrendingUp } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useValuationStore } from '../store/useValuationStore';
import { HTMLView } from './HTMLView';
import { Results } from './Results';
import { ValuationForm } from './ValuationForm';
import { ValuationInfoPanel } from './ValuationInfoPanel';
import { ValuationToolbar } from './ValuationToolbar';
import { ProgressiveValuationReport } from './ProgressiveValuationReport';
import { manualValuationStreamService } from '../services/manualValuationStreamService';
import { ErrorRecovery } from './ErrorRecovery';
import { useRetry, shouldRetryNetworkError } from '../hooks/useRetry';
// import { DownloadService } from '../services/downloadService';
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../constants/panelConstants';
import type { ValuationResponse } from '../types/valuation';
import { NameGenerator } from '../utils/nameGenerator';
import { ResizableDivider } from './ResizableDivider';
import { extractErrorInfo } from '../utils/errorHandler';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
// import { urls } from '../router'; // Removed reports link

interface ManualValuationFlowProps {
  reportId?: string;
  onComplete: (result: ValuationResponse) => void;
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = memo(({ onComplete }) => {
  const { result, clearResult, inputData, isCalculating, setIsCalculating, setResult } = useValuationStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [valuationName, setValuationName] = useState('');
  
  // Progressive rendering state
  const [reportSections, setReportSections] = useState<any[]>([]);
  const [reportPhase, setReportPhase] = useState<number>(0);
  const [finalReportHtml, setFinalReportHtml] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [streamError, setStreamError] = useState<Error | null>(null);
  const streamRef = useRef<any>(null);
  
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
    setStreamProgress(progress);
  }, []);

  // Handle section loading
  const handleSectionLoading = useCallback((section: string, phase: number, progress: number) => {
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
    setStreamProgress(progress);
  }, []);

  // Handle stream completion
  const handleStreamComplete = useCallback((htmlReport: string, valuationId: string, fullResponse?: any) => {
    setFinalReportHtml(htmlReport);
    setIsStreaming(false);
    setStreamProgress(100);
    setStreamError(null);
    
    // OPTIMISTIC UI: Update result with complete HTML report immediately
    const completeResult = {
      ...(result || {}),
      ...(fullResponse || {}),
      html_report: htmlReport,
      valuation_id: valuationId
    } as ValuationResponse;
    
    setResult(completeResult);
    
    // Reconcile with server response (if different, update)
    console.log('[ManualValuationFlow] Stream complete, result updated optimistically', {
      valuationId,
      hasHtmlReport: !!htmlReport,
      htmlReportLength: htmlReport.length
    });
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
      setStreamProgress(0);

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

  // Handle progress updates
  const handleProgress = useCallback((progress: number, message: string) => {
    setStreamProgress(progress);
    console.log('[ManualValuationFlow] Progress:', progress, message);
  }, []);

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
      setStreamProgress(0);
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
    if (!result) return;
    try {
      // Use browser print API as fallback
      window.print();
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to print
      window.print();
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
        isGenerating={false}
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
                {/* Show error recovery if error occurred */}
                {streamError && (
                  <div className="p-4">
                    <ErrorRecovery
                      error={streamError}
                      onRetry={() => {
                        setStreamError(null);
                        retryStream();
                      }}
                      onDismiss={() => setStreamError(null)}
                      showPartialResults={reportSections.length > 0}
                      partialResults={reportSections}
                    />
                  </div>
                )}

                {/* Show progressive report during streaming */}
                {(isStreaming || (reportSections.length > 0 && !result)) ? (
                  <ProgressiveValuationReport
                    sections={reportSections}
                    phase={reportPhase}
                    finalHtml={finalReportHtml}
                    isGenerating={isStreaming || isCalculating || retryState.isRetrying}
                  />
                ) : result ? (
                  <Results />
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
                  <div className="p-4 sm:p-6">
                    <ValuationInfoPanel result={result} inputData={inputData} />
                  </div>
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
