/**
 * Adjustments Summary Component
 * 
 * Displays all adjustments applied during valuation:
 * - Owner Concentration
 * - Size Discount
 * - Liquidity Discount
 * - Ownership Adjustment
 * 
 * Shows adjustment percentages, rationale, calibration details, and tier selection.
 * 
 * Phase 2: Main Report Enhancement
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingDown, Info, Database, Calculator } from 'lucide-react';
import { getStepData, getStepResultData } from '../../utils/valuationDataExtractor';
import { StepStatusBadge } from '../shared/StepStatusIndicator';
import type { ValuationResponse, AdjustmentDetail } from '../../types/valuation';

interface AdjustmentsSummaryProps {
  result: ValuationResponse;
  className?: string;
}

export const AdjustmentsSummary: React.FC<AdjustmentsSummaryProps> = ({
  result,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedAdjustments, setExpandedAdjustments] = useState<Set<number>>(new Set());

  // Extract adjustments from transparency report
  const adjustments = result.transparency?.adjustments_applied || [];

  // Also extract from step data for comprehensive view
  const step4Data = getStepData(result, 4); // Owner Concentration
  const step5Data = getStepData(result, 5); // Size Discount
  const step6Data = getStepData(result, 6); // Liquidity Discount
  const step8Data = getStepData(result, 8); // Ownership Adjustment

  const toggleAdjustment = (stepNumber: number) => {
    const newExpanded = new Set(expandedAdjustments);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedAdjustments(newExpanded);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'owner_concentration':
        return '👤';
      case 'size_discount':
        return '📏';
      case 'liquidity_discount':
        return '💧';
      case 'control_premium':
        return '⬆️';
      case 'minority_discount':
        return '⬇️';
      case 'deadlock_discount':
        return '⚖️';
      default:
        return '📊';
    }
  };

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'owner_concentration':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'size_discount':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'liquidity_discount':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'control_premium':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'minority_discount':
      case 'deadlock_discount':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Build comprehensive adjustments list
  const allAdjustments: Array<{
    stepNumber: number;
    name: string;
    type: string;
    adjustment: number;
    adjustmentPct: number;
    rationale: string;
    tier?: string;
    calibrationType?: string;
    status: 'completed' | 'skipped' | 'failed' | 'not_executed';
    stepData: any;
  }> = [];

  // Step 4: Owner Concentration
  if (step4Data && step4Data.status === 'completed') {
    const step4Result = getStepResultData(result, 4);
    const ownerConcentration = result.multiples_valuation?.owner_concentration;
    if (ownerConcentration) {
      allAdjustments.push({
        stepNumber: 4,
        name: 'Owner Concentration Adjustment',
        type: 'owner_concentration',
        adjustment: ownerConcentration.adjustment_factor,
        adjustmentPct: ownerConcentration.adjustment_factor * 100,
        rationale: 'Key person risk adjustment based on owner/employee ratio',
        tier: ownerConcentration.risk_level,
        calibrationType: ownerConcentration.calibration?.calibration_type,
        status: step4Data.status,
        stepData: step4Data
      });
    }
  }

  // Step 5: Size Discount
  if (step5Data && step5Data.status === 'completed') {
    const step5Result = getStepResultData(result, 5);
    const sizeDiscount = result.multiples_valuation?.size_discount || 0;
    if (sizeDiscount < 0) {
      allAdjustments.push({
        stepNumber: 5,
        name: 'Size Discount',
        type: 'size_discount',
        adjustment: sizeDiscount,
        adjustmentPct: sizeDiscount * 100,
        rationale: 'McKinsey Size Premium discount for small company size',
        tier: step5Result?.size_tier,
        status: step5Data.status,
        stepData: step5Data
      });
    }
  }

  // Step 6: Liquidity Discount
  if (step6Data && step6Data.status === 'completed') {
    const liquidityDiscount = result.multiples_valuation?.liquidity_discount || 0;
    if (liquidityDiscount < 0) {
      allAdjustments.push({
        stepNumber: 6,
        name: 'Liquidity Discount',
        type: 'liquidity_discount',
        adjustment: liquidityDiscount,
        adjustmentPct: liquidityDiscount * 100,
        rationale: 'Private company illiquidity discount',
        status: step6Data.status,
        stepData: step6Data
      });
    }
  }

  // Step 8: Ownership Adjustment
  if (step8Data && step8Data.status === 'completed') {
    const step8Result = getStepResultData(result, 8);
    const ownershipAdjustment = result.ownership_adjustment;
    if (ownershipAdjustment && ownershipAdjustment.control_premium !== 0) {
      const adjustmentType = ownershipAdjustment.control_premium > 0 ? 'control_premium' : 'minority_discount';
      allAdjustments.push({
        stepNumber: 8,
        name: 'Ownership Adjustment',
        type: adjustmentType,
        adjustment: ownershipAdjustment.control_premium / 100, // Convert to decimal
        adjustmentPct: ownershipAdjustment.control_premium,
        rationale: step8Result?.tier_description || 'Ownership structure adjustment',
        status: step8Data.status,
        stepData: step8Data
      });
    }
  }

  if (allAdjustments.length === 0) {
    return null;
  }

  const totalAdjustment = allAdjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
  const totalAdjustmentPct = totalAdjustment * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Valuation Adjustments</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {allAdjustments.length} adjustment{allAdjustments.length !== 1 ? 's' : ''} applied
            </span>
            {totalAdjustmentPct < 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Total: {formatPercentage(totalAdjustmentPct)}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {allAdjustments.map((adjustment) => {
            const isExpanded = expandedAdjustments.has(adjustment.stepNumber);
            const stepResult = getStepResultData(result, adjustment.stepNumber);

            return (
              <div
                key={adjustment.stepNumber}
                className={`border rounded-lg ${getAdjustmentColor(adjustment.type)}`}
              >
                {/* Adjustment Header */}
                <button
                  onClick={() => toggleAdjustment(adjustment.stepNumber)}
                  className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{getAdjustmentIcon(adjustment.type)}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{adjustment.name}</div>
                      <div className="text-xs opacity-75 mt-0.5">{adjustment.rationale}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StepStatusBadge status={adjustment.status} size="sm" />
                      <span className="font-bold text-lg">
                        {formatPercentage(adjustment.adjustmentPct)}
                      </span>
                    </div>
                  </div>
                  {stepResult && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-2" />
                    )
                  )}
                </button>

                {/* Adjustment Details (Expanded) */}
                {isExpanded && stepResult && (
                  <div className="border-t border-current/20 bg-white/50 p-3 space-y-2 text-sm">
                    {/* Tier/Risk Level */}
                    {adjustment.tier && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level / Tier:</span>
                        <span className="font-semibold">{adjustment.tier}</span>
                      </div>
                    )}

                    {/* Calibration Type */}
                    {adjustment.calibrationType && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calculator className="w-3.5 h-3.5" />
                          Calibration:
                        </span>
                        <span className="font-semibold capitalize">
                          {adjustment.calibrationType.replace('-', ' ')}
                        </span>
                      </div>
                    )}

                    {/* Step Status */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Step Status:</span>
                      <StepStatusBadge status={adjustment.status} size="sm" />
                    </div>

                    {/* Additional Details from Step Result */}
                    {adjustment.stepNumber === 4 && stepResult.owner_employee_ratio !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owner/Employee Ratio:</span>
                        <span className="font-mono">{stepResult.owner_employee_ratio.toFixed(2)}</span>
                      </div>
                    )}

                    {adjustment.stepNumber === 5 && stepResult.revenue_tier && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue Tier:</span>
                        <span className="font-semibold">{stepResult.revenue_tier}</span>
                      </div>
                    )}

                    {adjustment.stepNumber === 8 && stepResult.ownership_percentage !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ownership %:</span>
                        <span className="font-semibold">{stepResult.ownership_percentage}%</span>
                      </div>
                    )}

                    {/* Academic Sources Note */}
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          {adjustment.stepNumber === 4 && 'Based on Damodaran (2012) and McKinsey Valuation Handbook'}
                          {adjustment.stepNumber === 5 && 'Based on McKinsey Size Premium methodology'}
                          {adjustment.stepNumber === 6 && 'Based on Damodaran (2012) and PwC/Deloitte Restricted Stock Studies'}
                          {adjustment.stepNumber === 8 && 'Based on control premium and minority discount research'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Total Impact Summary */}
          {allAdjustments.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Total Adjustment Impact</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercentage(totalAdjustmentPct)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Combined impact of all adjustments on the final valuation
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

