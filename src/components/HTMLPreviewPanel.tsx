import { Loader2 } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';
import { useProgressiveReport } from '../hooks/useProgressiveReport';
import { HTMLProcessor } from '../utils/htmlProcessor';
import { ConfettiAnimation } from './valuation/ConfettiAnimation';
import { ProgressBar } from './valuation/ProgressBar';
import { ProgressiveReportSection } from './valuation/ProgressiveReportSection';

interface HTMLPreviewPanelProps {
  htmlContent: string;
  isGenerating: boolean;
  progress?: number;
  onSectionLoading?: (event: any) => void;
  onSectionComplete?: (event: any) => void;
}

export interface HTMLPreviewPanelRef {
  handleSectionLoading: (event: any) => void;
  handleSectionComplete: (event: any) => void;
  handleSectionError: (sectionId: string, error: string) => void;
  clearSections: () => void;
}

/**
 * HTMLPreviewPanel Component
 * 
 * Displays progressive valuation report with section-by-section rendering.
 * Features smooth animations, loading states, and celebration effects.
 * 
 * Architecture:
 * - Uses useProgressiveReport hook for state management
 * - Renders ProgressiveReportSection components for each section
 * - Shows ProgressBar for overall progress
 * - Displays ConfettiAnimation on 100% completion
 * 
 * @param htmlContent - Legacy HTML content (fallback)
 * @param isGenerating - Whether report is being generated
 * @param progress - Overall progress percentage (0-100)
 * @param onSectionLoading - Callback when section starts loading
 * @param onSectionComplete - Callback when section completes
 */
export const HTMLPreviewPanel = forwardRef<HTMLPreviewPanelRef, HTMLPreviewPanelProps>(({
  htmlContent,
  isGenerating,
  progress = 0,
  onSectionLoading,
  onSectionComplete
}, ref) => {
  const {
    sections,
    overallProgress,
    handleSectionLoading,
    handleSectionComplete,
    handleSectionError,
    clearSections,
    retrySection
  } = useProgressiveReport();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleSectionLoading: (event: any) => {
      handleSectionLoading({
        sectionId: event.sectionId || event.section_id,
        sectionName: event.sectionName || event.section_name,
        html: event.html,
        phase: event.phase
      });
      onSectionLoading?.(event);
    },
    handleSectionComplete: (event: any) => {
      handleSectionComplete({
        sectionId: event.sectionId || event.section_id,
        sectionName: event.sectionName || event.section_name,
        html: event.html,
        progress: event.progress,
        phase: event.phase
      });
      onSectionComplete?.(event);
    },
    handleSectionError,
    clearSections
  }), [handleSectionLoading, handleSectionComplete, handleSectionError, clearSections, onSectionLoading, onSectionComplete]);

  // Use progressive sections if available, otherwise fall back to legacy HTML
  const hasProgressiveSections = sections.length > 0;
  const displayProgress = hasProgressiveSections ? overallProgress : progress;

  return (
    <div className="h-full overflow-y-auto bg-gray-100 relative">
      {/* Progress indicator - sticky at top */}
      {(isGenerating || hasProgressiveSections) && displayProgress < 100 && (
        <ProgressBar progress={displayProgress} showPercentage={true} />
      )}

      {/* Legacy loading indicator (fallback) */}
      {isGenerating && !hasProgressiveSections && (
        <div className="sticky top-0 bg-river-50 border-b border-river-200 p-3 z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-river-600" />
            <span className="text-sm text-river-700">
              Generating valuation... {displayProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Progressive sections */}
      <div className="valuation-report-preview">
        {hasProgressiveSections ? (
          <div className="space-y-4">
            {sections.map(section => (
              <ProgressiveReportSection
                key={section.id}
                section={section}
                onRetry={retrySection}
              />
            ))}
          </div>
        ) : (
          /* Legacy HTML content (fallback) */
          htmlContent && (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(htmlContent) }}
            />
          )
        )}
      </div>

      {/* Empty state */}
      {!hasProgressiveSections && !htmlContent && !isGenerating && (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium">No valuation report yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start chatting to generate your personalized valuation
            </p>
          </div>
        </div>
      )}

      {/* Celebration animation on 100% completion */}
      {displayProgress === 100 && hasProgressiveSections && (
        <ConfettiAnimation />
      )}
    </div>
  );
});

HTMLPreviewPanel.displayName = 'HTMLPreviewPanel';
