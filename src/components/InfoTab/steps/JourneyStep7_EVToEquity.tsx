import { ArrowRightLeft } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type { ValuationResponse } from '../../../types/valuation';
import { getStepResultData } from '../../../utils/stepDataMapper';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { StepMetadata } from '../../shared/StepMetadata';
import { FormulaBox } from '../shared/FormulaBox';
import { StepCard } from '../shared/StepCard';
import { ValueGrid } from '../shared/ValueGrid';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep7Props {
  beforeValues: { low: number; mid: number; high: number };
  result: ValuationResponse;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep7_EVToEquity: React.FC<JourneyStep7Props> = ({ beforeValues, result }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep7_EVToEquity.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step7Data = getStepData(result, 7);
    const step7Result = getStepResultData(result, 7);
    
    stepLogger.info('JourneyStep7_EVToEquity mounted', {
      component: 'JourneyStep7_EVToEquity',
      step: 7,
      hasStepData: !!step7Data,
      hasStepResult: !!step7Result,
      hasCurrentData: !!result.current_year_data,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep7_EVToEquity unmounting', { step: 7 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step7Data = getStepData(result, 7);
  const step7Result = getStepResultData(result, 7);
  
  // Get debt and cash from current_year_data
  const totalDebt = result.current_year_data?.total_debt || 0;
  const cash = result.current_year_data?.cash || 0;
  const netDebt = totalDebt - cash;
  
  // Extract backend-specific data
  const operatingCash = step7Result?.operating_cash;
  const excessCash = step7Result?.excess_cash;

  // Calculate equity value
  // CRITICAL FIX: netDebt = totalDebt - cash, so formula is: EV - netDebt = EV - (totalDebt - cash) = EV - totalDebt + cash
  // This is correct: we subtract total debt and add cash back
  const equityValues = {
    low: beforeValues.low - netDebt,
    mid: beforeValues.mid - netDebt,
    high: beforeValues.high - netDebt
  };
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 7,
      hasStepData: !!step7Data,
      hasStepResult: !!step7Result,
      netDebt,
      equityMid: equityValues.mid
    });
    
    stepLogger.debug('JourneyStep7_EVToEquity rendered', {
      step: 7,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep7_EVToEquity.render', 'step');
  });

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
        {/* Step Metadata */}
        {step7Data && (
          <StepMetadata
            stepData={step7Data}
            stepNumber={7}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

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
            <div>Low: {formatCurrency(beforeValues.low)} - {formatCurrency(netDebt)} = <strong>{formatCurrency(equityValues.low)}</strong></div>
            <div className="text-teal-700 font-semibold">
              Mid: {formatCurrency(beforeValues.mid)} - {formatCurrency(netDebt)} = <strong>{formatCurrency(equityValues.mid)}</strong>
            </div>
            <div>High: {formatCurrency(beforeValues.high)} - {formatCurrency(netDebt)} = <strong>{formatCurrency(equityValues.high)}</strong></div>
            <div className="text-xs text-gray-600 pt-2 border-t border-blue-300">
              Note: Net Debt = {formatCurrency(totalDebt)} (Total Debt) - {formatCurrency(cash)} (Cash) = {formatCurrency(netDebt)}
            </div>
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

