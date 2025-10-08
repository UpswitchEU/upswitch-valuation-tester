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
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Other Methods</span>
            </button>
            <div className="h-6 w-px bg-zinc-700" />
            <div>
              <h1 className="text-lg font-bold text-white">📝 Manual Input</h1>
              <p className="text-xs text-zinc-400">Full control over your valuation data</p>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              stage === 'form' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Edit3 className="w-3 h-3" />
              <span>Input Data</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              stage === 'results' ? 'bg-green-500/20 text-green-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <TrendingUp className="w-3 h-3" />
              <span>Results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen Split Panel - Ilara Style */}
      <div className="flex flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800">
        {/* Left Panel: Form (60% width) - Always visible */}
        <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800" style={{ width: '60%' }}>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Success Banner when results are ready */}
              {stage === 'results' && result && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">
                          Valuation Complete!
                        </h3>
                        <p className="text-sm text-zinc-300 mb-3">
                          Your report is displayed on the right. You can edit values below to recalculate.
                        </p>
                        {reportSaved && (
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <Save className="w-4 h-4" />
                            <span className="font-medium">Auto-saved to Reports</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* DISABLED: Reports now shown on upswitch.biz */}
                      {/* <button
                        onClick={() => navigate(urls.reports())}
                        className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                      >
                        View All Reports
                      </button> */}
                      <button
                        onClick={handleStartOver}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
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

        {/* Right Panel: Report Preview (40% width) */}
        <div className="h-full flex flex-col bg-white overflow-y-auto" style={{ width: '40%' }}>
          {stage === 'form' && !result && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                Your valuation report will appear here once you submit the form.
              </p>
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-y-auto p-6">
              <Results />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
