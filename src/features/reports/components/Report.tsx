/**
 * Report Compound Component
 * 
 * Compound component pattern for report display.
 * Reduces prop drilling by using React Context internally.
 * 
 * Usage:
 * ```tsx
 * <Report value={reportData}>
 *   <Report.Header />
 *   <Report.Progress />
 *   <Report.Content />
 *   <Report.Actions />
 * </Report>
 * ```
 * 
 * @module features/reports/components/Report
 */

import { createContext, memo, ReactNode, useContext } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import type { ValuationResponse } from '../../../types/valuation';

interface ReportContextValue {
  report: ValuationResponse | null;
  htmlContent: string;
  isGenerating: boolean;
  progress: number;
  onDownload?: () => void;
  onFullScreen?: () => void;
  onRefresh?: () => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

function useReportContext() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('Report compound components must be used within <Report>');
  }
  return context;
}

interface ReportProps {
  children: ReactNode;
  value: ReportContextValue;
}

/**
 * Root Report component
 * Provides context for all sub-components
 */
const ReportRoot = memo<ReportProps>(({ children, value }) => {
  return (
    <ReportContext.Provider value={value}>
      <div className="h-full flex flex-col bg-white">
        {children}
      </div>
    </ReportContext.Provider>
  );
});

ReportRoot.displayName = 'Report';

/**
 * Report Header sub-component
 * Displays report title and metadata
 */
const ReportHeader = memo(() => {
  const { report } = useReportContext();
  
  if (!report) return null;
  
  return (
    <div className="border-b border-zinc-200 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
        Valuation Report
      </h2>
      {report.valuation_id && (
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          ID: {report.valuation_id}
        </p>
      )}
    </div>
  );
});

ReportHeader.displayName = 'Report.Header';

/**
 * Report Progress sub-component
 * Shows generation progress
 */
const ReportProgress = memo(() => {
  const { isGenerating, progress } = useReportContext();
  
  if (!isGenerating) return null;
  
  return (
    <div className="border-b border-zinc-200 p-4 bg-primary-50">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-primary-900">
              Generating report...
            </span>
            <span className="text-xs text-primary-700">{progress}%</span>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ReportProgress.displayName = 'Report.Progress';

/**
 * Report Content sub-component
 * Displays the HTML report content
 */
const ReportContent = memo(() => {
  const { htmlContent, report } = useReportContext();
  
  if (!htmlContent && !report?.html_report) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-zinc-400">No report content available</p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent || report?.html_report || '' }}
      />
    </div>
  );
});

ReportContent.displayName = 'Report.Content';

/**
 * Report Actions sub-component
 * Displays action buttons (download, fullscreen, refresh)
 */
const ReportActions = memo(() => {
  const { onDownload, onFullScreen, onRefresh, isGenerating } = useReportContext();
  
  return (
    <div className="border-t border-zinc-200 p-4 bg-zinc-50">
      <div className="flex items-center gap-2">
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download</span>
          </button>
        )}
        {onFullScreen && (
          <button
            onClick={onFullScreen}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="text-sm font-medium">Full Screen</span>
          </button>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isGenerating}
            className="ml-auto px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium">Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
});

ReportActions.displayName = 'Report.Actions';

/**
 * Compound Report component with sub-components
 */
export const Report = Object.assign(ReportRoot, {
  Header: ReportHeader,
  Progress: ReportProgress,
  Content: ReportContent,
  Actions: ReportActions,
});

