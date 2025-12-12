import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { HTMLProcessor } from '../utils/htmlProcessor';
import { ErrorState } from './ErrorState';
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
      <div className="section-error bg-accent-50/50 border-l-4 border-accent-400 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-1">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-accent-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-accent-900 mb-1">Unable to generate this section</h4>
            {section.error_message && (
              <p className="text-sm text-accent-700 mb-3 leading-relaxed">{section.error_message}</p>
            )}
            <div className="text-sm text-accent-700">
              <p className="mb-2">Don't worry—this is common. Here's what you can try:</p>
              <ul className="list-disc list-inside space-y-1.5 ml-1">
                <li>Review your financial data for completeness</li>
                <li>Ensure all required fields are filled accurately</li>
                <li>Try refreshing the page or recalculating</li>
              </ul>
            </div>
          </div>
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
  
  // BANK-GRADE: Show loading state whenever isGenerating is true AND no final report AND no error
  // This ensures loading persists until report is actually ready or error occurs
  // Previously: Only showed when sections.length === 0, which caused loading to disappear
  // when initial loading section was added. Now shows loading whenever generating,
  // regardless of sections, until final report is available or error occurs.
  const showFullLoadingState = isLoading;
  const showFullErrorState = error && !finalReport;

  // Only show sections if we are not showing full loading state AND not showing full error state
  // If we have an error but no sections, we show full error state
  // If we have an error AND sections, we show sections + error at bottom (or top)
  // Actually, per user request: "Ensure the loading state runs until the errors shows just like it does when it actual reports shows succesfully."
  // This implies we should show whatever we have.
  
  return (
    <div className={`progressive-report valuation-report-preview flex flex-col ${className}`}>
      
      {/* 1. LOADING STATE - Centered & Persistent until content or error */}
      {showFullLoadingState && !showFullErrorState && (
        <div className="flex flex-col items-center justify-center w-full flex-grow min-h-[400px]">
          <LoadingState compact />
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
          {/* Progressive Sections - Only show if no error */}
          {!finalReport && sections.length > 0 && !error && (
            <div className="report-sections space-y-6">
              {sections
                .filter(section => section.id && typeof section.id === 'string' && hasContent(section))
                .sort((a, b) => a.phase - b.phase || a.timestamp.getTime() - b.timestamp.getTime())
                .map(section => (
                  <div key={section.id} className="report-section fade-in page">
                    {renderSection(section)}
                  </div>
                ))}
            </div>
          )}

          {/* Error State - Show centered if error exists (even if sections were partially generated) */}
          {error && sections.length > 0 && !finalReport && (
            <div className="flex items-center justify-center w-full flex-grow min-h-[400px]">
              <ErrorState
                title="Generation Interrupted"
                message={error || "The report generation was interrupted. Please try again."}
                onRetry={onRetry}
                variant="light"
              />
            </div>
          )}

          {/* Final Report */}
          {finalReport && (
            <div className="final-report mt-8">
              <div 
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

