import React from 'react';
import { useValuationStore } from '../../store/useValuationStore';

// Note: Transparency components simplified to avoid type issues

// Modular Results Components
import { ErrorBoundary } from '../ErrorBoundary';
import { CompetitiveComparison } from './CompetitiveComparison';
import { GrowthMetrics } from './GrowthMetrics';
import { MethodologyBreakdown } from './MethodologyBreakdown';
import { OwnershipAdjustments } from './OwnershipAdjustments';
import { ResultsHeader } from './ResultsHeader';
import { RiskFactors } from './RiskFactors';
import { ValueDrivers } from './ValueDrivers';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Main Results Header */}
      <ResultsHeader result={result} />
      
      {/* Ownership Adjustments */}
      <OwnershipAdjustments result={result} />
      
      {/* Methodology Breakdown - Enhanced with transparency */}
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading methodology breakdown</div>}>
        <MethodologyBreakdown result={result} />
      </ErrorBoundary>
      
      {/* Growth Metrics */}
      <GrowthMetrics result={result} />
      
      {/* Value Drivers */}
      <ValueDrivers result={result} />
      
      {/* Risk Factors */}
      <RiskFactors result={result} />
      
      {/* Methodology & Data Sources */}
      <CompetitiveComparison />
    </div>
  );
};
