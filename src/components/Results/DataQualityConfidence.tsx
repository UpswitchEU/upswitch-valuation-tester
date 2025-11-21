/**
 * Data Quality & Confidence Component
 * 
 * Displays summary of data quality and confidence scores.
 * 
 * NOTE: Detailed data quality breakdowns are now available in the Info Tab HTML (info_tab_html).
 * This component shows summary fields only.
 * 
 * Phase 2: Main Report Enhancement (Simplified)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { getProfessionalReviewReady } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface DataQualityConfidenceProps {
  result: ValuationResponse;
  className?: string;
  onViewDetails?: () => void; // Callback to navigate to info tab
}

export const DataQualityConfidence: React.FC<DataQualityConfidenceProps> = ({
  result,
  className = '',
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract confidence breakdown from summary fields
  const confidenceBreakdown = result.transparency?.confidence_breakdown;
  const confidenceScore = result.confidence_score || 0;
  const confidenceLevel = result.overall_confidence || 
    (confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW');

  // Professional review readiness
  const reviewReady = getProfessionalReviewReady(result);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const hasInfoTabHtml = !!(result.info_tab_html && result.info_tab_html.length > 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Data Quality & Confidence</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidenceScore)}`}>
              Confidence: {confidenceScore}% ({confidenceLevel})
            </span>
            {reviewReady && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Review Ready
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Info Message */}
          {hasInfoTabHtml && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 mb-2">
                    Detailed data quality scores, 8-factor confidence breakdown, and quality checkpoints are available in the Info Tab.
                  </p>
                  {onViewDetails && (
                    <button
                      onClick={onViewDetails}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Detailed Analysis in Info Tab
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confidence Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Overall Confidence</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getConfidenceColor(confidenceScore).split(' ')[0]}`}>
                  {confidenceScore}%
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{confidenceLevel}</div>
              </div>
            </div>

            {/* Confidence Breakdown (if available) */}
            {confidenceBreakdown && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Confidence Factors</h4>
                {confidenceBreakdown.data_quality !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data Quality:</span>
                    <span className="font-semibold">{confidenceBreakdown.data_quality}%</span>
                  </div>
                )}
                {confidenceBreakdown.methodology_quality !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Methodology Quality:</span>
                    <span className="font-semibold">{confidenceBreakdown.methodology_quality}%</span>
                  </div>
                )}
                {confidenceBreakdown.market_data_quality !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Market Data Quality:</span>
                    <span className="font-semibold">{confidenceBreakdown.market_data_quality}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Professional Review Status */}
            {reviewReady && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900 text-sm">Professional Review Ready</div>
                    <div className="text-xs text-green-700 mt-0.5">
                      This valuation meets professional review standards
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
