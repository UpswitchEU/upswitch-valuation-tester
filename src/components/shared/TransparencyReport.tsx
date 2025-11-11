/**
 * Transparency Report Component
 * 
 * Displays the full transparency report from backend.
 * Includes calculation steps, data sources, adjustments, and compliance information.
 * 
 * Phase 6: Professional Review Readiness
 */

import { Calculator, CheckCircle, ChevronDown, ChevronRight, Database, FileText } from 'lucide-react';
import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { getAllStepData } from '../../utils/valuationDataExtractor';
import { AcademicSources } from './AcademicSources';
import { MethodologyStatement } from './MethodologyStatement';
import { ProfessionalReviewReadiness } from './ProfessionalReviewReadiness';
import { StepStatusBadge } from './StepStatusIndicator';

interface TransparencyReportProps {
  result: ValuationResponse;
  className?: string;
}

export const TransparencyReport: React.FC<TransparencyReportProps> = ({
  result,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const transparency = result.transparency;
  const stepData = getAllStepData(result);

  if (!transparency) {
    return null;
  }

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
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Transparency Report</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Full Report
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
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Methodology Statement */}
          {transparency.methodology_statement && (
            <MethodologyStatement result={result} compact={false} />
          )}

          {/* Calculation Steps Summary */}
          <div>
            <button
              onClick={() => toggleSection('steps')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-900">Calculation Steps Summary</span>
              {expandedSection === 'steps' ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {expandedSection === 'steps' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                {stepData.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Step {step.step}: {step.name}
                      </span>
                      <StepStatusBadge status={step.status} size="sm" />
                    </div>
                    <span className="text-xs text-gray-500">{step.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          {transparency.data_sources && transparency.data_sources.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('sources')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Data Sources</span>
                </div>
                {expandedSection === 'sources' ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expandedSection === 'sources' && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                  {transparency.data_sources.map((source, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{source.name}</span>
                        <span className="text-xs text-gray-500">{source.source}</span>
                      </div>
                      {source.type && (
                        <div className="text-xs text-gray-500">Type: {source.type}</div>
                      )}
                      {source.confidence && (
                        <div className="text-xs text-gray-500">
                          Confidence: {Math.round(source.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Adjustments Applied */}
          {transparency.adjustments_applied && transparency.adjustments_applied.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('adjustments')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">Adjustments Applied</span>
                </div>
                {expandedSection === 'adjustments' ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {expandedSection === 'adjustments' && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                  {transparency.adjustments_applied.map((adj, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{adj.step}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {adj.adjustment_pct >= 0 ? '+' : ''}{adj.adjustment_pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{adj.rationale}</div>
                      {adj.tier && (
                        <div className="text-xs text-gray-500 mt-1">Tier: {adj.tier}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Standards Compliance */}
          {transparency.standards_compliance && transparency.standards_compliance.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900">Standards Compliance</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {transparency.standards_compliance.map((standard, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Academic Sources */}
          <AcademicSources result={result} compact={false} />

          {/* Professional Review Readiness */}
          <ProfessionalReviewReadiness result={result} showBadge={false} />
        </div>
      )}
    </div>
  );
};

