/**
 * Data Quality & Confidence Component
 * 
 * Displays:
 * - 5-dimension data quality scores
 * - 8-factor confidence breakdown
 * - Quality warnings and recommendations
 * - Data quality checkpoints
 * 
 * Phase 2: Main Report Enhancement
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { getStepData, getStepResultData } from '../../utils/valuationDataExtractor';
import { getMethodologyStatement, getAcademicSources, getProfessionalReviewReady } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface DataQualityConfidenceProps {
  result: ValuationResponse;
  className?: string;
}

export const DataQualityConfidence: React.FC<DataQualityConfidenceProps> = ({
  result,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const step0Data = getStepData(result, 0);
  const step0Result = getStepResultData(result, 0);
  const step9Data = getStepData(result, 9);
  const step9Result = getStepResultData(result, 9);

  // Extract data quality scores
  const qualityScore = step0Result?.quality_score || result.transparency?.confidence_breakdown?.data_quality || 0;
  const dimensionScores = step0Result?.dimension_scores || {};
  const qualityWarnings = step0Result?.warnings || [];

  // Extract confidence breakdown
  const confidenceBreakdown = result.transparency?.confidence_breakdown;
  const confidenceScore = result.confidence_score || 0;
  const confidenceLevel = result.overall_confidence || 
    (confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW');

  // Professional review readiness
  const reviewReady = getProfessionalReviewReady(result);

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

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
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getQualityColor(qualityScore)}`}>
              Quality: {Math.round(qualityScore)}%
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(confidenceScore)}`}>
              Confidence: {confidenceScore}% ({confidenceLevel})
            </span>
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
          {/* Data Quality Dimensions */}
          <div>
            <button
              onClick={() => toggleSection('quality')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-900">5-Dimension Data Quality Assessment</span>
              {expandedSection === 'quality' ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'quality' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                {Object.entries(dimensionScores).map(([dimension, score]: [string, any]) => (
                  <div key={dimension} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{dimension.replace(/_/g, ' ')}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{Math.round(score)}%</span>
                    </div>
                  </div>
                ))}
                {Object.keys(dimensionScores).length === 0 && (
                  <div className="text-sm text-gray-500 italic">Dimension scores not available</div>
                )}
              </div>
            )}
          </div>

          {/* Quality Warnings */}
          {qualityWarnings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-gray-900">Quality Warnings</span>
              </div>
              <div className="space-y-2">
                {qualityWarnings.map((warning: any, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      warning.severity === 'critical' || warning.severity === 'high'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : warning.severity === 'medium'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    <div className="font-semibold capitalize mb-1">{warning.severity} Warning</div>
                    <div>{warning.message || warning}</div>
                    {warning.recommended_action && (
                      <div className="mt-1 italic">Recommendation: {warning.recommended_action}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8-Factor Confidence Breakdown */}
          {confidenceBreakdown && (
            <div>
              <button
                onClick={() => toggleSection('confidence')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-gray-900">8-Factor Confidence Breakdown</span>
                {expandedSection === 'confidence' ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expandedSection === 'confidence' && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                  {[
                    { key: 'data_quality', label: 'Data Quality', weight: 20 },
                    { key: 'historical_data', label: 'Historical Data', weight: 15 },
                    { key: 'methodology_agreement', label: 'Methodology Agreement', weight: 10 },
                    { key: 'industry_benchmarks', label: 'Industry Benchmarks', weight: 15 },
                    { key: 'company_profile', label: 'Company Profile', weight: 15 },
                    { key: 'market_conditions', label: 'Market Conditions', weight: 10 },
                    { key: 'geographic_data', label: 'Geographic Data', weight: 7.5 },
                    { key: 'business_model_clarity', label: 'Business Model Clarity', weight: 7.5 }
                  ].map(({ key, label, weight }) => {
                    const score = (confidenceBreakdown as any)[key] || 0;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{label}</span>
                          <span className="text-xs text-gray-400">({weight}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{Math.round(score)}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Overall Confidence Score</span>
                      <span className={`text-lg font-bold ${getConfidenceColor(confidenceScore).split(' ')[0]}`}>
                        {confidenceScore}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Weighted average of all 8 factors (Big 4 8-factor model)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Professional Review Readiness */}
          {reviewReady && (
            <div>
              <div className={`p-3 rounded-lg border-2 ${
                reviewReady.ready
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {reviewReady.ready ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-semibold text-gray-900">
                    Professional Review Readiness: {reviewReady.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {reviewReady.checks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Checks Passed:</div>
                    {reviewReady.checks.map((check, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {check}
                      </div>
                    ))}
                  </div>
                )}
                {reviewReady.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-semibold text-yellow-700 mb-1">Warnings:</div>
                    {reviewReady.warnings.map((warning, index) => (
                      <div key={index} className="text-xs text-yellow-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
                {reviewReady.notes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    {reviewReady.notes.map((note, index) => (
                      <div key={index} className="text-xs text-gray-600">{note}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Sources Note */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Data quality assessment based on McKinsey/Bain 5-dimension framework. 
              Confidence scoring uses Big 4 8-factor model (Damodaran 2012, PwC Valuation Standards).
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

