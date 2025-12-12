/**
 * ReportPanel Component
 * 
 * Right panel containing the progressive report display.
 * Shows report sections as they stream in, with tabs for preview/source/info.
 * 
 * @module features/reports/components/ReportPanel
 */

import { lazy, memo, Suspense } from 'react';
import { TrendingUp } from 'lucide-react';
import { ProgressiveValuationReport } from '../../../components/ProgressiveValuationReport';
import { ValuationEmptyState } from '../../../components/ValuationEmptyState';
import type { ValuationResponse } from '../../../types/valuation';

const ValuationInfoPanel = lazy(() => import('../../../components/ValuationInfoPanel').then(m => ({ default: m.ValuationInfoPanel })));

type FlowStage = 'chat' | 'results' | 'blocked';
type ActiveTab = 'preview' | 'source' | 'info';

interface ReportPanelProps {
  stage: FlowStage;
  activeTab: ActiveTab;
  reportSections: any[];
  reportPhase: number;
  finalReportHtml: string;
  isGenerating: boolean;
  error: string | null;
  valuationResult: ValuationResponse | null;
  liveHtmlReport: string;
  onRefresh: () => void;
  isMobile: boolean;
  mobileActivePanel: 'chat' | 'preview';
}

/**
 * Report panel component
 * 
 * Displays progressive report generation or final report
 * based on current stage.
 */
export const ReportPanel = memo<ReportPanelProps>(({
  stage,
  activeTab,
  reportSections,
  reportPhase,
  finalReportHtml,
  isGenerating,
  error,
  valuationResult,
  liveHtmlReport,
  onRefresh,
  isMobile,
  mobileActivePanel,
}) => {
  return (
    <div 
      className={`${
        isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
      } h-full min-h-[400px] lg:min-h-0 flex flex-col bg-white overflow-y-auto w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
    >
      {/* Tab Content */}
      {activeTab === 'preview' && (
        <div className="flex flex-col h-full">
          {/* During conversation: Show progressive streaming */}
          {stage === 'chat' && (
            <>
              {(reportSections.length === 0 && !finalReportHtml && !error && !isGenerating) ? (
                <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">
                    Your valuation report will appear here once you submit the form.
                  </p>
                </div>
              ) : (
                <ProgressiveValuationReport
                  sections={reportSections}
                  phase={reportPhase}
                  finalHtml={finalReportHtml}
                  isGenerating={isGenerating}
                  error={error}
                  onRetry={onRefresh}
                />
              )}
            </>
          )}
          
          {/* After conversation: Show Accountant View HTML from valuationResult */}
          {stage === 'results' && valuationResult?.html_report && (
            <div className="h-full overflow-y-auto valuation-report-preview">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: valuationResult.html_report }}
              />
            </div>
          )}
          
          {/* Empty state */}
          {stage !== 'chat' && stage !== 'results' && <ValuationEmptyState />}
        </div>
      )}

      {activeTab === 'source' && (
        <div className="h-full bg-white p-6 overflow-y-auto">
          <div className="relative">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(liveHtmlReport || '');
                } catch (err) {
                  console.error('Failed to copy text:', err);
                }
              }}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Copy code"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <pre className="p-4 bg-gray-50 rounded-lg overflow-auto border border-gray-200 max-h-[calc(100vh-200px)] min-h-[400px]">
              <code className="text-sm text-black block whitespace-pre-wrap">
                {liveHtmlReport || 'No source code available'}
              </code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'info' && valuationResult && (
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        }>
          <ValuationInfoPanel result={valuationResult} />
        </Suspense>
      )}
    </div>
  );
});

ReportPanel.displayName = 'ReportPanel';

