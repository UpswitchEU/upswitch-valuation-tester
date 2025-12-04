import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { HTMLProcessor } from '../utils/htmlProcessor';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

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

  // Determine state - Priority: Error > Loading > Content
  // Loading: Generating AND No Final Report AND No Error
  // Keep loading visible until we have definitive outcome (error OR finalReport)
  const isLoading = isGenerating && !finalReport && !error;
  
  // Show Loading State if loading AND no sections yet
  // If sections exist, we show them progressively
  // Loading persists until error appears (smooth transition)
  // Error state takes priority - show even if isGenerating becomes false
  const showFullLoadingState = isLoading && sections.length === 0 && !error;
  const showFullErrorState = error && sections.length === 0 && !finalReport;

  // Only show sections if we are not showing full loading state AND not showing full error state
  // If we have an error but no sections, we show full error state
  // If we have an error AND sections, we show sections + error at bottom (or top)
  // Actually, per user request: "Ensure the loading state runs until the errors shows just like it does when it actual reports shows succesfully."
  // This implies we should show whatever we have.
  
  return (
    <div className={`progressive-report px-4 sm:px-6 lg:px-8 min-h-full flex flex-col ${className}`}>
      
      {/* 1. LOADING STATE - Centered & Persistent until content or error */}
      {showFullLoadingState && !showFullErrorState && (
        <div className="flex items-center justify-center w-full flex-grow min-h-[400px]">
          <LoadingState />
        </div>
      )}

      {/* 2. ERROR STATE - Centered if no content, takes priority over loading */}
      {showFullErrorState && (
        <div className="flex items-center justify-center w-full flex-grow min-h-[400px]">
          <ErrorState
            title="Valuation Generation Failed"
            message={error}
            onRetry={onRetry}
            variant="light"
          />
        </div>
      )}

      {/* 3. CONTENT - Sections or Final Report */}
      {!showFullLoadingState && !showFullErrorState && (
        <>
          {/* Progressive Sections */}
          {!finalReport && sections.length > 0 && (
            <div className="report-sections space-y-6">
              {sections
                .filter(section => section.id && typeof section.id === 'string' && hasContent(section))
                .sort((a, b) => a.phase - b.phase || a.timestamp.getTime() - b.timestamp.getTime())
                .map(section => (
                  <div key={section.id} className="report-section fade-in">
                    {renderSection(section)}
                  </div>
                ))}
                
              {/* If we have sections AND an error, show error at the bottom */}
              {error && (
                 <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-red-700 font-medium mb-2">
                       <AlertTriangle className="w-5 h-5" />
                       <span>Generation Interrupted</span>
                    </div>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    {onRetry && (
                      <button 
                        onClick={onRetry}
                        className="text-sm text-red-700 hover:text-red-800 font-medium underline"
                      >
                        Try Again
                      </button>
                    )}
                 </div>
              )}
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

          {/* Empty State (Only if truly empty, not loading, no error, no content) */}
          {sections.length === 0 && !finalReport && !isGenerating && !error && (
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
    </div>
  );
};

// Export the component and types
export type { ProgressiveValuationReportProps, ReportSection };

