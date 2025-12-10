import React from 'react';
import { Step5SizeDiscountResult, Step6LiquidityDiscountResult, ValuationResponse } from '../../types/valuation';
import { formatCurrency } from './utils/formatters';

interface SmallFirmAdjustmentsProps {
  result: ValuationResponse;
}

/**
 * Extract numeric discount value from union type (number | object)
 * CTO Audit: Type-safe extraction for union types
 */
function extractDiscountValue(
  value: number | Step5SizeDiscountResult | Step6LiquidityDiscountResult
): number {
  if (typeof value === 'number') {
    return value;
  }
  // Object format: extract the discount percentage
  if ('size_discount_percentage' in value) {
    return (value as Step5SizeDiscountResult).size_discount_percentage;
  }
  if ('total_discount_percentage' in value) {
    return (value as Step6LiquidityDiscountResult).total_discount_percentage;
  }
  return 0;
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
  
  // Extract numeric values from union types
  const sizeDiscount = extractDiscountValue(adjustments.size_discount);
  const liquidityDiscount = extractDiscountValue(adjustments.liquidity_discount);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-ink mb-4">
        Small Business Valuation Adjustments
      </h3>
      
      <p className="text-gray-700 mb-4">
        Your company's base valuation has been adjusted to reflect market realities. Multiples from databases (Bloomberg, Capital IQ, PitchBook) become correct at around €5M revenue (McKinsey standard). Companies below this threshold require size-based corrections:
      </p>

      {/* Adjustments Breakdown */}
      <div className="space-y-4 mb-6">
        {/* Size Discount */}
        <div className="border-l-4 border-primary-500 pl-4 py-2">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-slate-ink">1. Size Discount</h4>
            <span className="text-lg font-bold text-primary-600">
              {formatAdjustment(sizeDiscount)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{adjustments.size_discount_reason}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong>Market Data:</strong> Based on 2,500+ European SME transactions (Duff & Phelps 2024). Multiples become correct at €5M revenue (McKinsey standard).
          </p>
        </div>

        {/* Liquidity Discount */}
        <div className="border-l-4 border-primary-500 pl-4 py-2">
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold text-slate-ink">2. Liquidity Discount</h4>
            <span className="text-lg font-bold text-primary-600">
              {formatAdjustment(liquidityDiscount)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{adjustments.liquidity_discount_reason}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong>Market Data:</strong> Private companies lack public market liquidity (Damodaran research)
          </p>
        </div>

        {/* Country Adjustment */}
        {Math.abs(adjustments.country_adjustment) > 0.001 && (
          <div className={`border-l-4 ${adjustments.country_adjustment > 0 ? 'border-primary-500' : 'border-accent-500'} pl-4 py-2`}>
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="font-semibold text-slate-ink">3. Country Risk</h4>
              <span className={`text-lg font-bold ${adjustments.country_adjustment > 0 ? 'text-primary-600' : 'text-accent-600'}`}>
                {formatAdjustment(adjustments.country_adjustment)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{adjustments.country_adjustment_reason}</p>
          </div>
        )}

        {/* Growth Premium */}
        {adjustments.growth_premium > 0.001 && (
          <div className="border-l-4 border-primary-500 pl-4 py-2">
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="font-semibold text-slate-ink">4. Growth Premium ✓</h4>
              <span className="text-lg font-bold text-primary-600">
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
          <h4 className="font-semibold text-slate-ink">Combined Effect:</h4>
          <span className="text-xl font-bold text-slate-ink">
            {formatAdjustment(adjustments.combined_effect)} net adjustment
          </span>
        </div>

        {/* Step-by-Step Calculation */}
        <div className="bg-primary-50 rounded-lg p-4 mb-4 border border-primary-200">
          <h5 className="font-semibold text-slate-ink mb-3 text-sm">Step-by-Step Calculation</h5>
          <div className="bg-white rounded p-3 space-y-2 text-xs font-mono border border-primary-300">
            <div className="flex justify-between">
              <span className="text-gray-700">Base Value (before adjustments):</span>
              <span className="font-semibold">{formatCurrency(adjustments.base_value_before_adjustments)}</span>
            </div>
            <div className="flex justify-between text-gray-600 pt-1">
              <span>Size Discount:</span>
              <span>{formatAdjustment(sizeDiscount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Liquidity Discount:</span>
              <span>{formatAdjustment(liquidityDiscount)}</span>
            </div>
            {Math.abs(adjustments.country_adjustment) > 0.001 && (
              <div className="flex justify-between text-gray-600">
                <span>Country Adjustment:</span>
                <span>{formatAdjustment(adjustments.country_adjustment)}</span>
              </div>
            )}
            {adjustments.growth_premium > 0.001 && (
              <div className="flex justify-between text-gray-600">
                <span>Growth Premium:</span>
                <span className="text-primary-600">{formatAdjustment(adjustments.growth_premium)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-300 text-gray-700">
              <span>Total Adjustment:</span>
              <span className="font-semibold">{formatAdjustment(adjustments.combined_effect)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t-2 border-blue-400 font-semibold text-sm">
              <span className="text-gray-900">Calculation:</span>
              <span className="text-blue-700">
                {formatCurrency(adjustments.base_value_before_adjustments)} × {(1.0 + adjustments.combined_effect).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-primary-500 font-semibold text-base">
              <span className="text-slate-ink">= Final Adjusted Value:</span>
              <span className="text-primary-600">{formatCurrency(adjustments.adjusted_value_after_adjustments)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            <strong>Formula:</strong> Adjusted Value = Base Value × (1.0 + Size Discount + Liquidity Discount + Country Adjustment + Growth Premium)
            <br />
            Where discounts are negative values (e.g., -30% = -0.30) and premiums are positive values
            <br />
            <span className="text-gray-500">Example: Base €1,000,000 × (1.0 + (-0.30) + (-0.15) + 0.00 + 0.00) = €1,000,000 × 0.55 = €550,000</span>
          </p>
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
            <span className="text-slate-ink font-semibold">Your valuation:</span>
            <span className="font-bold text-primary-600">{formatCurrency(adjustments.adjusted_value_after_adjustments)}</span>
          </div>
        </div>
      </div>

      {/* How to Increase Valuation */}
      <div className="mt-6 bg-primary-50 rounded border border-primary-200 p-4">
        <h4 className="font-semibold text-primary-900 mb-2">💡 How to Increase Your Valuation</h4>
        <p className="text-sm text-primary-800 mb-3">Based on these adjustments, you could increase your value by:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          {sizeDiscount < -0.15 && (
            <li>• <strong>Growing revenue to next tier</strong> → Reduce size discount → Potential +10-15% value</li>
          )}
          {liquidityDiscount < -0.18 && (
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

