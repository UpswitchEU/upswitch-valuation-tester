import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, TrendingUp, CheckCircle, Save, ArrowLeft, DollarSign } from 'lucide-react';
import { EnhancedConversationalChat } from './EnhancedConversationalChat';
import { RegistryDataPreview } from './RegistryDataPreview';
import { Results } from '../Results';
import { ConversationalFinancialInput } from '../valuation/ConversationalFinancialInput';
import type { CompanyFinancialData } from '../../types/registry';
import { useValuationStore } from '../../store/useValuationStore';
import { useReportsStore } from '../../store/useReportsStore';
import { urls } from '../../router';

type FlowStage = 'chat' | 'financial-input' | 'preview' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [companyData, setCompanyData] = useState<CompanyFinancialData | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  // const [financialSummary, setFinancialSummary] = useState<any | null>(null);
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
    setSelectedCompanyId(data.company_id);
    
    // Check if we have financial data from API
    if (data.filing_history && data.filing_history.length > 0 && data.filing_history[0].revenue) {
      // We have API financial data - go directly to preview
      setStage('preview');
    } else {
      // No API financial data - collect via conversational input
      setStage('financial-input');
    }
  };
  
  const handleFinancialInputComplete = (summary: any, _valuationId?: string) => {
    // setFinancialSummary(summary);
    // Convert summary to CompanyFinancialData format for preview
    if (companyData) {
      const updatedCompanyData: CompanyFinancialData = {
        ...companyData,
        filing_history: [{
          year: 2023, // TODO: Make dynamic
          revenue: summary.revenue,
          ebitda: summary.ebitda,
          net_income: summary.net_income,
          total_assets: summary.total_assets,
          total_debt: summary.total_debt,
          cash: summary.cash,
          filing_date: new Date().toISOString().split('T')[0],
          source_url: undefined
        }]
      };
      setCompanyData(updatedCompanyData);
    }
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
    setSelectedCompanyId(null);
    // setFinancialSummary(null);
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
              <h1 className="text-lg font-bold text-white">⚡ Instant Valuation</h1>
              <p className="text-xs text-zinc-400">AI-powered company lookup</p>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              stage === 'chat' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <MessageSquare className="w-3 h-3" />
              <span>Lookup</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              stage === 'financial-input' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <DollarSign className="w-3 h-3" />
              <span>Financial Data</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              stage === 'preview' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Database className="w-3 h-3" />
              <span>Review</span>
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
        {/* Left Panel: Chat/Content (60% width) */}
        <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800" style={{ width: '60%' }}>
          {stage === 'chat' && (
            <div className="flex-1 overflow-y-auto">
              <EnhancedConversationalChat onCompanyFound={handleCompanyFound} />
            </div>
          )}

          {stage === 'financial-input' && selectedCompanyId && (
            <div className="flex-1 overflow-y-auto">
              <ConversationalFinancialInput
                companyId={selectedCompanyId}
                onComplete={handleFinancialInputComplete}
                onError={(error) => {
                  console.error('Financial input error:', error);
                  // TODO: Show error message to user
                }}
              />
            </div>
          )}

          {stage === 'preview' && companyData && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <button
                  onClick={handleStartOver}
                  className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Search different company
                </button>
                <RegistryDataPreview
                  companyData={companyData}
                  onCalculateValuation={handleCalculate}
                />
              </div>
            </div>
          )}

          {stage === 'results' && result && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success Banner */}
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
                      className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
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

        {/* Right Panel: Preview (40% width) - Like Ilara */}
        <div className="h-full flex flex-col bg-white overflow-y-auto" style={{ width: '40%' }}>
          {(stage === 'chat' || stage === 'financial-input') && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
              <p className="text-sm text-zinc-500 max-w-xs">
                Your valuation report will appear here once the company data is found.
              </p>
            </div>
          )}

          {stage === 'preview' && companyData && (
            <div className="p-6 bg-zinc-50">
              <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Data Overview</h3>
                    <p className="text-xs text-zinc-500">From official registry</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Company Name</div>
                    <div className="text-sm font-semibold text-zinc-900">{companyData.company_name}</div>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Data Completeness</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(companyData.completeness_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary-600">
                        {Math.round(companyData.completeness_score * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Financial Years</div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {companyData.filing_history.length} years of data
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Data Source</div>
                    <div className="text-sm font-semibold text-zinc-900">{companyData.data_source}</div>
                  </div>
                </div>

                <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
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
          )}

          {stage === 'results' && (
            <div className="p-6 bg-zinc-50">
              <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Report Ready</h3>
                    <p className="text-xs text-zinc-500">Professional valuation complete</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-zinc-700">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

