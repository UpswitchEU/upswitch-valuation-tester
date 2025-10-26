import React from 'react';
import { useValuationStore } from '../../store/useValuationStore';

// Note: Transparency components simplified to avoid type issues

// Modular Results Components
import { ResultsHeader } from './ResultsHeader';
import { OwnershipAdjustments } from './OwnershipAdjustments';
import { GrowthMetrics } from './GrowthMetrics';
import { ValueDrivers } from './ValueDrivers';
import { RiskFactors } from './RiskFactors';
import { MethodologyBreakdown } from './MethodologyBreakdown';
import { CompetitiveComparison } from './CompetitiveComparison';

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
      {/* Success banner removed - report preview shows completion status */}

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
      
      {/* Methodology Breakdown - Enhanced with transparency */}
      <MethodologyBreakdown result={result} />
      
      {/* Competitive Comparison */}
      <CompetitiveComparison />
    </div>
  );
};
