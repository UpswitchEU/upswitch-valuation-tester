import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, TrendingUp, CheckCircle, Save, ArrowLeft, DollarSign } from 'lucide-react';
import { ConversationUI } from './ConversationUI';
import type { ValuationResult } from '../types/valuation';

type FlowStage = 'chat' | 'preview' | 'results';

export const AIAssistedValuation: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<FlowStage>('chat');
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const [reportSaved, setReportSaved] = useState(false);

  const handleCompanyFound = (data: any) => {
    setCompanyData(data);
    setStage('preview');
  };

  const handleValuationComplete = (result: ValuationResult) => {
    setValuationResult(result);
    setStage('results');
    setReportSaved(true);
  };

  const handleStartOver = () => {
    setStage('chat');
    setCompanyData(null);
    setValuationResult(null);
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
              <h1 className="text-base sm:text-lg font-bold text-white truncate">Instant Valuation</h1>
              <p className="text-xs text-zinc-400 hidden sm:block">AI-powered company lookup</p>
            </div>
          </div>

          {/* Stage indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 flex-shrink-0">
            <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
              stage === 'chat' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Lookup</span>
            </div>
            <div className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
              stage === 'preview' ? 'bg-primary-500/20 text-primary-300' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <Database className="w-3 h-3 flex-shrink-0" />
              <span className="hidden md:inline">Review</span>
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

      {/* Full-screen Split Panel - Ilara Style */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-2 sm:mx-4 my-2 sm:my-4 rounded-lg border border-zinc-800">
        {/* Left Panel: Chat (60% on desktop, full width on mobile) */}
        <div className="h-full flex flex-col bg-zinc-900 lg:border-r border-zinc-800 w-full lg:w-[60%]">
          {/* Success Banner when results are ready */}
          {stage === 'results' && valuationResult && (
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg sm:rounded-xl p-4 sm:p-6 m-3 sm:m-6 mb-0">
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
                      <span className="hidden lg:inline">Your report is displayed on the right. Scroll below to see the conversation history.</span>
                      <span className="lg:hidden">Your report is displayed below. Scroll down to see the conversation history.</span>
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
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
                  >
                    Value Another Company
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat - Always visible */}
          <div className="flex-1 overflow-y-auto">
            <ConversationUI
              companyId="demo-company"
              onComplete={handleValuationComplete}
              onError={(error) => {
                console.error('Conversation error:', error);
              }}
            />
          </div>
        </div>

        {/* Right Panel: Preview/Results (40% on desktop, full width on mobile below chat) */}
        <div className="h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-y-auto w-full lg:w-[40%] border-t lg:border-t-0 border-zinc-800">
          {(stage === 'chat') && !valuationResult && (
            <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                Your valuation report will appear here once the conversation is complete.
              </p>
            </div>
          )}

          {stage === 'preview' && companyData && !valuationResult && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="bg-zinc-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Company Data Preview</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Company:</strong> {companyData.company_name || 'Demo Company'}</div>
                  <div><strong>Industry:</strong> {companyData.industry || 'Technology'}</div>
                  <div><strong>Country:</strong> {companyData.country || 'Belgium'}</div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Continue the conversation to complete your valuation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {stage === 'results' && valuationResult && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Valuation Complete</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-zinc-900 mb-2">Equity Value</h4>
                    <div className="text-2xl font-bold text-green-600">
                      €{valuationResult.equity_value?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  
                  {valuationResult.valuation_range && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-zinc-900 mb-2">Valuation Range</h4>
                      <div className="text-sm text-zinc-600">
                        €{valuationResult.valuation_range.min?.toLocaleString()} - €{valuationResult.valuation_range.max?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {valuationResult.confidence_score && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-zinc-900 mb-2">Confidence Score</h4>
                      <div className="text-sm text-zinc-600">
                        {(valuationResult.confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                  
                  {valuationResult.methodology && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-zinc-900 mb-2">Methodology</h4>
                      <div className="text-sm text-zinc-600">
                        {valuationResult.methodology}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
