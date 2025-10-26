import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ValuationResponse } from '../../types/valuation';
import { formatCurrency, formatPercent } from '../Results/utils/formatters';

interface SensitivityAnalysisProps {
  result: ValuationResponse;
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({ result }) => {
  const baseValue = result.equity_value_mid || 0;
  const baseWACC = result.dcf_valuation?.wacc || 12.1;
  const baseGrowth = result.dcf_valuation?.terminal_growth_rate || 2.9;

  // Calculate sensitivity ranges
  const waccSensitivity = [-2, -1, 0, 1, 2].map(delta => ({
    wacc: baseWACC + delta,
    value: baseValue * (1 - (delta * 0.08)) // Approximate impact
  }));

  const growthSensitivity = [-1, -0.5, 0, 0.5, 1].map(delta => ({
    growth: baseGrowth + delta,
    value: baseValue * (1 + (delta * 0.05)) // Approximate impact
  }));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Sensitivity Analysis</h3>

      {/* WACC Sensitivity */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Impact of WACC Changes</h4>
        <div className="space-y-2">
          {waccSensitivity.map(({ wacc, value }, index) => {
            const isBase = index === 2;
            const change = ((value - baseValue) / baseValue) * 100;
            return (
              <div
                key={wacc}
                className={`flex items-center justify-between p-2 rounded ${
                  isBase ? 'bg-primary-100 border border-primary-300' : 'bg-gray-50'
                }`}
              >
                <span className="text-sm">
                  WACC: <span className="font-mono font-medium">{formatPercent(wacc)}</span>
                  {isBase && <span className="ml-2 text-xs text-primary-600">(Current)</span>}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{formatCurrency(value)}</span>
                  {!isBase && (
                    <span className={`text-xs flex items-center gap-1 ${
                      change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Higher WACC (discount rate) reduces valuation as future cash flows are discounted more heavily
        </p>
      </div>

      {/* Growth Rate Sensitivity */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Impact of Terminal Growth Rate Changes</h4>
        <div className="space-y-2">
          {growthSensitivity.map(({ growth, value }, index) => {
            const isBase = index === 2;
            const change = ((value - baseValue) / baseValue) * 100;
            return (
              <div
                key={growth}
                className={`flex items-center justify-between p-2 rounded ${
                  isBase ? 'bg-primary-100 border border-primary-300' : 'bg-gray-50'
                }`}
              >
                <span className="text-sm">
                  Growth: <span className="font-mono font-medium">{formatPercent(growth)}</span>
                  {isBase && <span className="ml-2 text-xs text-primary-600">(Current)</span>}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{formatCurrency(value)}</span>
                  {!isBase && (
                    <span className={`text-xs flex items-center gap-1 ${
                      change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Higher terminal growth rate increases valuation as perpetual cash flows grow faster
        </p>
      </div>
    </div>
  );
};
