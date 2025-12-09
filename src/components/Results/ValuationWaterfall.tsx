import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import {
  generateCalculationSteps,
  getFinalValuationStep,
  formatCurrency,
  type CalculationStep
} from './utils/valuationCalculations';

interface ValuationWaterfallProps {
  result: ValuationResponse;
}

const InputsTable: React.FC<{ 
  inputs: Array<{ 
    label: string; 
    value: string; 
    highlight?: boolean;
    explanation?: string;
    academicSource?: string;
    type?: string;
    tableData?: Array<{ ratioRange: string; riskLevel: string; discount: string; note: string }>;
  }>; 
  colors: { text: string; bg: string; border: string } 
}> = ({ inputs, colors }) => {
  const [expandedInputs, setExpandedInputs] = useState<Set<number>>(new Set());

  const toggleInput = (idx: number) => {
    const newExpanded = new Set(expandedInputs);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedInputs(newExpanded);
  };

  return (
    <div>
      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Inputs</p>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {inputs.map((input, idx) => {
          // Handle table type inputs
          if (input.type === 'table' && input.tableData) {
            return (
              <div key={idx} className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">{input.label}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-300">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Owner/FTE Ratio</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Risk Level</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Discount</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {input.tableData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-900 font-mono">{row.ratioRange}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              row.riskLevel === 'SOLE_TRADER' ? 'bg-accent-100 text-accent-800' :
                              row.riskLevel === 'CRITICAL' ? 'bg-accent-100 text-accent-800' :
                              row.riskLevel === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              row.riskLevel === 'MEDIUM' ? 'bg-primary-100 text-primary-800' :
                              'bg-primary-100 text-primary-800'
                            }`}>
                              {row.riskLevel}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-accent-600 font-semibold">{row.discount}</td>
                          <td className="py-2 px-3 text-gray-600 text-xs italic">{row.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          // Regular input row
          return (
            <div key={idx}>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-sm text-gray-600">{input.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${input.highlight ? colors.text : 'text-gray-900'}`}>
                    {input.value}
                  </span>
                  {input.explanation && (
                    <button
                      onClick={() => toggleInput(idx)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label="Show explanation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {input.explanation && expandedInputs.has(idx) && (
                <div className="px-4 pb-3 bg-primary-50 border-l-4 border-primary-400">
                  <div className="pt-2 space-y-1">
                    <p className="text-xs font-semibold text-primary-900">Why {input.value}?</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{input.explanation}</p>
                    {input.academicSource && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        <span className="font-semibold">Source:</span> {input.academicSource}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepCard: React.FC<{ step: CalculationStep; isLast?: boolean }> = ({ step, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      badge: 'bg-blue-500',
      icon: 'text-blue-600'
    },
    red: {
      bg: 'bg-accent-50',
      border: 'border-accent-500',
      text: 'text-accent-900',
      badge: 'bg-accent-500',
      icon: 'text-accent-600'
    },
    green: {
      bg: 'bg-primary-50',
      border: 'border-primary-500',
      text: 'text-primary-900',
      badge: 'bg-primary-500',
      icon: 'text-primary-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      badge: 'bg-yellow-500',
      icon: 'text-yellow-600'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-900',
      badge: 'bg-gray-500',
      icon: 'text-gray-600'
    }
  };

  const colors = colorClasses[step.color];

  return (
    <div className="relative">
      <div className={`bg-white rounded-lg border-2 ${colors.border} shadow-sm overflow-hidden`}>
        {/* Header */}
        <div 
          className={`${colors.bg} p-4 cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Step Badge */}
              <div className={`${colors.badge} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                {step.stepNumber}
              </div>
              
              {/* Title and Icon */}
              <div>
                <h3 className={`text-lg font-bold ${colors.text} flex items-center gap-2`}>
                  <span>{step.icon}</span>
                  <span>{step.title}</span>
                  {step.adjustmentPercent !== undefined && step.adjustmentPercent !== 0 && (
                    <span className="text-sm font-semibold">
                      ({step.adjustmentPercent > 0 ? '+' : ''}{(step.adjustmentPercent * 100).toFixed(0)}%)
                    </span>
                  )}
                </h3>
                {step.subtitle && (
                  <p className={`text-sm ${colors.text} opacity-75 mt-0.5`}>{step.subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Expand/Collapse Icon */}
            <svg 
              className={`w-5 h-5 ${colors.icon} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="p-6 space-y-4">
            {/* Formula */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Formula</p>
              <p className="font-mono text-sm text-gray-900 font-medium">{step.formula}</p>
            </div>

            {/* Inputs Table */}
            {step.inputs.length > 0 && (
              <InputsTable inputs={step.inputs} colors={colors} />
            )}

            {/* Calculation */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-xs text-primary-600 font-semibold uppercase mb-1">Calculation</p>
              <p className="font-mono text-sm text-primary-900 font-medium">{step.calculation}</p>
            </div>

            {/* Explanation */}
            {step.explanation && (
              <div className="bg-gray-50 border-l-4 border-gray-400 p-3">
                <p className="text-sm text-gray-700">{step.explanation}</p>
              </div>
            )}

            {/* Detailed Explanation with Academic Sources */}
            {step.detailedExplanation && (
              <div className="bg-gradient-to-br from-primary-50 to-canvas border-2 border-primary-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-sm font-bold text-blue-900">
                    {step.detailedExplanation.percentage === 0 && (step.stepNumber === 1 || step.title.includes('Base')) 
                      ? 'How the Multiple Was Calculated'
                      : `Detailed Explanation: Why ${step.detailedExplanation.percentage.toFixed(0)}%?`}
                  </h4>
                </div>

                {/* Academic Sources */}
                {step.detailedExplanation.academicSources.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-primary-200">
                    <p className="text-xs font-semibold text-primary-800 uppercase mb-2">Academic Sources</p>
                    <div className="space-y-2">
                      {step.detailedExplanation.academicSources.map((source, idx) => (
                        <div key={idx} className="text-xs text-gray-700">
                          <p className="font-semibold text-gray-900">
                            {source.author} ({source.year})
                          </p>
                          <p className="text-gray-600 italic">{source.citation}</p>
                          {source.pageReference && (
                            <p className="text-gray-500 text-xs mt-0.5">{source.pageReference}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logic */}
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 uppercase mb-2">Logic & Rationale</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{step.detailedExplanation.logic}</p>
                </div>

                {/* Component Breakdown */}
                {step.detailedExplanation.componentBreakdown && step.detailedExplanation.componentBreakdown.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-primary-200">
                    <p className="text-xs font-semibold text-primary-800 uppercase mb-2">Component Breakdown</p>
                    <div className="space-y-2">
                      {step.detailedExplanation.componentBreakdown.map((component, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{component.component}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{component.explanation}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${component.value < 0 ? 'text-accent-600' : component.value > 0 ? 'text-primary-600' : 'text-gray-600'}`}>
                              {component.displayType === 'multiple' 
                                ? `${component.value.toFixed(2)}x`
                                : `${component.value > 0 ? '+' : ''}${component.value.toFixed(0)}%`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Level & Tier */}
                {(step.detailedExplanation.riskLevel || step.detailedExplanation.tier) && (
                  <div className="flex items-center gap-2 text-xs text-primary-700">
                    {step.detailedExplanation.riskLevel && (
                      <span className="px-2 py-1 bg-primary-100 rounded border border-primary-300 font-semibold">
                        Risk Level: {step.detailedExplanation.riskLevel}
                      </span>
                    )}
                    {step.detailedExplanation.tier && (
                      <span className="px-2 py-1 bg-primary-100 rounded border border-primary-300 font-semibold">
                        Tier: {step.detailedExplanation.tier}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Results Grid */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Results</p>
              {step.dataRequired ? (
                <div className="bg-accent-50 border-2 border-accent-400 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-accent-900 mb-1">Data Required</h4>
                      <p className="text-sm text-accent-800">{step.dataRequiredMessage || 'Required financial data is missing. Please enter the necessary information to calculate valuation.'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Low Estimate</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(step.result.low)}</p>
                  </div>
                  <div className={`${colors.bg} border-2 ${colors.border} rounded-lg p-3 text-center`}>
                    <p className={`text-xs ${colors.text} opacity-75 mb-1 font-semibold`}>Mid-Point</p>
                    <p className={`text-lg font-bold ${colors.text}`}>{formatCurrency(step.result.mid)}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">High Estimate</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(step.result.high)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Arrow between steps */}
      {!isLast && (
        <div className="flex justify-center my-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const ValuationWaterfall: React.FC<ValuationWaterfallProps> = ({ result }) => {
  const steps = generateCalculationSteps(result);
  const finalResult = getFinalValuationStep(result);

  // Helper function: Determine if EBITDA is the primary method with enhanced fallback logic
  const isPrimaryEBITDA = () => {
    const multiples = result.multiples_valuation;
    
    // Priority 1: Check primary_multiple_method (most authoritative)
    if (multiples?.primary_multiple_method) {
      return multiples.primary_multiple_method === 'ebitda_multiple';
    }
    
    // Priority 2: Check primary_method field (string format)
    if (multiples?.primary_method) {
      return multiples.primary_method === 'EV/EBITDA' || multiples.primary_method.includes('EBITDA');
    }
    
    // Priority 3: Check top-level primary_method
    if (result.primary_method) {
      return result.primary_method === 'EV/EBITDA' || result.primary_method.includes('EBITDA');
    }
    
    // Priority 4: Infer from EBITDA availability (fallback)
    return !!result.current_year_data?.ebitda;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
            📊
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Valuation Calculation Breakdown</h2>
        </div>
        <p className="text-sm text-gray-600 ml-13">
          Complete step-by-step calculation showing how we arrive at your final valuation range
        </p>
      </div>

      {/* Calculation Steps */}
      <div className="space-y-0">
        {steps.map((step, idx) => (
          <StepCard key={step.stepNumber} step={step} isLast={idx === steps.length - 1} />
        ))}
      </div>

      {/* Final Result */}
      <div className="mt-6">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
            🎯 FINAL VALUATION RANGE
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-primary-50 to-canvas border-2 border-primary-500 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Low Estimate</p>
              <p className="text-2xl font-bold text-slate-ink">{formatCurrency(finalResult.low)}</p>
              <p className="text-xs text-gray-500 mt-1">{result.range_methodology === 'multiple_dispersion' ? 'P25 Multiple' : 'Conservative'}</p>
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-4 text-center border-2 border-primary-600 shadow-md">
              <p className="text-sm text-white opacity-90 mb-2 font-semibold">Mid-Point (Most Likely)</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(finalResult.mid)}</p>
              <p className="text-xs text-white opacity-75 mt-1">Median Multiple</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">High Estimate</p>
              <p className="text-2xl font-bold text-slate-ink">{formatCurrency(finalResult.high)}</p>
              <p className="text-xs text-gray-500 mt-1">{result.range_methodology === 'multiple_dispersion' ? 'P75 Multiple' : 'Optimistic'}</p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mt-4 pt-4 border-t border-primary-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Confidence Score</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.confidence_score || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-ink">{(result.confidence_score || 0).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-4 bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
        <p className="text-sm text-primary-900">
          <strong>📚 Methodology:</strong> This valuation uses the {isPrimaryEBITDA() ? 'EBITDA Multiple' : 'Revenue Multiple'} approach as the primary method, 
          with industry-standard adjustments for owner concentration, company size, and illiquidity. 
          All calculations follow European market standards and academic research.
        </p>
      </div>
    </div>
  );
};

