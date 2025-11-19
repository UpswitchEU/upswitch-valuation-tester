/**
 * ProgressiveValuationReport Component
 * Displays valuation report sections as they're generated progressively
 * Similar to Lovable.dev's real-time code generation
 */

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import React from 'react';

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
  phase = 0,
  finalHtml = '',
  isGenerating = false
}) => {
  // Use props directly instead of useState to prevent stale data
  const currentPhase = phase;
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


  // Get pending sections for current phase
  const getPendingSections = (phase: number): string[] => {
    const phaseSections = {
      1: ['preview'],
      2: ['dcf_basic', 'multiples'],
      3: ['dcf_complete', 'adjustments'],
      4: ['owner_analysis']
    };
    
    // Filter out sections with invalid IDs before mapping
    const completedSections = sections
      .filter(s => s.id && typeof s.id === 'string')
      .map(s => s.id as string);
    return phaseSections[phase as keyof typeof phaseSections]?.filter(
      section => !completedSections.includes(section)
    ) || [];
  };

  // Render shimmer loading effect for pending sections - inspired by Ilara-mercury
  const renderShimmerPlaceholder = (sectionId: string) => (
    <motion.div
      key={`shimmer-${sectionId}`}
      className="bg-white rounded-lg p-6 mb-4 border border-gray-200 relative overflow-hidden"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-24 bg-gray-50 rounded overflow-hidden relative">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #f7fafc 0%, #edf2f7 50%, #f7fafc 100%)',
          }}
        />
      </div>
      <div className="text-center mt-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
          <Loader2 className="w-3 h-3 mr-2 animate-spin text-blue-600" />
          Preparing {getSectionDisplayName(sectionId)}...
        </span>
      </div>
    </motion.div>
  );

  // Render fallback section
  const renderFallbackSection = (section: ReportSection) => {
    return (
      <div className="section-fallback border-l-4 border-yellow-500 bg-yellow-50 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-800 font-medium">
            Using industry averages - full calculation unavailable
          </span>
        </div>
        <div className="text-sm text-yellow-700 mb-3">
          This section uses simplified industry benchmarks due to limited data availability.
        </div>
        <div dangerouslySetInnerHTML={{ __html: section.html }} />
      </div>
    );
  };

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

  // Get section display name
  const getSectionDisplayName = (sectionId: string | undefined | null): string => {
    // Handle undefined/null sectionId
    if (!sectionId || typeof sectionId !== 'string') {
      return 'Unknown Section';
    }
    
    const sectionNames = {
      'instant': 'Instant Preview',
      'preview': 'Quick Preview',
      'dcf_basic': 'DCF Analysis',
      'multiples': 'Market Multiples',
      'dcf_full': 'Complete DCF',
      'adjustments': 'Risk Adjustments',
      'owner_factor': 'Owner Analysis',
      'complete': 'Final Valuation',
      'intermediate': 'Intermediate Analysis',
      'advanced': 'Advanced Analysis'
    };
    return sectionNames[sectionId as keyof typeof sectionNames] || sectionId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Main section renderer with fallback/error handling
  const renderSection = (section: ReportSection) => {
    if (section.is_fallback) {
      return renderFallbackSection(section);
    }
    if (section.is_error) {
      return renderErrorSection(section);
    }
    // Render section HTML directly without wrapper
    // Safety check: only render if HTML content exists
    if (!section.html || section.html.trim() === '') {
      return null;
    }
    return <div dangerouslySetInnerHTML={{ __html: section.html }} />;
  };

  // Filter out sections with no content to avoid empty divs
  const hasContent = (section: ReportSection): boolean => {
    if (section.is_fallback || section.is_error) {
      return true; // Always show fallback/error sections
    }
    return !!(section.html && section.html.trim() !== '');
  };

  return (
    <div className={`progressive-report ${className}`}>
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

      {/* Loading placeholders for pending phases - only show when no content exists */}
      {isGenerating && currentPhase < 4 && sections.length === 0 && (
        <div className="pending-sections mt-6">
          <div className="space-y-4">
            {getPendingSections(currentPhase + 1).map(section => 
              renderShimmerPlaceholder(section)
            )}
          </div>
        </div>
      )}

      {/* Final complete report */}
      {finalReport && (
        <div className="final-report mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

      {/* Empty state */}
      {sections.length === 0 && !isGenerating && (
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

      <style>{`
        .section-shimmer {
          position: relative;
          overflow: hidden;
        }
        
        .section-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .section-placeholder {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// Export the component and types
export type { ProgressiveValuationReportProps, ReportSection };

