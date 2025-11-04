import React from 'react';
import type { ValuationResponse } from '../../types/valuation';

interface OwnerConcentrationAnalysisProps {
  result: ValuationResponse;
}

export const OwnerConcentrationAnalysis: React.FC<OwnerConcentrationAnalysisProps> = ({ result }) => {
  const ownerConcentration = result.multiples_valuation?.owner_concentration;
  
  if (!ownerConcentration) {
    return null;
  }

  const ratio = ownerConcentration.ratio;
  const adjustmentFactor = ownerConcentration.adjustment_factor;
  const numberOfOwners = ownerConcentration.number_of_owners;
  const numberOfEmployees = ownerConcentration.number_of_employees;
  const calibration = ownerConcentration.calibration;

  // Determine risk tier
  let riskLevel: string;
  let tierColor: string;
  let tierExplanation: string;
  
  if (ratio > 0.5) {
    riskLevel = 'CRITICAL';
    tierColor = 'bg-red-100 text-red-800 border-red-300';
    tierExplanation = 'Very high owner concentration (>50%) indicates critical key person risk and significant dependency on a few individuals. This severely impacts business transferability.';
  } else if (ratio > 0.25) {
    riskLevel = 'HIGH';
    tierColor = 'bg-orange-100 text-orange-800 border-orange-300';
    tierExplanation = 'High owner concentration (25-50%) suggests significant key person risk. The business heavily relies on the owners for operations, sales, or technical expertise.';
  } else if (ratio > 0.10) {
    riskLevel = 'MEDIUM';
    tierColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    tierExplanation = 'Moderate owner concentration (10-25%) indicates some key person risk. While delegation exists, owners play a crucial role in daily operations.';
  } else {
    riskLevel = 'LOW';
    tierColor = 'bg-green-100 text-green-800 border-green-300';
    tierExplanation = 'Low owner concentration (<10%) suggests minimal key person risk with a diversified management structure and operational processes.';
  }

  // Calculate unadjusted multiples if not provided
  const adjustedEbitda = result.multiples_valuation?.ebitda_multiple || 0;
  const adjustedRevenue = result.multiples_valuation?.revenue_multiple || 0;
  const unadjustedEbitda = result.multiples_valuation?.unadjusted_ebitda_multiple || 
                           (adjustedEbitda / (1 + adjustmentFactor));
  const unadjustedRevenue = result.multiples_valuation?.unadjusted_revenue_multiple || 
                            (adjustedRevenue / (1 + adjustmentFactor));

  const ratioPercentage = (ratio * 100).toFixed(0);
  const adjustmentPercentage = Math.abs(adjustmentFactor * 100).toFixed(0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Concentration Risk Assessment</h3>
      
      {/* Ratio Visualization */}
      <div className="flex items-center gap-4 sm:gap-6 mb-6">
        {/* Circular Gauge */}
        <div className="relative flex-shrink-0">
          <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {/* Foreground circle (ratio) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={
                ratio > 0.5 ? '#ef4444' :
                ratio > 0.25 ? '#f97316' :
                ratio > 0.10 ? '#eab308' :
                '#10b981'
              }
              strokeWidth="8"
              strokeDasharray={`${ratio * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{ratioPercentage}%</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">Owner/Employee Ratio</p>
          <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {numberOfOwners} {numberOfOwners === 1 ? 'owner' : 'owners'} / {numberOfEmployees} {numberOfEmployees === 1 ? 'employee' : 'employees'}
          </p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${tierColor}`}>
            {riskLevel} RISK
          </div>
        </div>
      </div>

      {/* Risk Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{tierExplanation}</p>
      </div>

      {/* Impact on Multiples */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">Impact on Valuation</h4>
        <p className="text-sm text-gray-700 mb-3">
          Multiples reduced by <strong className="text-yellow-900">{adjustmentPercentage}%</strong> due to {riskLevel.toLowerCase()} owner concentration
        </p>
        <div className="space-y-2 text-xs text-gray-700">
          <div className="flex items-center justify-between">
            <span>EBITDA Multiple:</span>
            <span className="font-mono">
              <span className="text-gray-500 line-through">{unadjustedEbitda.toFixed(1)}x</span>
              {' → '}
              <span className="font-semibold text-yellow-900">{adjustedEbitda.toFixed(1)}x</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Revenue Multiple:</span>
            <span className="font-mono">
              <span className="text-gray-500 line-through">{unadjustedRevenue.toFixed(2)}x</span>
              {' → '}
              <span className="font-semibold text-yellow-900">{adjustedRevenue.toFixed(2)}x</span>
            </span>
          </div>
        </div>
      </div>

      {/* Calibration Info (if available) */}
      {calibration && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-sm text-gray-900 mb-2">Industry-Specific Calibration</h4>
          <p className="text-xs text-gray-700 leading-relaxed">
            This valuation uses {calibration.business_type_id ? `<strong>${calibration.business_type_id}</strong>` : ''} industry standards
            {calibration.owner_dependency_impact && ` (owner dependency: ${(calibration.owner_dependency_impact * 100).toFixed(0)}%)`}.
            {' '}Tier thresholds and discount magnitudes have been calibrated based on business type characteristics.
          </p>
          {calibration.tier_used && (
            <div className="mt-2 pt-2 border-t border-blue-300">
              <span className="text-xs text-blue-700">
                Tier Used: <span className="font-semibold">{calibration.tier_used}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mitigation Recommendations */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">Risk Mitigation Recommendations</h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Develop formal succession plans and knowledge transfer processes</li>
          <li>Cross-train employees on critical business functions</li>
          <li>Document standard operating procedures (SOPs) comprehensively</li>
          <li>Delegate authority and empower middle management</li>
          <li>Build redundancy in key client and supplier relationships</li>
        </ul>
      </div>
    </div>
  );
};

