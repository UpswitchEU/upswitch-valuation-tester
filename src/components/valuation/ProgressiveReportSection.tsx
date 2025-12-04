import React from 'react';
import { SectionError } from './SectionError';
import { HTMLProcessor } from '../../utils/htmlProcessor';
import { Loader2 } from 'lucide-react';

export interface Section {
  id: string;
  name: string;
  phase: number;
  status: 'loading' | 'calculating' | 'complete' | 'error';
  html: string;
  progress: number;
  error?: string;
  timestamp?: Date;
}

interface ProgressiveReportSectionProps {
  section: Section;
  onRetry?: (sectionId: string) => void;
}

/**
 * ProgressiveReportSection Component
 * 
 * Renders an individual section of the progressive valuation report.
 * Handles loading states, completed content, and error states.
 * 
 * Features:
 * - Loading skeleton with pulse animation
 * - Fade-in animation on completion
 * - Error state with retry functionality
 * - Safe HTML rendering with dangerouslySetInnerHTML
 * 
 * @param section - Section data including status and HTML content
 * @param onRetry - Optional retry callback for failed sections
 */
export const ProgressiveReportSection: React.FC<ProgressiveReportSectionProps> = ({
  section,
  onRetry
}) => {
  // Loading state
  if (section.status === 'loading' || section.status === 'calculating') {
    return (
      <div className="animate-pulse bg-gray-50 rounded-lg p-6 mb-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <div>
            <h3 className="text-sm font-medium text-gray-700">{section.name}</h3>
            <p className="text-xs text-gray-500">Calculating...</p>
          </div>
        </div>
        <div className="space-y-2 opacity-50">
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (section.status === 'error') {
    return (
      <SectionError
        sectionName={section.name}
        errorMessage={section.error || 'Unknown error occurred'}
        onRetry={onRetry ? () => onRetry(section.id) : undefined}
      />
    );
  }

  // Complete state with fade-in animation
  return (
    <div
      className="section-complete animate-fadeInUp mb-4"
      data-section-id={section.id}
      data-section-phase={section.phase}
    >
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(section.html) }}
      />
    </div>
  );
};

// Add CSS animation for fade-in effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeInUp {
      animation: fadeInUp 0.5s ease-out;
    }

    .section-complete {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}


