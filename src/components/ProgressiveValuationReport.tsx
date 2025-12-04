import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';
import { HTMLProcessor } from '../utils/htmlProcessor';
import { LoadingState } from './LoadingState';

interface ReportSection {
  id: string;
  phase: number;
  html: string;
  progress: number;
  timestamp: Date;
  status: 'loading' | 'completed' | 'error';
  is_fallback?: boolean;
  is_error?: boolean;
  error_message?: string;
}

interface ProgressiveValuationReportProps {
  className?: string;
  sections?: any[];
  phase?: number;
  finalHtml?: string;
  isGenerating?: boolean;
  error?: string | null; // Added error prop
  onRetry?: () => void; // Added retry callback
}

export const ProgressiveValuationReport: React.FC<ProgressiveValuationReportProps> = ({
  className = '',
  sections = [],
  phase: _phase = 0,
  finalHtml = '',
  isGenerating = false,
  error = null,
  onRetry
}) => {
  // Use props directly instead of useState to prevent stale data
  const finalReport = finalHtml;

  // Remove "Complete Valuation Report" header if present
  React.useEffect(() => {
    if (!finalReport) return;

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const reportElement = document.querySelector('.final-report');
      if (!reportElement) return;

      // Find and remove the header div with CheckCircle icon
      // Look for divs containing both a circle-check SVG and "Complete Valuation Report" text
      const allDivs = reportElement.querySelectorAll('div');
      allDivs.forEach((div) => {
        const hasCheckIcon = div.querySelector('svg[class*="circle-check"], svg.lucide-circle-check-big');
        const hasCompleteReportText = div.textContent?.includes('Complete Valuation Report');
        
        if (hasCheckIcon && hasCompleteReportText) {
          div.remove();
        }
      });
    });
  }, [finalReport]);

  // Render error section (inline section error)
  const renderSectionError = (section: ReportSection) => {
    return (
      <div className="section-error bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 font-medium">Unable to generate this section</span>
        </div>
        {section.error_message && (
          <p className="text-sm text-red-600 mb-3">{section.error_message}</p>
        )}
        <div className="text-sm text-red-600">
          <p>This section could not be calculated. Please try:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Providing additional financial information</li>
            <li>Checking that your data is complete and accurate</li>
            <li>Refreshing the page</li>
          </ul>
        </div>
      </div>
    );
  };

  // Render section
  const renderSection = (section: ReportSection) => {
    if (section.is_fallback || section.is_error) {
      return renderSectionError({
        ...section,
        is_error: true,
        error_message: section.is_fallback 
          ? 'This section was marked as fallback. Fallback HTML generation has been removed per bank-grade standards.'
          : section.error_message
      });
    }
    
    if (!section.html || section.html.trim() === '') {
      return null;
    }
    return <div dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(section.html) }} />;
  };

  // Filter content
  const hasContent = (section: ReportSection): boolean => {
    if (section.is_error || section.is_fallback) {
      return true;
    }
    return !!(section.html && section.html.trim() !== '');
  };

  // Determine state
  // Loading: Generating AND No Final Report AND No Error
  const isLoading = isGenerating && !finalReport && !error;
  
  // Show Loading State if loading AND no sections yet
  // If sections exist, we show them progressively
  const showFullLoadingState = isLoading && sections.length === 0;

  return (
    <div className={`progressive-report px-4 sm:px-6 lg:px-8 min-h-full flex flex-col ${className}`}>
      
      {/* 1. ERROR STATE - Centered & Designed */}
      {error ? (
        <div className="flex flex-col items-center justify-center w-full flex-grow min-h-[400px] animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generation Failed
            </h3>
            <p className="text-gray-500 mb-6 leading-relaxed">
              {error}
            </p>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. LOADING STATE - Centered */}
          {showFullLoadingState ? (
            <div className="flex items-center justify-center w-full flex-grow min-h-[400px]">
              <LoadingState />
            </div>
          ) : (
            <>
              {/* 3. CONTENT - Sections or Final Report */}
              
              {/* Progressive Sections */}
              {!finalReport && (
                <div className="report-sections space-y-6">
                  {sections
                    .filter(section => section.id && typeof section.id === 'string' && hasContent(section))
                    .sort((a, b) => a.phase - b.phase || a.timestamp.getTime() - b.timestamp.getTime())
                    .map(section => (
                      <div key={section.id} className="report-section fade-in">
                        {renderSection(section)}
                      </div>
                    ))}
                </div>
              )}

              {/* Final Report */}
              {finalReport && (
                <div className="final-report mt-8 bg-white rounded-lg shadow-sm border border-gray-200 py-6 px-8 md:px-12">
                  <style>{`
                    /* Ensure lists show bullet points */
                    .final-report ul,
                    .final-report ol {
                      margin-left: 36pt !important;
                      padding-left: 18pt !important;
                      list-style-type: disc !important;
                      list-style-position: outside !important;
                      display: block !important;
                    }

                    .final-report ol {
                      list-style-type: decimal !important;
                    }

                    .final-report li {
                      display: list-item !important;
                      list-style-position: outside !important;
                      margin-bottom: 6pt;
                    }

                    /* Hide "Complete Valuation Report" header */
                    .final-report div.flex.items-center.mb-4:has(svg.lucide-circle-check-big),
                    .final-report div:has(> svg.lucide-circle-check-big):has(> h2),
                    .final-report div:has(svg[class*="circle-check"]):has(h2) {
                      display: none !important;
                    }
                  `}</style>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: finalReport }}
                  />
                </div>
              )}

              {/* Empty State (Only if truly empty and not loading) */}
              {sections.length === 0 && !finalReport && !isGenerating && (
                <div className="empty-state text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated Yet</h3>
                  <p className="text-gray-500">
                    Start a conversation to begin generating your valuation report.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// Export the component and types
export type { ProgressiveValuationReportProps, ReportSection };

