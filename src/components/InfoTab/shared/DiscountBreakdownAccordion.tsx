import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react';
import type { DiscountBreakdown } from '../../../types/valuation';

interface DiscountBreakdownAccordionProps {
  breakdown: DiscountBreakdown;
  stepNumber: number;
  stepName?: string; // Optional, for future use
}

/**
 * DiscountBreakdownAccordion - McKinsey-level discount transparency component
 * 
 * Displays detailed component-level breakdown of discounts with academic sources.
 * Implements progressive disclosure pattern: simple summary visible, detailed breakdown expandable.
 * 
 * Design Philosophy:
 * - SME Owners (80%): See clean summary, can expand for details if curious
 * - Advisors/Accountants (20%): Get full academic rigor with citable sources
 */
export const DiscountBreakdownAccordion: React.FC<DiscountBreakdownAccordionProps> = React.memo(({
  breakdown,
  stepNumber
  // stepName is optional and reserved for future use
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!breakdown || !breakdown.components || breakdown.components.length === 0) {
    return null;
  }

  const hasMultipleComponents = breakdown.components.length > 1;
  const totalDiscount = breakdown.total || 0;
  const riskLevel = breakdown.risk_level;
  const rationale = breakdown.rationale;

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`discount-breakdown-${stepNumber}`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">
            Show Discount Breakdown & Academic Sources
          </span>
          {hasMultipleComponents && (
            <span className="text-xs text-gray-500">
              ({breakdown.components.length} components)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-600">
            Total: {Math.abs(totalDiscount).toFixed(1)}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div id={`discount-breakdown-${stepNumber}`} className="p-4 space-y-4 bg-white">
          {/* Risk Level Badge (if applicable) */}
          {riskLevel && (
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">
                Risk Level: <span className={`font-semibold ${
                  riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'text-red-600' :
                  riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>{riskLevel}</span>
              </span>
            </div>
          )}

          {/* Component Breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Component Breakdown:</h4>
            <div className="space-y-3">
              {breakdown.components.map((component, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {component.name}
                        </span>
                        <span className={`text-sm font-semibold ${
                          component.percentage < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {component.percentage.toFixed(1)}%
                        </span>
                      </div>
                      {component.description && (
                        <p className="text-xs text-gray-600 mb-2">
                          {component.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <BookOpen className="w-3 h-3" />
                        <span className="font-medium">Source:</span>
                        <span>{component.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Discount Summary */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
              <span className="font-semibold text-gray-900 text-sm">Total Discount:</span>
              <span className="text-lg font-bold text-blue-600">
                {totalDiscount.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Rationale (if provided) */}
          {rationale && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-yellow-900 mb-1">Rationale:</h5>
                  <p className="text-xs text-yellow-800">{rationale}</p>
                </div>
              </div>
            </div>
          )}

          {/* Academic References */}
          {breakdown.academic_sources && breakdown.academic_sources.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Academic References:
              </h4>
              <ul className="space-y-1.5">
                {breakdown.academic_sources.map((source, index) => (
                  <li key={index} className="text-xs text-gray-700 pl-4 relative">
                    <span className="absolute left-0 top-1 text-blue-600 font-bold">
                      {index + 1}.
                    </span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Context */}
          {(breakdown.owner_employee_ratio !== undefined || breakdown.revenue_tier || breakdown.sme_status) && (
            <div className="pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-gray-700 mb-2">Additional Context:</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {breakdown.owner_employee_ratio !== undefined && (
                  <div>
                    <span className="text-gray-600">Owner/Employee Ratio:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {breakdown.owner_employee_ratio.toFixed(2)}
                    </span>
                  </div>
                )}
                {breakdown.revenue_tier && (
                  <div>
                    <span className="text-gray-600">Revenue Tier:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {breakdown.revenue_tier}
                    </span>
                  </div>
                )}
                {breakdown.revenue !== undefined && (
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      €{(breakdown.revenue / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                )}
                {breakdown.sme_status && (
                  <div className="col-span-2">
                    <span className="text-gray-600">SME Status:</span>
                    <span className={`ml-1 font-medium ${
                      breakdown.sme_status === 'skipped' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {breakdown.sme_status.charAt(0).toUpperCase() + breakdown.sme_status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DiscountBreakdownAccordion.displayName = 'DiscountBreakdownAccordion';

