import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, TrendingUp, CheckCircle, Save } from 'lucide-react';
import { EnhancedConversationalChat } from './EnhancedConversationalChat';
import { RegistryDataPreview } from './RegistryDataPreview';
import { Results } from '../Results';
import type { CompanyFinancialData } from '../../types/registry';
import { useValuationStore } from '../../store/useValuationStore';
import { useReportsStore } from '../../store/useReportsStore';
import { urls } from '../../router';

type FlowStage = 'chat' | 'preview' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [companyData, setCompanyData] = useState<CompanyFinancialData | null>(null);
  const { calculateValuation, result } = useValuationStore();
  const { addReport } = useReportsStore();
  const [reportSaved, setReportSaved] = useState(false);

  // Auto-save report when result is available
  useEffect(() => {
    if (result && companyData && stage === 'results' && !reportSaved) {
      addReport({
        company_name: companyData.company_name,
        source: 'instant',
        result: result,
        form_data: companyData,
      });
      setReportSaved(true);
    }
  }, [result, companyData, stage, reportSaved, addReport]);

  const handleCompanyFound = (data: CompanyFinancialData) => {
    setCompanyData(data);
    setStage('preview');
  };

  const handleCalculate = async () => {
    await calculateValuation();
    
    // Move to results stage (show inline)
    setStage('results');
    
    // Auto-save report to localStorage
    if (result && companyData) {
      addReport({
        company_name: companyData.company_name,
        source: 'instant',
        result: result,
        form_data: companyData,
      });
    }
  };

  const handleStartOver = () => {
    setStage('chat');
    setCompanyData(null);
    setReportSaved(false);
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


      {/* Main Content - Two Column Layout */}
      <div className="animate-fadeIn">
        {stage === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Conversational Chat */}
            <div className="lg:col-span-1">
              <EnhancedConversationalChat onCompanyFound={handleCompanyFound} />
            </div>

            {/* Right Column: Live Preview / Info */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">AI-Powered Lookup</h3>
                    <p className="text-xs text-gray-500">Real-time company discovery</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">How It Works</h4>
                    <ol className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Enter your company name in the chat</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">2</span>
                        <span>AI searches official registries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Review and verify your data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">4</span>
                        <span>Get instant valuation results</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">💡 Tip</p>
                        <p>Simply type your company name (e.g., "Proximus Belgium") and our AI will handle the rest!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {stage === 'preview' && companyData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Data Preview with Edit */}
            <div className="lg:col-span-1">
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
            </div>

            {/* Right Column: Quick Preview Stats */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl shadow-lg border border-primary-200 p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Data Overview</h3>
                    <p className="text-xs text-gray-500">From official registry</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Company Name</div>
                    <div className="text-sm font-semibold text-gray-900">{companyData.company_name}</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Data Completeness</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(companyData.completeness_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary-600">
                        {Math.round(companyData.completeness_score * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Financial Years</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {companyData.filing_history.length} years of data
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Data Source</div>
                    <div className="text-sm font-semibold text-gray-900">{companyData.data_source}</div>
                  </div>
                </div>

                <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-green-700">
                      <p className="font-medium mb-1">✓ Verified Data</p>
                      <p>All financial data is sourced from official registries and can be edited before calculation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {stage === 'results' && result && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Valuation Complete!
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Your business valuation report is ready. Scroll down to view the full analysis.
                    </p>
                    {reportSaved && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Save className="w-4 h-4" />
                        <span className="font-medium">Auto-saved to Reports</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(urls.reports())}
                    className="px-4 py-2 text-sm bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium"
                  >
                    View All Reports
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Value Another Company
                  </button>
                </div>
              </div>
            </div>

            {/* Inline Results Display */}
            <Results />
          </div>
        )}
      </div>

    </div>
  );
};

