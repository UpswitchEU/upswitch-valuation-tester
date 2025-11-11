/**
 * Methodology Statement Component
 * 
 * Displays the comprehensive methodology statement from backend.
 * Includes methodology breakdown, adjustments applied, and assumptions.
 * 
 * Phase 5: Academic Sources & Methodology Documentation
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Info } from 'lucide-react';
import { getMethodologyStatement } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface MethodologyStatementProps {
  result: ValuationResponse;
  className?: string;
  compact?: boolean;
}

export const MethodologyStatement: React.FC<MethodologyStatementProps> = ({
  result,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const statement = getMethodologyStatement(result);

  if (!statement) {
    return null;
  }

  // Parse markdown-like formatting (basic support)
  const formatStatement = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Bold text (**text**)
      let formatted = line;
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Headers (## Header)
      if (line.startsWith('## ')) {
        return (
          <h4 key={index} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
            {line.replace('## ', '')}
          </h4>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return (
          <p
            key={index}
            className="text-sm text-gray-700 mb-2"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      }
      
      return <br key={index} />;
    });
  };

  if (compact) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <FileText className="w-4 h-4" />
          <span>Methodology statement available</span>
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
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Methodology Statement</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="prose prose-sm max-w-none">
            {formatStatement(statement)}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                This methodology statement provides a comprehensive overview of the valuation approach, 
                methodologies used, adjustments applied, and key assumptions. It is suitable for 
                professional review and academic presentation.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

