/**
 * Calculation Journey Overview Component
 * 
 * Displays the 12-step calculation journey with:
 * - Step-by-step value transformation (waterfall)
 * - Step status indicators
 * - Execution times
 * - Links to info tab for detailed view
 * 
 * Phase 2: Main Report Enhancement
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StepStatusIndicator, StepStatusBadge } from '../shared/StepStatusIndicator';
import { formatExecutionTime } from '../../utils/stepDataMapper';
import { getAllStepData, getStepsSummary } from '../../utils/valuationDataExtractor';
import type { ValuationResponse } from '../../types/valuation';

interface CalculationJourneyOverviewProps {
  result: ValuationResponse;
  onStepClick?: (stepNumber: number) => void; // Callback to navigate to info tab
  className?: string;
}

export const CalculationJourneyOverview: React.FC<CalculationJourneyOverviewProps> = ({
  result,
  onStepClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const stepData = getAllStepData(result);
  const summary = getStepsSummary(result);

  const stepNames: Record<number, string> = {
    0: 'Data Quality Assessment',
    1: 'Input Data & Business Profile',
    2: 'Industry Benchmarking',
    3: 'Base Enterprise Value',
    4: 'Owner Concentration Adjustment',
    5: 'Size Discount',
    6: 'Liquidity Discount',
    7: 'EV to Equity Conversion',
    8: 'Ownership Adjustment',
    9: 'Confidence Score Analysis',
    10: 'Range Methodology Selection',
    11: 'Final Valuation Synthesis'
  };

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const handleStepClick = (stepNumber: number) => {
    if (onStepClick) {
      onStepClick(stepNumber);
    }
  };

  // Calculate value transformations (simplified waterfall)
  const getValueTransformation = (stepNumber: number): { before?: number; after?: number; change?: number } => {
    // This is a simplified version - full implementation would extract from step results
    switch (stepNumber) {
      case 3: // Base EV
        return {
          after: result.multiples_valuation?.enterprise_value
        };
      case 7: // EV to Equity
        return {
          before: result.multiples_valuation?.enterprise_value,
          after: result.equity_value_mid
        };
      case 11: // Final
        return {
          after: result.equity_value_mid
        };
      default:
        return {};
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">12-Step Calculation Journey</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {summary.completed} completed
            </span>
            {summary.skipped > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {summary.skipped} skipped
              </span>
            )}
            {summary.failed > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {summary.failed} failed
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
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Steps</div>
              <div className="text-lg font-semibold text-gray-900">{summary.total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Completed</div>
              <div className="text-lg font-semibold text-green-600">{summary.completed}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Skipped</div>
              <div className="text-lg font-semibold text-yellow-600">{summary.skipped}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatExecutionTime(result.modular_system?.total_execution_time_ms || 0)}
              </div>
            </div>
          </div>

          {/* Step List */}
          <div className="space-y-1">
            {Array.from({ length: 12 }, (_, i) => i).map((stepNumber) => {
              const step = stepData.find((s) => s.step === stepNumber) || null;
              const stepName = stepNames[stepNumber] || `Step ${stepNumber}`;
              const isStepExpanded = expandedSteps.has(stepNumber);
              const transformation = getValueTransformation(stepNumber);
              const hasDetails = step && (step.key_outputs || step.description);

              return (
                <div
                  key={stepNumber}
                  className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleStep(stepNumber)}
                        className="flex items-center gap-2 text-left flex-1 hover:text-primary-600 transition-colors"
                      >
                        {hasDetails ? (
                          isStepExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )
                        ) : (
                          <Minus className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          Step {stepNumber}: {stepName}
                        </span>
                      </button>

                      {/* Status Badge */}
                      <StepStatusBadge
                        status={step?.status || 'not_executed'}
                        size="sm"
                      />

                      {/* Execution Time */}
                      {step?.execution_time_ms && step.status === 'completed' && (
                        <span className="text-xs text-gray-500">
                          {formatExecutionTime(step.execution_time_ms)}
                        </span>
                      )}

                      {/* Value Transformation Indicator */}
                      {transformation.after !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          {transformation.before !== undefined && transformation.change !== undefined && (
                            <>
                              {transformation.change > 0 ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : transformation.change < 0 ? (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              ) : null}
                            </>
                          )}
                          <span className="font-mono">
                            €{transformation.after.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Details Link */}
                    {onStepClick && (
                      <button
                        onClick={() => handleStepClick(stepNumber)}
                        className="ml-2 px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Details
                      </button>
                    )}
                  </div>

                  {/* Step Details (Expanded) */}
                  {isStepExpanded && hasDetails && step && (
                    <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2">
                      <div className="text-sm text-gray-600">{step.description}</div>
                      
                      {step.key_outputs && Object.keys(step.key_outputs).length > 0 && (
                        <div className="text-xs text-gray-500">
                          <div className="font-semibold mb-1">Key Outputs:</div>
                          <div className="space-y-1">
                            {Object.entries(step.key_outputs).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="font-mono">
                                  {typeof value === 'number' 
                                    ? value.toLocaleString() 
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.reason && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                          <strong>Skip Reason:</strong> {step.reason}
                        </div>
                      )}

                      {step.error && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {step.error}
                        </div>
                      )}

                      {step.methodology_note && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <strong>Note:</strong> {step.methodology_note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

