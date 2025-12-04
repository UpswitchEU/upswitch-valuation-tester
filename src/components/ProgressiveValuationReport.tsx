/**
 * ProgressiveValuationReport Component
 * Displays valuation report sections as they're generated progressively
 * Similar to Lovable.dev's real-time code generation
 */

import { AlertCircle } from 'lucide-react';
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
}

export const ProgressiveValuationReport: React.FC<ProgressiveValuationReportProps> = ({
  className = '',
  sections = [],
  phase: _phase = 0,
  finalHtml = '',
  isGenerating = false
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




  // BANK-GRADE REFACTORING: Removed renderFallbackSection()
  // 
  // Rationale (Bank-Grade Excellence Audit):
  // 1. Single Responsibility: Frontend should only render, not generate fallback HTML
  // 2. No Duplication: Server-generated html_report is the single source of truth
  // 3. Fail Fast: Better to show error than silently render inferior fallback content
  // 4. Transparency: If HTML generation fails, we should know about it, not hide it
  // 5. Consistency: Aligned with backend removal of fallback HTML generation
  //
  // If sections come with is_fallback flag, they are now treated as errors
  // and rendered using renderErrorSection() instead.

  // Render error section
  const renderErrorSection = (section: ReportSection) => {
    return (
      <div className="section-error bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
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


  // BANK-GRADE: Main section renderer - no fallback HTML generation
  // If sections come with is_fallback flag, treat them as errors (fail fast)
  const renderSection = (section: ReportSection) => {
    // BANK-GRADE: Treat fallback sections as errors - no inferior fallback HTML rendering
    if (section.is_fallback || section.is_error) {
      return renderErrorSection({
        ...section,
        is_error: true,
        error_message: section.is_fallback 
          ? 'This section was marked as fallback. Fallback HTML generation has been removed per bank-grade standards. Please ensure the main report generation succeeds.'
          : section.error_message
      });
    }
    // Render section HTML directly without wrapper
    // Safety check: only render if HTML content exists
    if (!section.html || section.html.trim() === '') {
      return null;
    }
    return <div dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(section.html) }} />;
  };

  // BANK-GRADE: Filter out sections with no content to avoid empty divs
  // Fallback sections are now treated as errors, so they're always shown
  const hasContent = (section: ReportSection): boolean => {
    // BANK-GRADE: is_fallback sections are treated as errors - always show them
    if (section.is_error || section.is_fallback) {
      return true; // Always show error/fallback sections
    }
    return !!(section.html && section.html.trim() !== '');
  };

  // Determine if we should show the loading state
  const shouldShowLoading = isGenerating && !finalReport && sections.length === 0;

  return (
    <div className={`progressive-report px-4 sm:px-6 lg:px-8 min-h-full flex flex-col ${className}`}>
      {/* Show loading state when generating and no content yet */}
      {shouldShowLoading ? (
        <div className="flex items-center justify-center w-full flex-grow min-h-[400px]">
          <LoadingState />
        </div>
      ) : (
        <>
          {/* Render sections in order */}
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

      {/* Final complete report */}
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

          {/* Empty state - only show if no sections, not generating, AND no final report */}
          {sections.length === 0 && !isGenerating && !finalReport && (
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

