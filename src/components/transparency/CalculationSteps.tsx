import React from 'react';

/**
 * CalculationSteps - Show step-by-step calculations
 * 
 * Design: Clean, formula-based display with inputs → output
 * Strategy: Educational, builds trust by showing "the math"
 */

interface CalculationStep {
  step_number: number;
  calculation_name: string;
  formula: string;
  inputs: Record<string, number>;
  output: number;
  output_formatted: string;
  explanation: string;
}

interface CalculationStepsProps {
  steps: CalculationStep[];
  title?: string;
}

export const CalculationSteps: React.FC<CalculationStepsProps> = ({
  steps,
  title = "Calculation Steps",
}) => {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {title && (
        <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
      )}
      
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.step_number}
            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
          >
            {/* Step header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {step.step_number}
              </span>
              <h6 className="text-sm font-semibold text-gray-900 flex-1">
                {step.calculation_name}
              </h6>
              <span className="text-sm font-bold text-blue-600">
                {step.output_formatted}
              </span>
            </div>

            {/* Formula */}
            <div className="mb-2 px-8">
              <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-700 font-mono">
                {step.formula}
              </code>
            </div>

            {/* Inputs */}
            {Object.keys(step.inputs).length > 0 && (
              <div className="px-8 mb-2">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(step.inputs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600">{formatInputName(key)}:</span>
                      <span className="font-medium text-gray-900">
                        {formatInputValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="px-8">
              <p className="text-xs text-gray-600">
                {step.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function formatInputName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatInputValue(value: number): string {
  if (value < 0.01 && value > 0) {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (value < 1 && value > 0) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (value > 10000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return value.toFixed(2);
}

