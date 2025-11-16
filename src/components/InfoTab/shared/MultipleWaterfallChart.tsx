import React from 'react';
import { TrendingDown, ArrowDown } from 'lucide-react';
import type { MultiplePipeline } from '../../../types/valuation';

interface MultipleWaterfallChartProps {
  pipeline: MultiplePipeline;
  showLowHigh?: boolean;  // Whether to show low/high ranges (default: false, only mid)
}

/**
 * MultipleWaterfallChart - Visual representation of multiple discount journey
 * 
 * Shows how the valuation multiple progresses from initial (Step 3) through
 * each discount step (4, 5, 6) to the final adjusted multiple.
 * 
 * McKinsey Standard: Clear visualization of value bridge/waterfall analysis.
 */
export const MultipleWaterfallChart: React.FC<MultipleWaterfallChartProps> = React.memo(({
  pipeline,
  showLowHigh = false
}) => {
  if (!pipeline || !pipeline.discount_waterfall || pipeline.discount_waterfall.length === 0) {
    return null;
  }

  const waterfall = pipeline.discount_waterfall;
  const metricType = pipeline.metric_type || 'EBITDA';
  const totalReduction = pipeline.total_reduction_percentage || 0;

  // Calculate max multiple for scaling bars
  const allMultiples = waterfall.flatMap(step => [
    step.multiple_after_low,
    step.multiple_after_mid,
    step.multiple_after_high
  ]).filter((m): m is number => m !== null && m !== undefined);
  const maxMultiple = Math.max(...allMultiples);

  const formatMultiple = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}x`;
  };

  const getBarWidth = (value: number | null | undefined): string => {
    if (value === null || value === undefined || maxMultiple === 0) return '0%';
    return `${(value / maxMultiple) * 100}%`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Multiple Discount Waterfall</h4>
        </div>
        <p className="text-sm text-gray-600">
          {metricType} multiple progression through discount steps
        </p>
      </div>

      {/* Waterfall Steps */}
      <div className="space-y-3">
        {waterfall.map((step, index) => {
          const isInitial = step.step === 'Initial';
          const isDiscount = !isInitial && step.discount_percentage !== 0;
          const multipleMid = step.multiple_after_mid;

          return (
            <div key={index} className="relative">
              {/* Arrow connector (except for first step) */}
              {index > 0 && (
                <div className="flex justify-center mb-1">
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                </div>
              )}

              {/* Step Card */}
              <div className={`rounded-lg border-2 p-3 ${
                isInitial 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
                  : isDiscount
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
                    : 'bg-gray-50 border-gray-300'
              }`}>
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!isInitial && (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {step.step}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 text-sm">
                      {step.step_name}
                    </span>
                  </div>
                  {isDiscount && (
                    <span className={`text-sm font-bold ${
                      step.discount_percentage < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {step.discount_percentage.toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Description */}
                {step.description && (
                  <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                )}

                {/* Multiple Display */}
                <div className="space-y-2">
                  {/* Mid-point (always show) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">
                        {showLowHigh ? 'Mid-Point:' : 'Multiple:'}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatMultiple(multipleMid)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isInitial
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : isDiscount
                              ? 'bg-gradient-to-r from-orange-500 to-red-500'
                              : 'bg-gray-400'
                        }`}
                        style={{ width: getBarWidth(multipleMid) }}
                      />
                    </div>
                  </div>

                  {/* Low/High ranges (optional) */}
                  {showLowHigh && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Low:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {formatMultiple(step.multiple_after_low)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">High:</span>
                        <span className="ml-1 font-medium text-gray-700">
                          {formatMultiple(step.multiple_after_high)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Initial Multiple:</span>
            <div className="font-bold text-gray-900 text-lg">
              {formatMultiple(pipeline.initial_multiple_mid || pipeline.initial_multiple)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Final Multiple:</span>
            <div className="font-bold text-green-600 text-lg">
              {formatMultiple(pipeline.final_multiple_mid || pipeline.final_multiple)}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">Total Reduction:</span>
          <span className="text-lg font-bold text-red-600">
            {Math.abs(totalReduction).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Metric Context */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Based on {metricType} of €{(pipeline.metric_value / 1_000_000).toFixed(2)}M
      </div>
    </div>
  );
});

MultipleWaterfallChart.displayName = 'MultipleWaterfallChart';

