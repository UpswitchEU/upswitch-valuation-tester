/**
 * ProgressiveValuationReport Component
 * Displays valuation report sections as they're generated progressively
 * Similar to Lovable.dev's real-time code generation
 */

import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
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


  // Get pending sections for current phase
  const getPendingSections = (phase: number): string[] => {
    const phaseSections = {
      1: ['preview'],
      2: ['dcf_basic', 'multiples'],
      3: ['dcf_complete', 'adjustments'],
      4: ['owner_analysis']
    };
    
    const completedSections = sections.map(s => s.id);
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

  // Render section status icon
  const renderSectionStatus = (section: ReportSection) => {
    switch (section.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

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

  // Render section header with confidence indicators
  const renderSectionHeader = (section: ReportSection) => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getSectionDisplayName(section.id)}
        </h3>
        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          {section.is_fallback ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Quick Estimate
            </span>
          ) : section.is_error ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Full Analysis
            </span>
          )}
          
          {/* Phase Badge */}
          <span className="text-sm text-gray-500">
            Phase {section.phase}
          </span>
        </div>
      </div>
    );
  };

  // Add confidence meter
  const renderConfidenceMeter = (section: ReportSection) => {
    const confidence = section.is_fallback ? 30 : section.is_error ? 0 : 85;
    const color = confidence > 70 ? 'bg-green-500' : confidence > 40 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Confidence Level</span>
          <span className="text-sm font-bold text-gray-900">{confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`${color} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    );
  };

  // Get section display name
  const getSectionDisplayName = (sectionId: string) => {
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
    return (
      <div className="section-container mb-6">
        {renderSectionHeader(section)}
        
        {section.is_fallback ? (
          renderFallbackSection(section)
        ) : section.is_error ? (
          renderErrorSection(section)
        ) : (
          <div className="section-content" dangerouslySetInnerHTML={{ __html: section.html }} />
        )}
        
        {renderConfidenceMeter(section)}
      </div>
    );
  };

  return (
    <div className={`progressive-report ${className}`}>
      {/* Render sections in order */}
      <div className="report-sections space-y-6">
        {sections
          .sort((a, b) => a.phase - b.phase || a.timestamp.getTime() - b.timestamp.getTime())
          .map(section => (
            <div key={section.id} className="report-section fade-in">
              <div className="flex items-center mb-3">
                {renderSectionStatus(section)}
                <h3 className="ml-2 text-lg font-semibold text-gray-900">
                  {getSectionDisplayName(section.id)}
                </h3>
                <span className="ml-auto text-sm text-gray-500">
                  Phase {section.phase}
                </span>
              </div>
              {renderSection(section)}
            </div>
          ))}
      </div>

      {/* Loading placeholders for pending phases */}
      {isGenerating && currentPhase < 4 && (
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
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Complete Valuation Report</h2>
          </div>
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

