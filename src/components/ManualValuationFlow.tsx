import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, TrendingUp, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { useValuationStore } from '../store/useValuationStore';
import { useReportsStore } from '../store/useReportsStore';
import { urls } from '../router';

type FlowStage = 'form' | 'results';

export const ManualValuationFlow: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('form');
  const { result, formData } = useValuationStore();
  const { addReport } = useReportsStore();
  const [reportSaved, setReportSaved] = useState(false);

  // Auto-save report when result is available
  useEffect(() => {
    if (result && formData.company_name && stage === 'results' && !reportSaved) {
      addReport({
        company_name: formData.company_name,
        source: 'manual',
        result: result,
        form_data: formData,
      });
      setReportSaved(true);
    }
  }, [result, formData, stage, reportSaved, addReport]);

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
        {/* Left Panel: Form/Results (60% width) */}
        <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800" style={{ width: '60%' }}>
          {stage === 'form' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <ValuationForm />
              </div>
            </div>
          )}

          {stage === 'results' && result && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success Banner */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 mb-6 max-w-4xl mx-auto">
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
                        Your business valuation report is ready.
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
                    <button
                      onClick={() => navigate(urls.reports())}
                      className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                    >
                      View All Reports
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      New Valuation
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Results Display */}
              <div className="max-w-4xl mx-auto">
                <Results />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Preview (40% width) */}
        <div className="h-full flex flex-col bg-white overflow-y-auto" style={{ width: '40%' }}>
          {stage === 'form' && (
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

          {stage === 'results' && (
            <div className="p-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Report Ready</h3>
                    <p className="text-xs text-gray-500">Professional valuation complete</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> DCF Analysis Complete
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Market Multiples Applied
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Financial Metrics Calculated
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Risk Factors Identified
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Report Auto-saved
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(urls.reports())}
                      className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-left"
                    >
                      📊 View All Reports
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="w-full px-4 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium text-left"
                    >
                      ➕ Create New Valuation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
