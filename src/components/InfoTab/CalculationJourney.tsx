import React, { useState, useRef, useEffect } from 'react';
import { JourneyNavigation } from './JourneyNavigation';
import { JourneyStep0_HistoricalTrends } from './steps/JourneyStep0_HistoricalTrends';
import { JourneyStep1_Inputs } from './steps/JourneyStep1_Inputs';
import { JourneyStep2_Benchmarking } from './steps/JourneyStep2_Benchmarking';
import { JourneyStep3_BaseEV } from './steps/JourneyStep3_BaseEV';
import { JourneyStep4_OwnerConcentration } from './steps/JourneyStep4_OwnerConcentration';
import { JourneyStep5_SizeDiscount } from './steps/JourneyStep5_SizeDiscount';
import { JourneyStep6_LiquidityDiscount } from './steps/JourneyStep6_LiquidityDiscount';
import { JourneyStep7_EVToEquity } from './steps/JourneyStep7_EVToEquity';
import { JourneyStep8_OwnershipAdjustment } from './steps/JourneyStep8_OwnershipAdjustment';
import { JourneyStep9_ConfidenceScore } from './steps/JourneyStep9_ConfidenceScore';
import { JourneyStep10_RangeMethodology } from './steps/JourneyStep10_RangeMethodology';
import { JourneyStep11_FinalValuation } from './steps/JourneyStep11_FinalValuation';
import type { ValuationResponse, ValuationInputData } from '../../types/valuation';
import { normalizeCalculationSteps } from '../../utils/calculationStepsNormalizer';
import { componentLogger, createPerformanceLogger } from '../../utils/logger';
import { getStepsSummary } from '../../utils/valuationDataExtractor';
import { 
  getStep3BaseEVResult, 
  getStep4OwnerConcentrationResult,
  getStep5SizeDiscountResult,
  getStep6LiquidityDiscountResult
} from '../../utils/stepDataMapper';

interface CalculationJourneyProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

// Constants for scroll spy configuration
const SCROLL_SPY_CONFIG = {
  // Intersection Observer options
  ROOT_MARGIN: '-20% 0px -60% 0px', // Trigger when section is in upper 20% of viewport
  THRESHOLDS: [0, 0.5, 1.0] as number[], // Reduced from 11 to 3 for performance
  RATIO_THRESHOLD: 0.1, // Minimum difference to prefer one section over another
  
  // Timing constants
  PROGRAMMATIC_SCROLL_TIMEOUT: 1500, // ms - time to block updates after programmatic scroll
  REF_INIT_DELAY: 50, // ms - delay before observing refs (reduced from 100ms)
} as const;

export const CalculationJourney: React.FC<CalculationJourneyProps> = ({ result, inputData }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('CalculationJourney.render', 'component'));
  const [activeStep, setActiveStep] = useState('step-1-inputs');
  const stepRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isScrollingProgrammatically = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Component mount logging
  useEffect(() => {
    const summary = getStepsSummary(result);
    
    componentLogger.info('CalculationJourney mounted', {
      component: 'CalculationJourney',
      hasResult: !!result,
      hasInputData: !!inputData,
      valuationId: result.valuation_id,
      totalSteps: summary.total,
      completedSteps: summary.completed,
      skippedSteps: summary.skipped,
      hasTransparency: !!result.transparency,
      hasModularSystem: !!result.modular_system,
      transparencyStepsCount: result.transparency?.calculation_steps 
        ? normalizeCalculationSteps(result.transparency.calculation_steps).length 
        : 0,
      modularSystemStepsCount: result.modular_system?.step_details?.length || 0
    });
    
    return () => {
      componentLogger.debug('CalculationJourney unmounting');
    };
  }, []); // Only on mount/unmount

  // Check if historical trend analysis should be shown
  const hasHistoricalData = result.historical_years_data && result.historical_years_data.length >= 1 && result.current_year_data;
  
  // Define all journey steps (dynamic based on available data)
  const steps = [
    ...(hasHistoricalData ? [{ id: 'step-0-trends', number: 0, title: 'Historical Trend Analysis', completed: true }] : []),
    { id: 'step-1-inputs', number: 1, title: 'Input Data & Business Profile', completed: true },
    { id: 'step-2-benchmarking', number: 2, title: 'Industry Benchmarking', completed: true },
    { id: 'step-3-base-ev', number: 3, title: 'Base Enterprise Value', completed: true },
    { id: 'step-4-owner', number: 4, title: 'Owner Concentration Adjustment', completed: true },
    { id: 'step-5-size', number: 5, title: 'Size Discount', completed: true },
    { id: 'step-6-liquidity', number: 6, title: 'Liquidity Discount', completed: true },
    { id: 'step-7-equity', number: 7, title: 'EV to Equity Conversion', completed: true },
    { id: 'step-8-ownership', number: 8, title: 'Ownership Adjustment', completed: true },
    { id: 'step-9-confidence', number: 9, title: 'Confidence Score Analysis', completed: true },
    { id: 'step-10-range', number: 10, title: 'Range Methodology', completed: true },
    { id: 'step-11-final', number: 11, title: 'Final Valuation Range', completed: true }
  ];

  const handleStepClick = (stepId: string) => {
    componentLogger.debug('Step clicked in CalculationJourney', {
      component: 'CalculationJourney',
      stepId,
      previousActiveStep: activeStep
    });
    
    setActiveStep(stepId);
    const element = stepRefs.current[stepId];
    if (element) {
      isScrollingProgrammatically.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Reset flag after scroll animation completes
      // Use longer timeout to account for slow scrolls
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, SCROLL_SPY_CONFIG.PROGRAMMATIC_SCROLL_TIMEOUT);
    }
  };

  // Scroll spy: Update active step based on viewport
  useEffect(() => {
    // Feature detection for IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported - scroll spy disabled');
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: SCROLL_SPY_CONFIG.ROOT_MARGIN,
      threshold: SCROLL_SPY_CONFIG.THRESHOLDS
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Don't update if we're programmatically scrolling
      if (isScrollingProgrammatically.current) {
        return;
      }

      // Use requestAnimationFrame to batch updates and improve performance
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        // Find all intersecting entries and determine which is most prominent
        const intersectingEntries = entries.filter(entry => entry.isIntersecting);
        
        if (intersectingEntries.length === 0) {
          return;
        }

        // Sort by intersection ratio (how much is visible) and position
        // Optimized: Only sort when necessary
        const sortedEntries = intersectingEntries.sort((a, b) => {
          // First, prefer entries with higher intersection ratio
          const ratioDiff = b.intersectionRatio - a.intersectionRatio;
          if (Math.abs(ratioDiff) > SCROLL_SPY_CONFIG.RATIO_THRESHOLD) {
            return ratioDiff;
          }
          // If ratios are similar, prefer the one closest to the top of the viewport
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

        const mostVisible = sortedEntries[0];
        if (mostVisible) {
          const stepId = mostVisible.target.getAttribute('data-step-id');
          if (stepId) {
            setActiveStep((currentStep) => {
              // Only update if different to avoid unnecessary re-renders
              return stepId !== currentStep ? stepId : currentStep;
            });
          }
        }
      });
    };

    try {
      observerRef.current = new IntersectionObserver(observerCallback, observerOptions);
    } catch (error) {
      console.error('Failed to create IntersectionObserver:', error);
      return;
    }

    const observer = observerRef.current;

    // Observe all step sections
    // Use a small delay to ensure refs are set, with retry mechanism
    let retryCount = 0;
    const MAX_RETRIES = 10; // Maximum retries to prevent infinite loop
    
    const observeRefs = () => {
      const refs = Object.values(stepRefs.current);
      const allRefsReady = refs.length === steps.length && refs.every(ref => ref !== null);
      
      if (allRefsReady) {
        refs.forEach((ref) => {
          if (ref) {
            observer.observe(ref);
          }
        });
      } else if (retryCount < MAX_RETRIES) {
        // Retry if refs aren't ready yet
        retryCount++;
        setTimeout(observeRefs, SCROLL_SPY_CONFIG.REF_INIT_DELAY);
      } else {
        console.warn('Scroll spy: Some refs not ready after max retries');
        // Still observe what we have
        refs.forEach((ref) => {
          if (ref) {
            observer.observe(ref);
          }
        });
      }
    };

    const timeoutId = setTimeout(observeRefs, SCROLL_SPY_CONFIG.REF_INIT_DELAY);

    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []); // Empty dependency array - set up once, refs are stable

  // Calculate intermediate values for before/after comparisons
  // CRITICAL FIX: Use extracted step data instead of recomputing to ensure consistency
  const calculateIntermediateValues = () => {
    const multiples = result.multiples_valuation;
    const currentData = result.current_year_data;
    
    if (!multiples || !currentData) {
      return {
        step3: { low: 0, mid: 0, high: 0 },
        step4: { low: 0, mid: 0, high: 0 },
        step5: { low: 0, mid: 0, high: 0 },
        step6: { low: 0, mid: 0, high: 0 },
        step7: { low: 0, mid: 0, high: 0 }, // Step 7: Equity values
        step8: { low: 0, mid: 0, high: 0 } // Step 8: Ownership-adjusted equity values
      };
    }

    // CRITICAL FIX: Extract Step 3 data using fixed extraction function (uses correct primary method detection)
    const step3Result = getStep3BaseEVResult(result);
    const step3 = step3Result ? {
      low: step3Result.enterprise_value_low || 0,
      mid: step3Result.enterprise_value_mid || 0,
      high: step3Result.enterprise_value_high || 0
    } : { low: 0, mid: 0, high: 0 };

    // CRITICAL FIX: Extract Step 4 data from transparency or legacy fields
    const step4Result = getStep4OwnerConcentrationResult(result);
    const step4 = step4Result && step4Result.enterprise_value_mid ? {
      low: step4Result.enterprise_value_low || step3.low,
      mid: step4Result.enterprise_value_mid || step3.mid,
      high: step4Result.enterprise_value_high || step3.high
    } : {
      // Fallback: Apply owner concentration adjustment if Step 4 data not available
      low: step3.low * (1 + (multiples.owner_concentration?.adjustment_factor || 0)),
      mid: step3.mid * (1 + (multiples.owner_concentration?.adjustment_factor || 0)),
      high: step3.high * (1 + (multiples.owner_concentration?.adjustment_factor || 0))
    };

    // CRITICAL FIX: Extract Step 5 data from transparency or legacy fields
    const step5Result = getStep5SizeDiscountResult(result);
    const step5 = step5Result && step5Result.enterprise_value_mid ? {
      low: step5Result.enterprise_value_low || step4.low,
      mid: step5Result.enterprise_value_mid || step4.mid,
      high: step5Result.enterprise_value_high || step4.high
    } : {
      // Fallback: Apply size discount if Step 5 data not available
      low: step4.low * (1 + (multiples.size_discount || 0)),
      mid: step4.mid * (1 + (multiples.size_discount || 0)),
      high: step4.high * (1 + (multiples.size_discount || 0))
    };

    // CRITICAL FIX: Extract Step 6 data from transparency or legacy fields
    const step6Result = getStep6LiquidityDiscountResult(result);
    const step6 = step6Result && step6Result.enterprise_value_mid ? {
      low: step6Result.enterprise_value_low || step5.low,
      mid: step6Result.enterprise_value_mid || step5.mid,
      high: step6Result.enterprise_value_high || step5.high
    } : {
      // Fallback: Apply liquidity discount if Step 6 data not available
      low: step5.low * (1 + (multiples.liquidity_discount || 0)),
      mid: step5.mid * (1 + (multiples.liquidity_discount || 0)),
      high: step5.high * (1 + (multiples.liquidity_discount || 0))
    };

    // Step 7: EV to Equity conversion (subtract net debt, add cash)
    const netDebt = (currentData.total_debt || 0) - (currentData.cash || 0);
    const step7 = {
      // CRITICAL FIX: Clamp to minimum 0 to handle negative equity gracefully
      // Negative equity can occur when debt exceeds enterprise value
      low: Math.max(0, step6.low - netDebt),
      mid: Math.max(0, step6.mid - netDebt),
      high: Math.max(0, step6.high - netDebt)
    };
    
    // Step 8: Ownership adjustment (control premium / minority discount)
    const normalizedSteps = result.transparency?.calculation_steps 
      ? normalizeCalculationSteps(result.transparency.calculation_steps)
      : [];
    const step8Data = normalizedSteps.find((step: any) => step.step_number === 8);
    const sharesForSale = step8Data?.outputs?.ownership_percentage || step8Data?.inputs?.shares_for_sale || 100;
    const ownershipPercentage = sharesForSale / 100.0;
    
    // Get adjustment from calculation_steps if available
    const adjustmentPercentage = step8Data?.outputs?.adjustment_percentage || 0;
    const adjustmentFactor = 1.0 + (adjustmentPercentage / 100.0);
    
    const step8 = {
      low: step7.low * ownershipPercentage * adjustmentFactor,
      mid: step7.mid * ownershipPercentage * adjustmentFactor,
      high: step7.high * ownershipPercentage * adjustmentFactor
    };
    
    // Log warning if equity would be negative (indicates high debt scenario)
    if (step6.mid - netDebt < 0) {
      console.warn('[VALUATION-AUDIT] Negative equity detected, clamped to 0', {
        step6_mid: step6.mid,
        netDebt,
        calculated_equity: step6.mid - netDebt,
        note: 'Equity value clamped to 0. This indicates debt exceeds enterprise value.'
      });
    }

    // DIAGNOSTIC: Log Step 7 calculation details
    console.log('[DIAGNOSTIC] Step 7 calculation', {
      step6_mid: step6.mid,
      netDebt,
      calculated_step7_mid: step7.mid,
      formula: `${step6.mid} - ${netDebt} = ${step7.mid}`
    });

    // CRITICAL VALIDATION: Ensure Step 7 matches backend adjusted_equity_value
    // Only override if backend value is truly authoritative and difference is significant
    const backendAdjustedEquity = multiples.adjusted_equity_value;
    if (backendAdjustedEquity && backendAdjustedEquity > 0) {
      const tolerance = Math.max(backendAdjustedEquity * 0.01, 100); // 1% or €100
      const difference = Math.abs(step7.mid - backendAdjustedEquity);
      const percentageDiff = (difference / backendAdjustedEquity) * 100;
      
      console.log('[DIAGNOSTIC] Step 7 validation check', {
        calculated_step7_mid: step7.mid,
        backend_adjusted_equity: backendAdjustedEquity,
        difference,
        tolerance,
        percentageDiff: percentageDiff.toFixed(2) + '%',
        withinTolerance: difference <= tolerance
      });
      
      if (difference > tolerance) {
        console.warn(
          '[VALUATION-AUDIT] Info tab Step 7 mismatch with backend adjusted_equity_value',
          {
            calculated: step7.mid,
            backend: backendAdjustedEquity,
            difference,
            tolerance,
            percentageDiff: percentageDiff.toFixed(2) + '%',
            calculation_breakdown: {
              step3_mid: step3.mid,
              step4_mid: step4.mid,
              step5_mid: step5.mid,
              step6_mid: step6.mid,
              netDebt,
              calculated_step7: step7.mid,
              backend_value: backendAdjustedEquity
            },
            note: 'Frontend calculation may differ due to rounding or sequential application differences. Using backend value as authoritative source.'
          }
        );
        // Use backend value as authoritative source, but scale all values proportionally
        // CRITICAL FIX: Guard against division by zero
        const ratio = step7.mid > 0 ? backendAdjustedEquity / step7.mid : 1;
        const adjustedStep7 = {
          low: step7.low * ratio,
          mid: backendAdjustedEquity, // Use backend as source of truth
          high: step7.high * ratio
        };
        
        console.log('[DIAGNOSTIC] Step 7 adjusted to match backend', {
          original_step7: step7,
          adjusted_step7: adjustedStep7,
          ratio,
          note: 'All values scaled proportionally to match backend adjusted_equity_value'
        });
        
        // Recalculate Step 8 with adjusted Step 7
        const adjustedStep8 = {
          low: adjustedStep7.low * ownershipPercentage * adjustmentFactor,
          mid: adjustedStep7.mid * ownershipPercentage * adjustmentFactor,
          high: adjustedStep7.high * ownershipPercentage * adjustmentFactor
        };
        
        return {
          step3,
          step4,
          step5,
          step6,
          step7: adjustedStep7,
          step8: adjustedStep8
        };
      } else {
        console.log('[DIAGNOSTIC] Step 7 matches backend within tolerance', {
          calculated: step7.mid,
          backend: backendAdjustedEquity,
          difference,
          tolerance
        });
      }
    } else {
      console.warn('[DIAGNOSTIC] Backend adjusted_equity_value not available', {
        backendAdjustedEquity,
        using_calculated_step7: step7.mid
      });
    }

    return { step3, step4, step5, step6, step7, step8 };
  };

  const intermediateValues = calculateIntermediateValues();

  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      activeStep,
      stepsCount: steps.length,
      hasIntermediateValues: !!intermediateValues.step7
    });
    
    componentLogger.debug('CalculationJourney rendered', {
      component: 'CalculationJourney',
      renderTime: Math.round(renderTime * 100) / 100,
      activeStep,
      stepsCount: steps.length
    });
    
    // Reset performance logger for next render
    renderPerfLogger.current = createPerformanceLogger('CalculationJourney.render', 'component');
  });

  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Calculation Journey</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Step-by-step breakdown of the valuation calculation
          </p>
        </div>

        {/* Mobile: Horizontal sticky navigation above content */}
        <div className="lg:hidden">
          <JourneyNavigation
            steps={steps}
            activeStep={activeStep}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="lg:flex lg:gap-6 p-4 sm:p-6">
          {/* Desktop: Sidebar Navigation - Sticky within CalculationJourney section */}
          {/* Sidebar only becomes sticky when scrolling within this CalculationJourney container */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <JourneyNavigation
              steps={steps}
              activeStep={activeStep}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Step 0: Historical Trend Analysis (if data available) */}
            {hasHistoricalData && (
              <div ref={(el) => (stepRefs.current['step-0-trends'] = el)} data-step-id="step-0-trends">
                <JourneyStep0_HistoricalTrends result={result} />
              </div>
            )}

            <div ref={(el) => (stepRefs.current['step-1-inputs'] = el)} data-step-id="step-1-inputs">
              <JourneyStep1_Inputs result={result} inputData={inputData} />
            </div>

            <div ref={(el) => (stepRefs.current['step-2-benchmarking'] = el)} data-step-id="step-2-benchmarking">
              <JourneyStep2_Benchmarking result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-3-base-ev'] = el)} data-step-id="step-3-base-ev">
              <JourneyStep3_BaseEV result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-4-owner'] = el)} data-step-id="step-4-owner">
              <JourneyStep4_OwnerConcentration 
                result={result} 
                beforeValues={intermediateValues.step3}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-5-size'] = el)} data-step-id="step-5-size">
              <JourneyStep5_SizeDiscount 
                result={result} 
                beforeValues={intermediateValues.step4}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-6-liquidity'] = el)} data-step-id="step-6-liquidity">
              <JourneyStep6_LiquidityDiscount 
                result={result} 
                beforeValues={intermediateValues.step5}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-7-equity'] = el)} data-step-id="step-7-equity">
              <JourneyStep7_EVToEquity 
                beforeValues={intermediateValues.step6}
                result={result}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-8-ownership'] = el)} data-step-id="step-8-ownership">
              <JourneyStep8_OwnershipAdjustment 
                result={result}
                beforeValues={intermediateValues.step7}
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-9-confidence'] = el)} data-step-id="step-9-confidence">
              <JourneyStep9_ConfidenceScore result={result} />
            </div>

            <div ref={(el) => (stepRefs.current['step-10-range'] = el)} data-step-id="step-10-range">
              <JourneyStep10_RangeMethodology 
                result={result} 
                beforeValues={intermediateValues.step8 || intermediateValues.step7} // Use Step 8 (ownership-adjusted) if available, fallback to Step 7
              />
            </div>

            <div ref={(el) => (stepRefs.current['step-11-final'] = el)} data-step-id="step-11-final">
              <JourneyStep11_FinalValuation result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

