import React, { useState } from 'react';
import { MessageSquare, Database, TrendingUp, CheckCircle } from 'lucide-react';
import { ConversationalChat } from './ConversationalChat';
import { RegistryDataPreview } from './RegistryDataPreview';
import type { CompanyFinancialData } from '../../types/registry';
import { useValuationStore } from '../../store/useValuationStore';
import { useReportsStore } from '../../store/useReportsStore';

type FlowStage = 'chat' | 'preview' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const [stage, setStage] = useState<FlowStage>('chat');
  const [companyData, setCompanyData] = useState<CompanyFinancialData | null>(null);
  const { calculateValuation, result } = useValuationStore();
  const { addReport } = useReportsStore();

  const handleCompanyFound = (data: CompanyFinancialData) => {
    setCompanyData(data);
    setStage('preview');
  };

  const handleCalculate = async () => {
    await calculateValuation();
    setStage('results');
    
    // Save report if calculation was successful
    if (result && companyData) {
      addReport({
        company_name: companyData.company_name,
        source: 'instant',
        result: result,
        form_data: companyData,
      });
    }
    
    // Scroll to results
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartOver = () => {
    setStage('chat');
    setCompanyData(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {/* Step 1: Chat */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                stage === 'chat'
                  ? 'bg-primary-600 text-white shadow-lg scale-110'
                  : stage === 'preview' || stage === 'results'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stage === 'preview' || stage === 'results' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <MessageSquare className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Step 1: AI Lookup</div>
              <div className="text-sm text-gray-500">Find your company</div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex-1 h-0.5 bg-gray-200 mx-4">
            <div
              className={`h-full transition-all duration-500 ${
                stage === 'preview' || stage === 'results' ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
              }`}
            />
          </div>

          {/* Step 2: Preview */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                stage === 'preview'
                  ? 'bg-primary-600 text-white shadow-lg scale-110'
                  : stage === 'results'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {stage === 'results' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <Database className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Step 2: Review Data</div>
              <div className="text-sm text-gray-500">Verify & edit</div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex-1 h-0.5 bg-gray-200 mx-4">
            <div
              className={`h-full transition-all duration-500 ${
                stage === 'results' ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
              }`}
            />
          </div>

          {/* Step 3: Results */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                stage === 'results'
                  ? 'bg-primary-600 text-white shadow-lg scale-110'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Step 3: Valuation</div>
              <div className="text-sm text-gray-500">Get your value</div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="animate-fadeIn">
        {stage === 'chat' && (
          <ConversationalChat onCompanyFound={handleCompanyFound} />
        )}

        {stage === 'preview' && companyData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleStartOver}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Search different company
              </button>
            </div>
            <RegistryDataPreview
              companyData={companyData}
              onCalculateValuation={handleCalculate}
            />
          </div>
        )}

        {stage === 'results' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Valuation Complete!
            </h3>
            <p className="text-gray-600 mb-6">
              Your business valuation is ready. Scroll down to view the full report.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                View Results
              </button>
              <button
                onClick={handleStartOver}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Value Another Company
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

