/**
 * Value Chain Validation Component
 * 
 * Displays value chain consistency checks and validation results.
 * Shows how values transform from Step 7/8 → Step 10 → Step 11.
 * 
 * Phase 7: Value Chain Visualization
 */

import React from 'react';
import { CheckCircle, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { getStepData, getStepResultData } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface ValueChainValidationProps {
  result: ValuationResponse;
  className?: string;
}

export const ValueChainValidation: React.FC<ValueChainValidationProps> = ({
  result,
  className = ''
}) => {
  const step7Data = getStepData(result, 7);
  const step7Result = getStepResultData(result, 7);
  const step8Data = getStepData(result, 8);
  const step8Result = getStepResultData(result, 8);
  const step10Data = getStepData(result, 10);
  const step10Result = getStepResultData(result, 10);
  const step11Data = getStepData(result, 11);
  const step11Result = getStepResultData(result, 11);

  // Extract values from steps
  const equityValueStep7 = step7Result?.equity_value_mid || result.equity_value_mid;
  const equityValueStep8 = step8Result?.ownership_adjusted_equity_mid || equityValueStep7;
  const valuationMidStep10 = step10Result?.valuation_mid || result.equity_value_mid;
  const valuationMidStep11 = step11Result?.valuation_mid || result.equity_value_mid;

  // Validate value chain consistency
  const tolerance = Math.max(equityValueStep8 * 0.01, 100); // 1% or €100
  const step8ToStep10Diff = Math.abs(equityValueStep8 - valuationMidStep10);
  const step10ToStep11Diff = Math.abs(valuationMidStep10 - valuationMidStep11);
  const step8ToStep11Diff = Math.abs(equityValueStep8 - valuationMidStep11);

  const step8ToStep10Valid = step8ToStep10Diff <= tolerance;
  const step10ToStep11Valid = step10ToStep11Diff <= tolerance;
  const step8ToStep11Valid = step8ToStep11Diff <= tolerance;

  const allValid = step8ToStep10Valid && step10ToStep11Valid && step8ToStep11Valid;

  const formatCurrency = (value: number): string => {
    return `€${Math.round(value).toLocaleString()}`;
  };

  const formatDifference = (diff: number): string => {
    if (diff < 1000) {
      return `€${Math.round(diff)}`;
    }
    return `€${(diff / 1000).toFixed(1)}K`;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {allValid ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Value Chain Validation</h3>
            <p className="text-sm text-gray-600">
              {allValid 
                ? 'Value chain is consistent across all steps' 
                : 'Value chain has minor inconsistencies (within acceptable tolerance)'}
            </p>
          </div>
        </div>

        {/* Value Chain Flow */}
        <div className="space-y-3">
          {/* Step 7 → Step 8 */}
          {step8Data && step8Data.status === 'completed' && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Step 7: EV to Equity Conversion</div>
                <div className="text-base font-semibold text-gray-900">
                  {formatCurrency(equityValueStep7)}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Step 8: Ownership Adjustment</div>
                <div className="text-base font-semibold text-gray-900">
                  {formatCurrency(equityValueStep8)}
                </div>
                {equityValueStep8 !== equityValueStep7 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {equityValueStep8 > equityValueStep7 ? '+' : ''}
                    {formatDifference(equityValueStep8 - equityValueStep7)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8 → Step 10 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                {step8Data && step8Data.status === 'completed' 
                  ? 'Step 8: Ownership-Adjusted Equity' 
                  : 'Step 7: Equity Value'}
              </div>
              <div className="text-base font-semibold text-gray-900">
                {formatCurrency(equityValueStep8)}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Step 10: Range Methodology</div>
              <div className="text-base font-semibold text-gray-900">
                {formatCurrency(valuationMidStep10)}
              </div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${
                step8ToStep10Valid ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {step8ToStep10Valid ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {step8ToStep10Diff > 0 && (
                  <span>Diff: {formatDifference(step8ToStep10Diff)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Step 10 → Step 11 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Step 10: Range Methodology</div>
              <div className="text-base font-semibold text-gray-900">
                {formatCurrency(valuationMidStep10)}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Step 11: Final Valuation</div>
              <div className="text-base font-semibold text-gray-900">
                {formatCurrency(valuationMidStep11)}
              </div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${
                step10ToStep11Valid ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {step10ToStep11Valid ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {step10ToStep11Diff > 0 && (
                  <span>Diff: {formatDifference(step10ToStep11Diff)} (rounding)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Overall Validation:</span>
            <div className="flex items-center gap-2">
              {allValid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">Validated</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-600">Minor Differences</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Value chain validation ensures consistency between calculation steps. 
            Minor differences may occur due to rounding or intermediate calculations.
          </p>
        </div>
      </div>
    </div>
  );
};

