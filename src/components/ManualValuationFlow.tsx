import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, TrendingUp, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { useValuationStore } from '../store/useValuationStore';
import { useReportsStore } from '../store/useReportsStore';
import { urls } from '../router';

export const ManualValuationFlow: React.FC = () => {
  const navigate = useNavigate();
  const { result, formData, resetValuation } = useValuationStore();
  const { addReport } = useReportsStore();
  const [reportSaved, setReportSaved] = useState(false);

  // Auto-save report when result is available
  useEffect(() => {
    if (result && formData.company_name && !reportSaved) {
      addReport({
        company_name: formData.company_name,
        source: 'manual',
        result: result,
        form_data: formData,
      });
      setReportSaved(true);
    }
  }, [result, formData.company_name, reportSaved, addReport]);

  const handleStartOver = () => {
    resetValuation();
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
              <ValuationForm />
            </div>
          </div>
        </div>

        {/* Right Panel: Preview/Results (40% width) */}
        <div className="h-full flex flex-col bg-white overflow-y-auto" style={{ width: '40%' }}>
          {!result && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                Your valuation report will appear here once you submit the form with complete financial data.
              </p>
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-y-auto">
              {/* Success Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6 sticky top-0 z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Valuation Complete!
                    </h3>
                    <p className="text-xs text-gray-700 mb-2">
                      Your business valuation report is ready.
                    </p>
                    {reportSaved && (
                      <div className="flex items-center gap-2 text-xs text-green-700">
                        <Save className="w-3 h-3" />
                        <span className="font-medium">Auto-saved to Reports</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(urls.reports())}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    View All Reports
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="flex-1 px-3 py-2 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    New Valuation
                  </button>
                </div>
              </div>

              {/* Results Display */}
              <div className="p-6">
                <Results />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
