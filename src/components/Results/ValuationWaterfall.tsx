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
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      badge: 'bg-red-500',
      icon: 'text-red-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-900',
      badge: 'bg-green-500',
      icon: 'text-green-600'
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
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Inputs</p>
                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {step.inputs.map((input, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-gray-600">{input.label}</span>
                      <span className={`text-sm font-semibold ${input.highlight ? colors.text : 'text-gray-900'}`}>
                        {input.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Calculation</p>
              <p className="font-mono text-sm text-blue-900 font-medium">{step.calculation}</p>
            </div>

            {/* Explanation */}
            {step.explanation && (
              <div className="bg-gray-50 border-l-4 border-gray-400 p-3">
                <p className="text-sm text-gray-700">{step.explanation}</p>
              </div>
            )}

            {/* Results Grid */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Results</p>
              {step.dataRequired ? (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-1">Data Required</h4>
                      <p className="text-sm text-yellow-800">{step.dataRequiredMessage || 'Required financial data is missing. Please enter the necessary information to calculate valuation.'}</p>
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
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
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
            🎯 FINAL VALUATION RANGE
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Low Estimate</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(finalResult.low)}</p>
              <p className="text-xs text-gray-500 mt-1">{result.range_methodology === 'multiple_dispersion' ? 'P25 Multiple' : 'Conservative'}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-lg p-4 text-center border-2 border-green-600 shadow-md">
              <p className="text-sm text-white opacity-90 mb-2 font-semibold">Mid-Point (Most Likely)</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(finalResult.mid)}</p>
              <p className="text-xs text-white opacity-75 mt-1">Median Multiple</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">High Estimate</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(finalResult.high)}</p>
              <p className="text-xs text-gray-500 mt-1">{result.range_methodology === 'multiple_dispersion' ? 'P75 Multiple' : 'Optimistic'}</p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Confidence Score</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${result.confidence_score || 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900">{(result.confidence_score || 0).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-900">
          <strong>📚 Methodology:</strong> This valuation uses the {result.multiples_valuation?.primary_multiple_method === 'ebitda_multiple' ? 'EBITDA Multiple' : 'Revenue Multiple'} approach as the primary method, 
          with industry-standard adjustments for owner concentration, company size, and illiquidity. 
          All calculations follow European market standards and academic research.
        </p>
      </div>
    </div>
  );
};

