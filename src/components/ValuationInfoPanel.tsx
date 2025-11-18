import React from 'react';
import { CalculationJourney } from './InfoTab/CalculationJourney';
import type { ValuationResponse, ValuationInputData } from '../types/valuation';

// Import all Results components
import { ErrorBoundary } from './ErrorBoundary';
import { ResultsHeader } from './Results/ResultsHeader';
import { MultipleWaterfall } from './Results/MultipleWaterfall';
import { ValuationWaterfall } from './Results/ValuationWaterfall';
import { OwnerConcentrationSummaryCard } from './Results/OwnerConcentrationSummaryCard';
import { OwnershipAdjustments } from './Results/OwnershipAdjustments';
import { OwnerConcentrationAnalysis } from './Results/OwnerConcentrationAnalysis';
import { CalculationJourneyOverview } from './Results/CalculationJourneyOverview';
import { AdjustmentsSummary } from './Results/AdjustmentsSummary';
import { DataQualityConfidence } from './Results/DataQualityConfidence';
import { MethodologyBreakdown } from './Results/MethodologyBreakdown';
import { GrowthMetrics } from './Results/GrowthMetrics';
import { ValueDrivers } from './Results/ValueDrivers';
import { RiskFactors } from './Results/RiskFactors';
import { CompetitiveComparison } from './Results/CompetitiveComparison';

interface ValuationInfoPanelProps {
  result: ValuationResponse;
  inputData?: ValuationInputData | null;
}

/**
 * ValuationInfoPanel - Info Tab Content
 * 
 * Now displays all detailed report components that were previously in the main Results area.
 * This allows the main report area to show the Accountant View HTML report.
 */
export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = ({
  result,
  inputData
}) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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
        
        {/* Owner Concentration Summary Card - Prominent display */}
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
        
        {/* 12-Step Calculation Journey Overview */}
        <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading calculation journey</div>}>
          <CalculationJourneyOverview result={result} />
        </ErrorBoundary>

        {/* Adjustments Summary */}
        <ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">Error loading adjustments summary</div>}>
          <AdjustmentsSummary result={result} />
        </ErrorBoundary>

        {/* Data Quality & Confidence */}
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
        
        {/* Competitive Comparison */}
        <CompetitiveComparison result={result} />
        
        {/* Detailed Calculation Journey (from original info tab) */}
        <CalculationJourney 
          result={result} 
          inputData={inputData || null} 
        />
      </div>
    </div>
  );
};

