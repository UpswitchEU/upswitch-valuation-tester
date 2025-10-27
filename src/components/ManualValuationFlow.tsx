import React, { useState, useEffect } from 'react';
import { Edit3, TrendingUp, Building2, X } from 'lucide-react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { ValuationToolbar } from './ValuationToolbar';
import { ValuationInfoPanel } from './ValuationInfoPanel';
import { HTMLView } from './HTMLView';
import { useValuationStore } from '../store/useValuationStore';
import { useAuth } from '../hooks/useAuth';
import { useProfileData } from '../hooks/useProfileData';
// import { DownloadService } from '../services/downloadService';
import { NameGenerator } from '../utils/nameGenerator';
import type { ValuationResponse } from '../types/valuation';
import { PANEL_CONSTRAINTS, MOBILE_BREAKPOINT } from '../constants/panelConstants';
import { ResizableDivider } from './ResizableDivider';
import { OwnerDependencyQuestions, type OwnerDependencyFactors } from './OwnerDependencyQuestions';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
// import { urls } from '../router'; // Removed reports link

interface ManualValuationFlowProps {
  reportId?: string;
  onComplete: (result: ValuationResponse) => void;
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = ({ onComplete }) => {
  const { result, clearResult, inputData } = useValuationStore();
  const { user } = useAuth();
  const { profileData, hasOwnerDependency } = useProfileData();
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'info'>('preview');
  const [valuationName, setValuationName] = useState('');
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  // const [reportSaved, setReportSaved] = useState(false); // Removed with success banner
  
  // Owner Dependency state
  const [showOwnerDependencyModal, setShowOwnerDependencyModal] = useState(false);
  const [ownerDependencyFactors, setOwnerDependencyFactors] = useState<OwnerDependencyFactors | null>(null);

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
  
  // Auto-populate owner dependency from profile if available
  useEffect(() => {
    if (hasOwnerDependency && profileData?.owner_dependency_assessment) {
      setOwnerDependencyFactors(profileData.owner_dependency_assessment);
      console.log('[ManualFlow] Pre-populated Owner Dependency from profile');
    }
  }, [hasOwnerDependency, profileData]);

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
  const handleOwnerDependencyComplete = (factors: OwnerDependencyFactors) => {
    setOwnerDependencyFactors(factors);
    setShowOwnerDependencyModal(false);
    console.log('[ManualFlow] Owner Dependency assessment completed', factors);
  };
  
  // Handler for Owner Dependency skip
  const handleOwnerDependencySkip = () => {
    setShowOwnerDependencyModal(false);
    console.log('[ManualFlow] Owner Dependency assessment skipped');
  };

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
      
      {/* Owner Dependency Modal */}
      {showOwnerDependencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Owner Dependency Assessment</h2>
                <p className="text-sm text-gray-600 mt-1">Optional: Improve valuation accuracy by 15-20%</p>
              </div>
              <button
                onClick={() => setShowOwnerDependencyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <OwnerDependencyQuestions
                onComplete={handleOwnerDependencyComplete}
                onSkip={handleOwnerDependencySkip}
                prefillData={profileData?.owner_dependency_assessment}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Owner Dependency Banner (show in form section if not completed) */}
      {!result && !ownerDependencyFactors && !hasOwnerDependency && (
        <div className="fixed bottom-6 right-6 max-w-md bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-2xl p-4 z-40 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Enhance Your Valuation</h4>
              <p className="text-sm text-white/90 mb-3">
                Complete a quick 12-question assessment to account for owner dependency risk (can impact value by up to 40%)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOwnerDependencyModal(true)}
                  className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Start Assessment (3 min)
                </button>
                <button
                  onClick={() => {
                    // Hide banner permanently for this session
                    const banner = document.querySelector('.animate-slide-up');
                    if (banner) {
                      (banner as HTMLElement).style.display = 'none';
                    }
                  }}
                  className="px-4 py-2 text-white/90 hover:text-white text-sm font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
