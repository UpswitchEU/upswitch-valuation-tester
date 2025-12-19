/**
 * Normalization Preview Component
 * 
 * Displays live preview of normalization calculation in modal
 * Shows reported EBITDA → total adjustments → normalized EBITDA
 */

import React from 'react';
import { ConfidenceScore } from '../../types/ebitdaNormalization';

interface NormalizationPreviewProps {
  reportedEbitda: number;
  totalAdjustments: number;
  normalizedEbitda: number;
  confidenceScore: ConfidenceScore;
  year: number;
}

export const NormalizationPreview: React.FC<NormalizationPreviewProps> = ({
  reportedEbitda,
  totalAdjustments,
  normalizedEbitda,
  confidenceScore,
  year,
}) => {
  const adjustmentPercentage = reportedEbitda !== 0
    ? ((totalAdjustments / reportedEbitda) * 100).toFixed(1)
    : '0.0';
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getConfidenceColor = (score: ConfidenceScore) => {
    switch (score) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };
  
  return (
    <div className="sticky top-0 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        <p className="text-sm text-gray-600 mt-1">
          Normalization for {year}
        </p>
      </div>
      
      {/* Reported EBITDA */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Reported EBITDA</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(reportedEbitda)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          As shown in financial statements
        </div>
      </div>
      
      {/* Total Adjustments */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Total Adjustments</div>
        <div className={`text-2xl font-bold ${
          totalAdjustments > 0 ? 'text-green-600' : totalAdjustments < 0 ? 'text-red-600' : 'text-gray-900'
        }`}>
          {totalAdjustments > 0 ? '+' : ''}{formatCurrency(totalAdjustments)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {totalAdjustments > 0 ? `+${adjustmentPercentage}%` : `${adjustmentPercentage}%`} of reported EBITDA
        </div>
      </div>
      
      {/* Normalized EBITDA */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-600 mb-1">Normalized EBITDA</div>
        <div className="text-3xl font-bold text-blue-600">
          {formatCurrency(normalizedEbitda)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          True earning power
        </div>
      </div>
      
      {/* Confidence Score */}
      <div>
        <div className="text-sm text-gray-600 mb-2">Confidence Level</div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(confidenceScore)}`}>
          <span className="capitalize">{confidenceScore}</span>
        </div>
      </div>
      
      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-800">
              Positive adjustments increase EBITDA. Negative adjustments decrease it. All changes are reflected in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
