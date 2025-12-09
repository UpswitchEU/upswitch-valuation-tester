/**
 * Adjustments Summary Component
 * 
 * Displays summary of adjustments applied during valuation.
 * 
 * NOTE: Detailed adjustment breakdowns are now available in the Info Tab HTML (info_tab_html).
 * This component shows a simplified summary using only summary fields from the response.
 * 
 * Phase 2: Main Report Enhancement (Simplified)
 */

import { ChevronDown, ChevronRight, ExternalLink, Info, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';

interface AdjustmentsSummaryProps {
  result: ValuationResponse;
  className?: string;
  onViewDetails?: () => void; // Callback to navigate to info tab
}

export const AdjustmentsSummary: React.FC<AdjustmentsSummaryProps> = ({
  result,
  className = '',
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Build adjustments list from summary fields only
  const allAdjustments: Array<{
    name: string;
    type: string;
    adjustment: number;
    adjustmentPct: number;
    rationale: string;
  }> = [];

  // Owner Concentration Adjustment
  const ownerConc = result.multiples_valuation?.owner_concentration;
  if (ownerConc && ownerConc.adjustment_factor !== undefined) {
    allAdjustments.push({
      name: 'Owner Concentration Adjustment',
      type: 'owner_concentration',
      adjustment: ownerConc.adjustment_factor,
      adjustmentPct: (ownerConc.adjustment_factor * 100) || 0,
      rationale: 'Key person risk adjustment based on owner/employee ratio'
    });
  }

  // Size Discount
  if (result.multiples_valuation?.size_discount !== undefined) {
    allAdjustments.push({
      name: 'Size Discount',
      type: 'size_discount',
      adjustment: result.multiples_valuation.size_discount,
      adjustmentPct: (result.multiples_valuation.size_discount * 100) || 0,
      rationale: 'Size risk adjustment for small company'
    });
  }

  // Liquidity Discount
  if (result.multiples_valuation?.liquidity_discount !== undefined) {
    allAdjustments.push({
      name: 'Liquidity Discount',
      type: 'liquidity_discount',
      adjustment: result.multiples_valuation.liquidity_discount,
      adjustmentPct: (result.multiples_valuation.liquidity_discount * 100) || 0,
      rationale: 'Private company illiquidity discount'
    });
  }

  // Ownership Adjustment
  if (result.owner_dependency_adjustment !== undefined && result.owner_dependency_adjustment !== 0) {
    allAdjustments.push({
      name: 'Ownership Adjustment',
      type: 'ownership_adjustment',
      adjustment: result.owner_dependency_adjustment,
      adjustmentPct: 0, // Calculate if needed
      rationale: 'Owner dependency adjustment'
    });
  }

  if (allAdjustments.length === 0) {
    return null;
  }

  const totalAdjustmentPct = allAdjustments.reduce((sum, adj) => sum + adj.adjustmentPct, 0);

  const hasInfoTabHtml = !!(result.info_tab_html && result.info_tab_html.length > 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-ink">Valuation Adjustments</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {allAdjustments.length} adjustment{allAdjustments.length !== 1 ? 's' : ''} applied
            </span>
            {totalAdjustmentPct < 0 && (
              <span className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
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
          {/* Info Message */}
          {hasInfoTabHtml && (
            <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-primary-800 mb-2">
                    Detailed adjustment breakdowns with formulas, academic sources, and component analysis are available in the Info Tab.
                  </p>
                  {onViewDetails && (
                    <button
                      onClick={onViewDetails}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Detailed Adjustments in Info Tab
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Adjustments List */}
          {allAdjustments.map((adjustment, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{adjustment.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{adjustment.rationale}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">
                    {formatPercentage(adjustment.adjustmentPct)}
                  </div>
                  {adjustment.adjustment !== 0 && (
                    <div className="text-xs text-gray-500">
                      €{Math.abs(adjustment.adjustment).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Total Impact Summary */}
          {allAdjustments.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-slate-ink">Total Adjustment Impact</span>
                </div>
                <span className="text-2xl font-bold text-slate-ink">
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
