import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, TrendingUp, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { useValuationStore } from '../store/useValuationStore';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
// import { urls } from '../router'; // Removed reports link

type FlowStage = 'form' | 'results';

export const ManualValuationFlow: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('form');
  const { result } = useValuationStore();
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  const [reportSaved, setReportSaved] = useState(false);

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

  // Watch for result changes to update stage
  useEffect(() => {
    if (result) {
      setStage('results');
    }
  }, [result]);

  const handleStartOver = () => {
    setStage('form');
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
              <h1 className="text-base sm:text-lg font-bold text-white truncate">📝 Manual Input</h1>
              <p className="text-xs text-zinc-400 hidden sm:block">Full control over your valuation data</p>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
            <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
              stage === 'form' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Edit3 className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Input Data</span>
            </div>
            <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
              stage === 'results' ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Results</span>
            </div>
          </div>
        </div>
      </div>

      {/* FREE Tier Badge */}
      <div className="mx-2 sm:mx-4 mb-2">
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
          <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-green-400 text-sm">✓</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300">FREE - No Credit Cost</p>
            <p className="text-xs text-green-400">Manual entry • Try our instant flow for AI-guided accuracy</p>
          </div>
        </div>
      </div>

      {/* Full-screen Split Panel - Ilara Style */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-2 sm:mx-4 my-2 sm:my-4 rounded-lg border border-zinc-800">
        {/* Left Panel: Form (60% on desktop, full width on mobile) - Always visible */}
        <div 
          className="h-full flex flex-col bg-zinc-900 lg:border-r border-zinc-800 w-full lg:w-[60%]"
        >
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Success Banner when results are ready */}
              {stage === 'results' && result && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
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
                          <span className="hidden lg:inline">Your report is displayed on the right. You can edit values below to recalculate.</span>
                          <span className="lg:hidden">Your report is displayed below. You can edit values to recalculate.</span>
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
                      {/* DISABLED: Reports now shown on upswitch.biz */}
                      {/* <button
                        onClick={() => navigate(urls.reports())}
                        className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                      >
                        View All Reports
                      </button> */}
                      <button
                        onClick={handleStartOver}
                        className="px-4 py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
                      >
                        New Valuation
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Form - Always visible */}
              <ValuationForm />
            </div>
          </div>
        </div>

        {/* Right Panel: Report Preview (40% on desktop, full width on mobile below form) */}
        <div className="h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-y-auto w-full lg:w-[40%] border-t lg:border-t-0 border-zinc-800">
          {stage === 'form' && !result && (
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

          {result && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Results />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
