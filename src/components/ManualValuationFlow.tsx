import React, { useState, useEffect } from 'react';
import { Edit3, TrendingUp, Building2 } from 'lucide-react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { ValuationToolbar } from './ValuationToolbar';
import { ValuationInfoPanel } from './ValuationInfoPanel';
import { HTMLView } from './HTMLView';
import { useValuationStore } from '../store/useValuationStore';
import { useAuth } from '../hooks/useAuth';
// import { DownloadService } from '../services/downloadService';
import { NameGenerator } from '../utils/nameGenerator';
import type { ValuationResponse } from '../types/valuation';
import { PANEL_CONSTRAINTS, MOBILE_BREAKPOINT } from '../constants/panelConstants';
import { ResizableDivider } from './ResizableDivider';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
// import { urls } from '../router'; // Removed reports link

interface ManualValuationFlowProps {
  reportId?: string;
  onComplete: (result: ValuationResponse) => void;
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = ({ onComplete }) => {
  const { result, clearResult, inputData } = useValuationStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [valuationName, setValuationName] = useState('');
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

      {/* Business Profile Summary */}
      {result && (
        <div className="mx-4 mt-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-400" />
            <div>
              <h3 className="text-white font-medium">{result.company_name}</h3>
              <p className="text-sm text-zinc-400">
                {inputData?.industry || 'Industry'} • {inputData?.country_code || 'BE'} • Founded {inputData?.founding_year || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}


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
              <div className="p-4 sm:p-6">
                {result ? (
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
              <div className="p-4 sm:p-6">
                {result ? (
                  <ValuationInfoPanel result={result} inputData={inputData} />
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
};
