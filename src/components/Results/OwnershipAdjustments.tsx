import React from 'react';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';
import { calculateOwnershipAdjustment } from './utils/calculations';
import type { ValuationResponse } from '../../types/valuation';

interface OwnershipAdjustmentsProps {
  result: ValuationResponse;
}

export const OwnershipAdjustments: React.FC<OwnershipAdjustmentsProps> = ({ result }) => {
  const ownership = calculateOwnershipAdjustment(result);
  
  if (ownership.ownershipPercentage === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership Adjustments</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span className="text-sm text-gray-600">Your Ownership</span>
          <span className="font-semibold text-gray-900">{ownership.ownershipPercentage}%</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-primary-50 rounded border border-primary-200">
          <span className="text-sm text-primary-700 font-medium">Your Share Value</span>
          <div className="text-right">
            <div className="text-lg font-bold text-primary-600">
              {formatCurrencyCompact(ownership.ownershipValue)}
            </div>
            <div className="text-xs text-primary-500">
              {formatCurrency(ownership.ownershipValue)}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Note:</strong> This represents your portion of the total enterprise value based on your ownership percentage.
        </div>
      </div>
    </div>
  );
};
