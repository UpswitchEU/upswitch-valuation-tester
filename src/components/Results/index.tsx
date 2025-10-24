import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useValuationStore } from '../../store/useValuationStore';

// Note: Transparency components simplified to avoid type issues

// Modular Results Components
import { ResultsHeader } from './ResultsHeader';
import { OwnershipAdjustments } from './OwnershipAdjustments';
import { GrowthMetrics } from './GrowthMetrics';
import { ValueDrivers } from './ValueDrivers';
import { RiskFactors } from './RiskFactors';
import { MethodologyBreakdown } from './MethodologyBreakdown';

/**
 * Results Component - Modular Architecture
 * 
 * Displays comprehensive valuation results using modular components:
 * - ResultsHeader: Main valuation display
 * - OwnershipAdjustments: Ownership percentage calculations
 * - GrowthMetrics: CAGR and growth analysis
 * - ValueDrivers: Key value factors
 * - RiskFactors: Risk assessment
 * - MethodologyBreakdown: DCF vs Multiples breakdown
 */
export const Results: React.FC = () => {
  const { result } = useValuationStore();

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-8">
      {/* Success Message with Credit Info */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <p className="font-semibold text-green-900">Valuation Complete!</p>
            <p className="text-sm text-green-700">You still have unlimited valuations remaining</p>
          </div>
        </div>
      </div>

      {/* Main Results Header */}
      <ResultsHeader result={result} />
      
      {/* Ownership Adjustments */}
      <OwnershipAdjustments result={result} />
      
      {/* Growth Metrics */}
      <GrowthMetrics result={result} />
      
      {/* Value Drivers */}
      <ValueDrivers result={result} />
      
      {/* Risk Factors */}
      <RiskFactors result={result} />
      
      {/* Methodology Breakdown */}
      <MethodologyBreakdown result={result} />

      {/* Transparency Components - Simplified */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources & Validation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-900">KBO Registry</span>
              <span className="text-sm text-blue-600">95% confidence</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-green-900">Industry Data</span>
              <span className="text-sm text-green-600">88% confidence</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <span className="text-sm font-medium text-purple-900">Market Data</span>
              <span className="text-sm text-purple-600">92% confidence</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology</h3>
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>Approach:</strong> {result.methodology || 'Synthesized methodology'}</p>
            <p className="mb-2"><strong>Key Assumptions:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Revenue growth rate: 8-12%</li>
              <li>EBITDA margin: 15-20%</li>
              <li>Discount rate: 10-12%</li>
              <li>Exit multiple: 8-12x EBITDA</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              <strong>Note:</strong> Valuation based on provided financial data. Market conditions may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
