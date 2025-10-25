/**
 * ProgressiveValuationReport Component
 * Displays valuation report sections as they're generated progressively
 * Similar to Lovable.dev's real-time code generation
 */

import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ReportSection {
  id: string;
  phase: number;
  html: string;
  progress: number;
  timestamp: Date;
  status: 'loading' | 'completed' | 'error';
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
  sections: propSections = [],
  phase: propPhase = 0,
  finalHtml: propFinalHtml = '',
  isGenerating: propIsGenerating = false
}) => {
  const [sections] = useState<ReportSection[]>(propSections);
  const [currentPhase] = useState(propPhase);
  const [overallProgress] = useState(0);
  const [isGenerating] = useState(propIsGenerating);
  const [finalReport] = useState<string>(propFinalHtml);
  const [valuationId] = useState<string>('');

  // Placeholder handlers for future progressive report implementation
  // Commented out until backend supports progressive reporting
  // const handleSectionUpdate = useCallback((_sectionId: string, _html: string, _phase: number, _progress: number) => {
  //   console.log('Progressive report section update:', _sectionId, _phase, _progress);
  // }, []);

  // const handleReportComplete = useCallback((_html: string, _id: string) => {
  //   console.log('Progressive report complete:', _id);
  // }, []);

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

  // Get section display name
  const getSectionDisplayName = (sectionId: string): string => {
    const names: Record<string, string> = {
      'preview': 'Initial Estimate',
      'dcf_basic': 'DCF Analysis',
      'multiples': 'Market Multiples',
      'dcf_complete': 'Complete DCF',
      'adjustments': 'Valuation Adjustments',
      'owner_analysis': 'Owner Analysis'
    };
    return names[sectionId] || sectionId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get phase description
  const getPhaseDescription = (phase: number): string => {
    const descriptions: Record<number, string> = {
      1: 'Quick Preview - Industry multiples estimate',
      2: 'Intermediate Analysis - DCF and market multiples',
      3: 'Advanced Analysis - Complete financial modeling',
      4: 'Complete Valuation - Owner dependency analysis'
    };
    return descriptions[phase] || 'Unknown phase';
  };

  // Render loading placeholder for pending sections
  const renderLoadingPlaceholder = (sectionId: string) => (
    <div key={`placeholder-${sectionId}`} className="section-placeholder bg-gray-50 rounded-lg p-6 mb-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="text-center mt-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" />
          Generating {getSectionDisplayName(sectionId)}...
        </div>
      </div>
    </div>
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

  return (
    <div className={`progressive-report ${className}`}>
      {/* Progress indicator */}
      <div className="report-progress bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Valuation Report</h2>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-lg font-bold text-blue-600">{overallProgress}%</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Phase {currentPhase}/4</span>
          <span>{isGenerating ? 'Generating...' : 'Complete'}</span>
        </div>
        
        {currentPhase > 0 && (
          <div className="mt-3 text-sm text-gray-700">
            {getPhaseDescription(currentPhase)}
          </div>
        )}
      </div>

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
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </div>
          ))}
      </div>

      {/* Loading placeholders for pending phases */}
      {isGenerating && currentPhase < 4 && (
        <div className="pending-sections mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sections</h3>
          <div className="space-y-4">
            {getPendingSections(currentPhase + 1).map(section => 
              renderLoadingPlaceholder(section)
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
            <span className="ml-auto text-sm text-gray-500">
              ID: {valuationId}
            </span>
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
    </div>
  );
};

// Export the component and types
export type { ReportSection, ProgressiveValuationReportProps };
