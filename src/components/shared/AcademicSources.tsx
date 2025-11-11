/**
 * Academic Sources Component
 * 
 * Displays academic sources and references for methodologies used.
 * Sources are dynamically extracted from backend based on methodologies actually used.
 * 
 * Phase 5: Academic Sources & Methodology Documentation
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Book } from 'lucide-react';
import { getAcademicSources } from '../../utils/valuationDataExtractor';
import type { ValuationResponse, AcademicSource } from '../../types/valuation';

interface AcademicSourcesProps {
  result: ValuationResponse;
  className?: string;
  compact?: boolean;
}

export const AcademicSources: React.FC<AcademicSourcesProps> = ({
  result,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const sources = getAcademicSources(result);

  if (sources.length === 0) {
    return null;
  }

  const formatSource = (source: AcademicSource): string => {
    let formatted = `${source.author} (${source.year})`;
    if (source.title) {
      formatted += `. ${source.title}`;
    }
    if (source.edition) {
      formatted += `, ${source.edition} edition`;
    }
    if (source.publisher) {
      formatted += `. ${source.publisher}`;
    }
    if (source.journal) {
      formatted += `. ${source.journal}`;
      if (source.volume) {
        formatted += `, Vol. ${source.volume}`;
      }
      if (source.pages) {
        formatted += `, pp. ${source.pages}`;
      }
    }
    return formatted;
  };

  if (compact) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Book className="w-4 h-4" />
          <span>{sources.length} academic source{sources.length !== 1 ? 's' : ''} referenced</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Book className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Academic Sources & References</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            The following academic sources and professional standards inform the valuation methodologies used in this analysis:
          </p>
          
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Book className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {formatSource(source)}
                    </div>
                    {source.relevance && (
                      <div className="text-xs text-gray-600 mt-1">
                        <strong>Relevance:</strong> {source.relevance}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <strong>Standards Compliance:</strong> This valuation follows IFRS 13 (Fair Value Measurement) 
              and IVS 2017 (International Valuation Standards) guidelines.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact inline academic sources display
 */
export const AcademicSourcesInline: React.FC<{
  result: ValuationResponse;
  methodology?: string;
}> = ({ result, methodology }) => {
  const sources = getAcademicSources(result);
  
  // Filter sources by methodology if provided
  const relevantSources = methodology
    ? sources.filter((s) => s.relevance?.toLowerCase().includes(methodology.toLowerCase()))
    : sources;

  if (relevantSources.length === 0) {
    return null;
  }

  return (
    <div className="text-xs text-gray-500 mt-1">
      <span className="font-semibold">Sources:</span>{' '}
      {relevantSources.slice(0, 2).map((source, index) => (
        <span key={index}>
          {index > 0 && ', '}
          {source.author} ({source.year})
        </span>
      ))}
      {relevantSources.length > 2 && ` +${relevantSources.length - 2} more`}
    </div>
  );
};

