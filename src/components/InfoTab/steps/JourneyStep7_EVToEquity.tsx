import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { FormulaBox } from '../shared/FormulaBox';
import { ValueGrid } from '../shared/ValueGrid';

interface JourneyStep7Props {
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep7_EVToEquity: React.FC<JourneyStep7Props> = ({ beforeValues }) => {
  // Get debt and cash from input data or result
  const netDebt = 0; // Assuming no debt for now, can be enhanced
  const cash = 0; // Assuming no cash adjustment for now

  // Calculate equity value
  const equityValues = {
    low: beforeValues.low - netDebt + cash,
    mid: beforeValues.mid - netDebt + cash,
    high: beforeValues.high - netDebt + cash
  };

  return (
    <StepCard
      id="step-7-equity"
      stepNumber={7}
      title="Enterprise Value to Equity Value Conversion"
      subtitle="Converting from enterprise value to equity value"
      icon={<ArrowRightLeft className="w-5 h-5" />}
      color="teal"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Formula */}
        <FormulaBox
          formula="Equity Value = Enterprise Value - Net Debt + Cash"
          description="Enterprise value represents total company value; equity value is what shareholders own"
        />

        {/* Components */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Conversion Components</h4>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-600">Enterprise Value (After Adjustments)</span>
              <span className="text-base font-bold text-teal-700">{formatCurrency(beforeValues.mid)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-sm text-gray-600">Less: Net Debt</span>
              <span className="text-base font-semibold text-gray-900">{formatCurrency(netDebt)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-sm text-gray-600">Plus: Cash & Equivalents</span>
              <span className="text-base font-semibold text-gray-900">{formatCurrency(cash)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-teal-50">
              <span className="font-semibold text-gray-900">Equals: Equity Value</span>
              <span className="text-xl font-bold text-teal-700">{formatCurrency(equityValues.mid)}</span>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation for All Estimates</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>Low: {formatCurrency(beforeValues.low)} - {formatCurrency(netDebt)} + {formatCurrency(cash)} = <strong>{formatCurrency(equityValues.low)}</strong></div>
            <div className="text-teal-700 font-semibold">
              Mid: {formatCurrency(beforeValues.mid)} - {formatCurrency(netDebt)} + {formatCurrency(cash)} = <strong>{formatCurrency(equityValues.mid)}</strong>
            </div>
            <div>High: {formatCurrency(beforeValues.high)} - {formatCurrency(netDebt)} + {formatCurrency(cash)} = <strong>{formatCurrency(equityValues.high)}</strong></div>
          </div>
        </div>

        {/* Results */}
        <ValueGrid
          low={equityValues.low}
          mid={equityValues.mid}
          high={equityValues.high}
          label="Equity Value (Before Range Methodology)"
          highlightMid={true}
        />

        {/* Explanation */}
        <div className="bg-teal-50 border border-teal-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Understanding the Difference</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Enterprise Value (EV):</strong> The total value of the company, including what's owed to all stakeholders 
              (equity holders, debt holders, etc.)
            </p>
            <p>
              <strong>Equity Value:</strong> The value attributable to shareholders only. This is what owners would receive 
              after paying off debt.
            </p>
            <p className="pt-2 border-t border-teal-200">
              <strong>Formula Breakdown:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Subtract debt because debt holders have a claim on the company before equity holders</li>
              <li>Add cash because it belongs to equity holders and can be distributed</li>
            </ul>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> In the next steps, we'll apply the final range methodology to determine 
            the Low/Mid/High estimates based on either multiple dispersion or confidence spreads.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

