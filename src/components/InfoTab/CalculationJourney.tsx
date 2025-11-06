import React, { useState, useRef } from 'react';
import { JourneyNavigation } from './JourneyNavigation';
import { JourneyStep1_Inputs } from './steps/JourneyStep1_Inputs';
import { JourneyStep2_Benchmarking } from './steps/JourneyStep2_Benchmarking';
import { JourneyStep3_BaseEV } from './steps/JourneyStep3_BaseEV';
import { JourneyStep4_OwnerConcentration } from './steps/JourneyStep4_OwnerConcentration';
import { JourneyStep5_SizeDiscount } from './steps/JourneyStep5_SizeDiscount';
import { JourneyStep6_LiquidityDiscount } from './steps/JourneyStep6_LiquidityDiscount';
import { JourneyStep7_EVToEquity } from './steps/JourneyStep7_EVToEquity';
import { JourneyStep8_ConfidenceScore } from './steps/JourneyStep8_ConfidenceScore';
import { JourneyStep9_RangeMethodology } from './steps/JourneyStep9_RangeMethodology';
import { JourneyStep10_FinalValuation } from './steps/JourneyStep10_FinalValuation';
import type { ValuationResponse, ValuationInputData } from '../../types/valuation';

interface CalculationJourneyProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

export const CalculationJourney: React.FC<CalculationJourneyProps> = ({ result, inputData }) => {
  const [activeStep, setActiveStep] = useState('step-1-inputs');
  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Define all journey steps
  const steps = [
    { id: 'step-1-inputs', number: 1, title: 'Input Data & Business Profile', completed: true },
    { id: 'step-2-benchmarking', number: 2, title: 'Industry Benchmarking', completed: true },
    { id: 'step-3-base-ev', number: 3, title: 'Base Enterprise Value', completed: true },
    { id: 'step-4-owner', number: 4, title: 'Owner Concentration Adjustment', completed: true },
    { id: 'step-5-size', number: 5, title: 'Size Discount', completed: true },
    { id: 'step-6-liquidity', number: 6, title: 'Liquidity Discount', completed: true },
    { id: 'step-7-equity', number: 7, title: 'EV to Equity Conversion', completed: true },
    { id: 'step-8-confidence', number: 8, title: 'Confidence Score Analysis', completed: true },
    { id: 'step-9-range', number: 9, title: 'Range Methodology', completed: true },
    { id: 'step-10-final', number: 10, title: 'Final Valuation Range', completed: true }
  ];

  const handleStepClick = (stepId: string) => {
    setActiveStep(stepId);
    const element = stepRefs.current[stepId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calculate intermediate values for before/after comparisons
  const calculateIntermediateValues = () => {
    const multiples = result.multiples_valuation;
    const currentData = result.current_year_data;
    
    if (!multiples || !currentData) {
      return {
        step3: { low: 0, mid: 0, high: 0 },
        step4: { low: 0, mid: 0, high: 0 },
        step5: { low: 0, mid: 0, high: 0 },
        step6: { low: 0, mid: 0, high: 0 }
      };
    }

    const isPrimaryEBITDA = multiples.primary_multiple_method === 'ebitda_multiple';
    const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
    
    // Step 3: Base EV (unadjusted multiples)
    const baseMultiple_mid = isPrimaryEBITDA 
      ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple)
      : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple);
    
    const baseMultiple_low = isPrimaryEBITDA
      ? (multiples.p25_ebitda_multiple || baseMultiple_mid * 0.8)
      : (multiples.p25_revenue_multiple || baseMultiple_mid * 0.8);
      
    const baseMultiple_high = isPrimaryEBITDA
      ? (multiples.p75_ebitda_multiple || baseMultiple_mid * 1.2)
      : (multiples.p75_revenue_multiple || baseMultiple_mid * 1.2);

    const step3 = {
      low: primaryMetric * baseMultiple_low,
      mid: primaryMetric * baseMultiple_mid,
      high: primaryMetric * baseMultiple_high
    };

    // Step 4: After owner concentration adjustment
    const ownerAdjustment = multiples.owner_concentration?.adjustment_factor || 0;
    const step4 = {
      low: step3.low * (1 + ownerAdjustment),
      mid: step3.mid * (1 + ownerAdjustment),
      high: step3.high * (1 + ownerAdjustment)
    };

    // Step 5: After size discount
    const sizeDiscount = multiples.size_discount || 0;
    const step5 = {
      low: step4.low * (1 + sizeDiscount),
      mid: step4.mid * (1 + sizeDiscount),
      high: step4.high * (1 + sizeDiscount)
    };

    // Step 6: After liquidity discount
    const liquidityDiscount = multiples.liquidity_discount || 0;
    const step6 = {
      low: step5.low * (1 + liquidityDiscount),
      mid: step5.mid * (1 + liquidityDiscount),
      high: step5.high * (1 + liquidityDiscount)
    };

    return { step3, step4, step5, step6 };
  };

  const intermediateValues = calculateIntermediateValues();

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg p-4 sm:p-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Calculation Journey</h1>
          <p className="text-sm sm:text-base text-blue-100">
            Every step, formula, and calculation from initial inputs to final valuation - fully transparent and academically sourced
          </p>
        </div>

        {/* Navigation - Mobile horizontal (sticky), Desktop sidebar (sticky) */}
        <JourneyNavigation
          steps={steps}
          activeStep={activeStep}
          onStepClick={handleStepClick}
        />

        <div className="lg:flex lg:gap-6 p-4 sm:p-6">
          {/* Desktop: Sidebar spacer */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            {/* Empty spacer - the actual sidebar is sticky positioned */}
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <div ref={(el) => (stepRefs.current['step-1-inputs'] = el)}>
              <JourneyStep1_Inputs result={result} inputData={inputData} />
            </div>

            <div ref={(el) => (stepRefs.current['step-2-benchmarking'] = el)}>
              <JourneyStep2_Benchmarking result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-3-base-ev'] = el)}>
              <JourneyStep3_BaseEV result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-4-owner'] = el)}>
              <JourneyStep4_OwnerConcentration 
                result={result} 
                beforeValues={intermediateValues.step3}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-5-size'] = el)}>
              <JourneyStep5_SizeDiscount 
                result={result} 
                beforeValues={intermediateValues.step4}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-6-liquidity'] = el)}>
              <JourneyStep6_LiquidityDiscount 
                result={result} 
                beforeValues={intermediateValues.step5}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-7-equity'] = el)}>
              <JourneyStep7_EVToEquity 
                beforeValues={intermediateValues.step6}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-8-confidence'] = el)}>
              <JourneyStep8_ConfidenceScore result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-9-range'] = el)}>
              <JourneyStep9_RangeMethodology result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-10-final'] = el)}>
              <JourneyStep10_FinalValuation result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

