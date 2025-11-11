/**
 * Professional Review Readiness Component
 * 
 * Displays professional review readiness assessment from backend.
 * Shows readiness status, checks passed, warnings, and recommendations.
 * 
 * Phase 6: Professional Review Readiness
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Award, FileCheck } from 'lucide-react';
import { getProfessionalReviewReady } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface ProfessionalReviewReadinessProps {
  result: ValuationResponse;
  className?: string;
  showBadge?: boolean;
}

export const ProfessionalReviewReadiness: React.FC<ProfessionalReviewReadinessProps> = ({
  result,
  className = '',
  showBadge = true
}) => {
  const reviewReady = getProfessionalReviewReady(result);

  if (!reviewReady) {
    return null;
  }

  const getStatusConfig = () => {
    switch (reviewReady.status) {
      case 'PROFESSIONAL_REVIEW_READY':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Ready for Professional Review',
          description: 'This valuation meets all professional standards and is ready for review by valuation experts, professors, or investors.'
        };
      case 'NOT_READY':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Not Ready for Professional Review',
          description: 'This valuation requires additional data or corrections before professional review.'
        };
      case 'REVIEW_RECOMMENDED':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Review Recommended',
          description: 'This valuation is generally complete but has some warnings that should be addressed before professional presentation.'
        };
      default:
        return {
          icon: FileCheck,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Review Status Unknown',
          description: 'Review readiness assessment not available.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (showBadge) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.color} ${className}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border-2 ${config.borderColor} shadow-sm ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
          </div>
        </div>

        {/* Checks Passed */}
        {reviewReady.checks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">Checks Passed ({reviewReady.checks.length})</span>
            </div>
            <div className="space-y-1 ml-6">
              {reviewReady.checks.map((check, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {reviewReady.warnings.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-gray-900">Warnings ({reviewReady.warnings.length})</span>
            </div>
            <div className="space-y-1 ml-6">
              {reviewReady.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {reviewReady.notes.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Notes</span>
            </div>
            <div className="space-y-1 ml-6">
              {reviewReady.notes.map((note, index) => (
                <div key={index} className="text-sm text-gray-600">{note}</div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Badges */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Compliance:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">IFRS 13</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">IVS 2017</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Big 4 Standards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

