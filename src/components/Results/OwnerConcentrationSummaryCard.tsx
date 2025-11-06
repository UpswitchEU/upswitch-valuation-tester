import React from 'react';
import type { ValuationResponse } from '../../types/valuation';

interface OwnerConcentrationSummaryCardProps {
  result: ValuationResponse;
}

export const OwnerConcentrationSummaryCard: React.FC<OwnerConcentrationSummaryCardProps> = ({ result }) => {
  const ownerConcentration = result.multiples_valuation?.owner_concentration;
  
  if (!ownerConcentration) {
    return null;
  }
  
  const ratio = ownerConcentration.ratio;
  const adjustmentFactor = ownerConcentration.adjustment_factor;
  const riskLevel = ownerConcentration.risk_level || 'UNKNOWN';
  const isFullyOwnerOperated = ownerConcentration.number_of_employees === 0;
  const isCritical = riskLevel === 'CRITICAL';
  
  // Determine color scheme based on risk level
  const colorClasses = {
    CRITICAL: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      subtext: 'text-red-700',
      icon: 'text-red-600'
    },
    HIGH: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      subtext: 'text-orange-700',
      icon: 'text-orange-600'
    },
    MEDIUM: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      subtext: 'text-yellow-700',
      icon: 'text-yellow-600'
    },
    LOW: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-900',
      subtext: 'text-green-700',
      icon: 'text-green-600'
    },
    UNKNOWN: {
      bg: 'bg-gray-50',
      border: 'border-gray-500',
      text: 'text-gray-900',
      subtext: 'text-gray-700',
      icon: 'text-gray-600'
    }
  };
  
  const colors = colorClasses[riskLevel as keyof typeof colorClasses] || colorClasses.UNKNOWN;
  
  return (
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 sm:p-6 shadow-sm`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-bold ${colors.text}`}>
              Owner Concentration Risk
            </h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded ${colors.bg} border ${colors.border}`}>
              {riskLevel}
            </span>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className={`text-xs ${colors.subtext}`}>Owner/FTE Ratio</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {(ratio * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className={`text-xs ${colors.subtext}`}>Valuation Impact</p>
              <p className={`text-2xl font-bold ${colors.text}`}>
                {(adjustmentFactor * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          
          {/* Description */}
          <div className={`text-sm ${colors.subtext} space-y-1`}>
            {isFullyOwnerOperated ? (
              <>
                <p className="font-semibold">
                  ⚠️ 100% Owner-Operated Business
                </p>
                <p>
                  This business has <strong>zero non-owner employees</strong>, meaning all operational capacity 
                  resides with {ownerConcentration.number_of_owners} owner{ownerConcentration.number_of_owners > 1 ? 's' : ''}. 
                  This represents maximum key person risk and reduces valuation by <strong>{Math.abs(adjustmentFactor * 100).toFixed(0)}%</strong>.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  {ownerConcentration.number_of_owners} owner{ownerConcentration.number_of_owners > 1 ? 's' : ''} / {ownerConcentration.number_of_employees} employee{ownerConcentration.number_of_employees > 1 ? 's' : ''}
                </p>
                <p>
                  {ratio >= 0.5 ? 'High' : ratio >= 0.25 ? 'Moderate' : 'Low'} owner dependency reduces valuation by <strong>{Math.abs(adjustmentFactor * 100).toFixed(0)}%</strong> due to key person risk.
                </p>
              </>
            )}
          </div>
          
          {/* CTA to view details */}
          <div className="mt-3 pt-3 border-t border-current opacity-50">
            <p className={`text-xs ${colors.subtext} font-medium flex items-center gap-1`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View detailed analysis and improvement recommendations in the Info tab
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

