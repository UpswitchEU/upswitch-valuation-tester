import React from 'react';
import type { ValuationResponse } from '../../types/valuation';

interface RiskFactorsProps {
  result: ValuationResponse;
}

export const RiskFactors: React.FC<RiskFactorsProps> = ({ result }) => {
  // Use only backend-provided risk_factors
  // No frontend calculations - pure display component
  const backendRisks = result.risk_factors || [];

  if (backendRisks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="text-center py-6">
          <div className="text-green-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-green-600 font-medium">No significant risk factors identified</p>
          <p className="text-gray-500 text-sm mt-1">Risk assessment is performed by our valuation engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>

      <div className="space-y-3">
        {backendRisks.map((risk, index) => (
          <div key={index} className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Risk Factor
                </span>
              </div>
              <p className="text-sm text-gray-700 flex-1">{risk}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
        <strong>Recommendation:</strong> Address these risk factors to improve your company's valuation
        and reduce investor concerns.
      </div>
    </div>
  );
};
