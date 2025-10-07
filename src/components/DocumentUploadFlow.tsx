import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, TrendingUp, CheckCircle, Save, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { TwoStepFlow } from './TwoStepFlow';
import { Results } from './Results';
import { useValuationStore } from '../store/useValuationStore';
import { useReportsStore } from '../store/useReportsStore';
import { urls } from '../router';

type FlowStage = 'upload' | 'results';

export const DocumentUploadFlow: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('upload');
  const { result, formData } = useValuationStore();
  const { addReport } = useReportsStore();
  const [reportSaved, setReportSaved] = useState(false);

  // Auto-save report when result is available
  useEffect(() => {
    if (result && formData.company_name && stage === 'results' && !reportSaved) {
      addReport({
        company_name: formData.company_name,
        source: 'document',
        result: result,
        form_data: formData,
      });
      setReportSaved(true);
    }
  }, [result, formData.company_name, stage, reportSaved, addReport]);

  const handleValuationComplete = () => {
    setStage('results');
  };

  const handleBackToHome = () => {
    navigate(urls.home());
  };

  const handleNewValuation = () => {
    setStage('upload');
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-700" />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Document Upload</h1>
              <p className="text-sm text-zinc-400">Extract financial data from your documents</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-300">Beta Feature</span>
          </div>
        </div>
      </div>

      {/* Beta Warning */}
      <div className="mx-6 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-300 mb-1">Beta Feature - Experimental</h3>
            <p className="text-sm text-yellow-200/80 leading-relaxed">
              Document extraction is in beta with 60-70% accuracy. You'll be able to review and edit all extracted data before calculating your valuation.
              For fastest results, we recommend using{' '}
              <button 
                onClick={() => navigate('/instant')} 
                className="underline font-semibold hover:text-yellow-100 transition-colors"
              >
                AI lookup
              </button>
              {' '}or{' '}
              <button 
                onClick={() => navigate('/manual')} 
                className="underline font-semibold hover:text-yellow-100 transition-colors"
              >
                manual entry
              </button>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {stage === 'upload' && (
          <div className="h-full flex flex-col">
            {/* Progress Indicator */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">Upload Documents</span>
                </div>
                <div className="flex-1 h-px bg-zinc-700" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">Calculate Valuation</span>
                </div>
              </div>
            </div>

            {/* Upload Component */}
            <div className="flex-1 overflow-auto">
              <TwoStepFlow onValuationComplete={handleValuationComplete} />
            </div>
          </div>
        )}

        {stage === 'results' && (
          <div className="h-full flex flex-col">
            {/* Results Header */}
            <div className="px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Valuation Complete</h2>
                    <p className="text-sm text-zinc-400">Your business valuation results</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {reportSaved && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <Save className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium text-green-300">Saved</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleNewValuation}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    New Valuation
                  </button>
                </div>
              </div>
            </div>

            {/* Results Component */}
            <div className="flex-1 overflow-auto">
              <Results />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
