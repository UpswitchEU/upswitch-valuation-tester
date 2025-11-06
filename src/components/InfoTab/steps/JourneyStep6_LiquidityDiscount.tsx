import React from 'react';
import { Droplets } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { FormulaBox } from '../shared/FormulaBox';
import { BeforeAfterTable } from '../shared/BeforeAfterTable';
import type { ValuationResponse } from '../../../types/valuation';
import { normalizeMarginFormat } from '../../Results/utils/valuationCalculations';

interface JourneyStep6Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep6_LiquidityDiscount: React.FC<JourneyStep6Props> = ({ result, beforeValues }) => {
  const liquidityDiscount = result.multiples_valuation?.liquidity_discount || 0;
  // Normalize margin format (handles both decimal 0-1 and percentage 0-100 from backend)
  const ebitdaMarginRaw = result.financial_metrics?.ebitda_margin;
  const ebitdaMargin = normalizeMarginFormat(ebitdaMarginRaw) || 0;
  
  const afterValues = {
    low: beforeValues.low * (1 + liquidityDiscount),
    mid: beforeValues.mid * (1 + liquidityDiscount),
    high: beforeValues.high * (1 + liquidityDiscount)
  };

  // Calculate components
  const baseLiquidityDiscount = -0.15; // Typical base for private companies
  const marginBonus = liquidityDiscount - baseLiquidityDiscount;

  return (
    <StepCard
      id="step-6-liquidity"
      stepNumber={6}
      title="Liquidity Discount Application"
      subtitle={`Private Company Illiquidity - ${(liquidityDiscount * 100).toFixed(0)}% Adjustment`}
      icon={<Droplets className="w-5 h-5" />}
      color="orange"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Formula */}
        <FormulaBox
          formula="Value × (1 + Liquidity Discount)"
          description="Private companies are less liquid than public markets, requiring a discount"
        />

        {/* Discount Breakdown */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Liquidity Discount Components</h4>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Base Private Company Discount</span>
                <span className="text-lg font-bold text-red-600">{(baseLiquidityDiscount * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Standard discount for private company shares</p>
            </div>

            <div className="bg-green-50 border border-green-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">EBITDA Margin Bonus</span>
                <span className="text-lg font-bold text-green-600">+{(marginBonus * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Current margin: {(ebitdaMargin * 100).toFixed(1)}% - Higher profitability reduces illiquidity risk
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Liquidity Discount</span>
                <span className="text-2xl font-bold text-orange-600">{(liquidityDiscount * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 font-mono">
                {(baseLiquidityDiscount * 100).toFixed(0)}% + {(marginBonus * 100).toFixed(0)}% = {(liquidityDiscount * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>Formula: Previous Value × (1 + {(liquidityDiscount * 100).toFixed(0)}%)</div>
            <div>Example (Mid): {formatCurrency(beforeValues.mid)} × {(1 + liquidityDiscount).toFixed(3)} = {formatCurrency(afterValues.mid)}</div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <BeforeAfterTable
          before={beforeValues}
          after={afterValues}
          adjustmentLabel="Liquidity Discount"
          adjustmentPercent={liquidityDiscount}
        />

        {/* Explanation */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Why Liquidity Matters</h4>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>Private company shares cannot be easily sold like public stock</li>
            <li>Limited buyer pool and longer transaction times</li>
            <li>Higher profitability makes companies more attractive, reducing discount</li>
            <li>Typical range: -10% to -25% depending on company characteristics</li>
          </ul>
        </div>

        {/* Academic Source */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <p className="text-sm text-orange-900">
            <strong>Academic Sources:</strong> Illiquidity discounts for private companies range from 10-35% 
            (Damodaran, 2005; Koeplin, Sarin & Shapiro, 2000). Higher quality companies command smaller discounts.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

