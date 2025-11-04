import React from 'react';
import { ValuationResponse } from '../../types/valuation';
import { formatCurrency } from './utils/formatters';

interface DCFExclusionNoticeProps {
  result: ValuationResponse;
}

export const DCFExclusionNotice: React.FC<DCFExclusionNoticeProps> = ({ result }) => {
  const revenue = result.current_year_data?.revenue || 0;
  const methodologySelection = result.methodology_selection;
  
  // Only show if DCF was excluded
  if (!methodologySelection || methodologySelection.dcf_included) {
    return null;
  }

  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 shadow-sm mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-2 text-lg">
            📊 Methodology Selection: Market Multiples Only
          </h4>
          
          <p className="text-amber-800 mb-3">
            <strong>DCF (Discounted Cash Flow) was not used</strong> for your company because:
          </p>
          
          <ul className="text-sm text-amber-700 space-y-2 mb-4 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Revenue of {formatCurrency(revenue)} is below €1M threshold</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Small companies typically have volatile cash flows that are difficult to project accurately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>Market multiples from comparable sales are more reliable for small businesses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600">•</span>
              <span>This approach aligns with Big 4 (Deloitte, PwC, EY, KPMG) and NACVA valuation standards</span>
            </li>
          </ul>

          <div className="bg-amber-100 rounded p-3 border border-amber-300">
            <p className="text-sm text-amber-900">
              <strong>What This Means:</strong> Your valuation is based on what similar companies actually sold for in the market, 
              which is the most objective and reliable approach for small businesses.
            </p>
          </div>

          <p className="text-xs text-amber-600 mt-3 italic">
            <strong>Academic Support:</strong> Damodaran (NYU Stern), Duff & Phelps 2024 Valuation Handbook, NACVA Standards
          </p>
        </div>
      </div>
    </div>
  );
};

