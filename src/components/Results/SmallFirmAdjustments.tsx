import React from 'react';
import { ValuationResponse } from '../../types/valuation';
import { formatCurrency } from './utils/formatters';

interface SmallFirmAdjustmentsProps {
  result: ValuationResponse;
}

export const SmallFirmAdjustments: React.FC<SmallFirmAdjustmentsProps> = ({ result }) => {
  const adjustments = result.small_firm_adjustments;
  
  // Only show if adjustments data exists
  if (!adjustments) {
    return null;
  }

  const formatAdjustment = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Small Business Valuation Adjustments
      </h3>
      
      <p className="text-gray-700 mb-4">
        Your company's base valuation has been adjusted to reflect market realities. Multiples from databases (Bloomberg, Capital IQ, PitchBook) become correct at around €5M revenue (McKinsey standard). Companies below this threshold require size-based corrections:
      </p>

      {/* Adjustments Breakdown */}
      <div className="space-y-4 mb-6">
        {/* Size Discount */}
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-gray-900">1. Size Discount</h4>
            <span className="text-lg font-bold text-blue-600">
              {formatAdjustment(adjustments.size_discount)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{adjustments.size_discount_reason}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong>Market Data:</strong> Based on 2,500+ European SME transactions (Duff & Phelps 2024). Multiples become correct at €5M revenue (McKinsey standard).
          </p>
        </div>

        {/* Liquidity Discount */}
        <div className="border-l-4 border-purple-500 pl-4 py-2">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-gray-900">2. Liquidity Discount</h4>
            <span className="text-lg font-bold text-purple-600">
              {formatAdjustment(adjustments.liquidity_discount)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{adjustments.liquidity_discount_reason}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong>Market Data:</strong> Private companies lack public market liquidity (Damodaran research)
          </p>
        </div>

        {/* Country Adjustment */}
        {Math.abs(adjustments.country_adjustment) > 0.001 && (
          <div className={`border-l-4 ${adjustments.country_adjustment > 0 ? 'border-green-500' : 'border-orange-500'} pl-4 py-2`}>
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="font-semibold text-gray-900">3. Country Risk</h4>
              <span className={`text-lg font-bold ${adjustments.country_adjustment > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {formatAdjustment(adjustments.country_adjustment)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{adjustments.country_adjustment_reason}</p>
          </div>
        )}

        {/* Growth Premium */}
        {adjustments.growth_premium > 0.001 && (
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="font-semibold text-gray-900">4. Growth Premium ✓</h4>
              <span className="text-lg font-bold text-green-600">
                {formatAdjustment(adjustments.growth_premium)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{adjustments.growth_premium_reason}</p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Market Data:</strong> High-growth SMEs command premiums (Capital IQ data)
            </p>
          </div>
        )}
      </div>

      {/* Combined Effect */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex justify-between items-baseline mb-3">
          <h4 className="font-semibold text-gray-900">Combined Effect:</h4>
          <span className="text-xl font-bold text-gray-900">
            {formatAdjustment(adjustments.combined_effect)} net adjustment
          </span>
        </div>

        <div className="bg-gray-50 rounded p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base valuation (before adjustments):</span>
            <span className="font-semibold">{formatCurrency(adjustments.base_value_before_adjustments)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Net adjustment:</span>
            <span className="font-semibold">{formatAdjustment(adjustments.combined_effect)}</span>
          </div>
          <div className="flex justify-between text-lg border-t border-gray-300 pt-2">
            <span className="text-gray-900 font-semibold">Your valuation:</span>
            <span className="font-bold text-primary-600">{formatCurrency(adjustments.adjusted_value_after_adjustments)}</span>
          </div>
        </div>
      </div>

      {/* How to Increase Valuation */}
      <div className="mt-6 bg-blue-50 rounded border border-blue-200 p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How to Increase Your Valuation</h4>
        <p className="text-sm text-blue-800 mb-3">Based on these adjustments, you could increase your value by:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          {adjustments.size_discount < -0.15 && (
            <li>• <strong>Growing revenue to next tier</strong> → Reduce size discount → Potential +10-15% value</li>
          )}
          {adjustments.liquidity_discount < -0.18 && (
            <li>• <strong>Increasing recurring revenue to 80%+</strong> → Improve liquidity discount → Potential +5-8% value</li>
          )}
          {adjustments.growth_premium === 0 && (
            <li>• <strong>Accelerating growth to 20%+</strong> → Earn growth premium → Potential +5-15% value</li>
          )}
        </ul>
      </div>
    </div>
  );
};

