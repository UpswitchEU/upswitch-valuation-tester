import React from 'react';
import { useValuationStore } from '../../store/useValuationStore';

// Note: Transparency components simplified to avoid type issues

// Modular Results Components
import { ErrorBoundary } from '../ErrorBoundary';
import { CompetitiveComparison } from './CompetitiveComparison';
import { GrowthMetrics } from './GrowthMetrics';
import { MethodologyBreakdown } from './MethodologyBreakdown';
import { OwnerConcentrationAnalysis } from './OwnerConcentrationAnalysis';
import { OwnerConcentrationSummaryCard } from './OwnerConcentrationSummaryCard';
import { OwnershipAdjustments } from './OwnershipAdjustments';
import { ResultsHeader } from './ResultsHeader';
import { RiskFactors } from './RiskFactors';
import { ValuationWaterfall } from './ValuationWaterfall';
import { ValueDrivers } from './ValueDrivers';
// NEW: Phase 2 Main Report Enhancement Components
import { CalculationJourneyOverview } from './CalculationJourneyOverview';
import { AdjustmentsSummary } from './AdjustmentsSummary';
import { DataQualityConfidence } from './DataQualityConfidence';
// NEW: Multiple-First Discounting
import { MultipleWaterfall } from './MultipleWaterfall';

/**
 * Results Component - Modular Architecture
 * 
 * Displays comprehensive valuation results using modular components:
 * - ResultsHeader: Main valuation display
 * - ValuationWaterfall: Detailed step-by-step calculation breakdown
 * - OwnerConcentrationSummaryCard: Owner concentration risk summary
 * - OwnershipAdjustments: Ownership percentage calculations
 * - OwnerConcentrationAnalysis: Detailed owner concentration analysis
 * - MethodologyBreakdown: DCF vs Multiples breakdown
 * - GrowthMetrics: CAGR and growth analysis
 * - ValueDrivers: Key value factors
 * - RiskFactors: Risk assessment
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
      
      {/* Multiple Discount Waterfall - NEW: Multiple-First Discounting feature */}
      {result.multiple_pipeline && result.multiple_pipeline.stages && result.multiple_pipeline.stages.length > 0 && (
        <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading multiple waterfall</div>}>
          <MultipleWaterfall pipeline={result.multiple_pipeline} />
        </ErrorBoundary>
      )}
      
      {/* Valuation Calculation Waterfall - Detailed step-by-step breakdown */}
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading calculation breakdown</div>}>
        <ValuationWaterfall result={result} />
      </ErrorBoundary>
      
      {/* Owner Concentration Summary Card - Prominent display in main preview */}
      {result.multiples_valuation?.owner_concentration && (
        <ErrorBoundary fallback={<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">Error loading owner concentration summary</div>}>
          <OwnerConcentrationSummaryCard result={result} />
        </ErrorBoundary>
      )}
      
      {/* Ownership Adjustments */}
      <OwnershipAdjustments result={result} />
      
      {/* Owner Concentration Analysis (if applicable) - Detailed analysis */}
      {result.multiples_valuation?.owner_concentration && (
        <ErrorBoundary fallback={<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">Error loading owner concentration analysis</div>}>
          <OwnerConcentrationAnalysis result={result} />
        </ErrorBoundary>
      )}
      
      {/* NEW: 12-Step Calculation Journey Overview */}
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading calculation journey</div>}>
        <CalculationJourneyOverview result={result} />
      </ErrorBoundary>

      {/* NEW: Adjustments Summary */}
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading adjustments summary</div>}>
        <AdjustmentsSummary result={result} />
      </ErrorBoundary>

      {/* NEW: Data Quality & Confidence */}
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading data quality</div>}>
        <DataQualityConfidence result={result} />
      </ErrorBoundary>

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
      
      {/* TODO: Add back when components are created
      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading value chain validation</div>}>
        <ValueChainValidation result={result} />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading transparency report</div>}>
        <TransparencyReport result={result} />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading academic sources</div>}>
        <AcademicSources result={result} />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading review readiness</div>}>
        <ProfessionalReviewReadiness result={result} showBadge={false} />
      </ErrorBoundary>
      */}
      
      {/* Methodology & Data Sources */}
      <CompetitiveComparison result={result} />
    </div>
  );
};
