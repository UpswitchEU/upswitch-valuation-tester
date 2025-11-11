import React, { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { FormulaBox } from '../shared/FormulaBox';
import { BeforeAfterTable } from '../shared/BeforeAfterTable';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep4Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

export const JourneyStep4_OwnerConcentration: React.FC<JourneyStep4Props> = ({ result, beforeValues }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep4_OwnerConcentration.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step4Data = getStepData(result, 4);
    const step4Result = getStepResultData(result, 4);
    
    stepLogger.info('JourneyStep4_OwnerConcentration mounted', {
      component: 'JourneyStep4_OwnerConcentration',
      step: 4,
      hasStepData: !!step4Data,
      hasStepResult: !!step4Result,
      hasOwnerConcentration: !!result.multiples_valuation?.owner_concentration,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep4_OwnerConcentration unmounting', { step: 4 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step4Data = getStepData(result, 4);
  const step4Result = getStepResultData(result, 4);
  
  const ownerConc = result.multiples_valuation?.owner_concentration;
  
  // Extract backend-specific data
  const ratio = step4Result?.owner_employee_ratio;
  const tier = step4Result?.tier;
  const calibrationType = step4Result?.calibration_type;
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 4,
      hasStepData: !!step4Data,
      hasStepResult: !!step4Result,
      hasOwnerConcentration: !!ownerConc,
      adjustmentFactor: ownerConc?.adjustment_factor || 0
    });
    
    stepLogger.debug('JourneyStep4_OwnerConcentration rendered', {
      step: 4,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep4_OwnerConcentration.render', 'step');
  });
  
  if (!ownerConc || ownerConc.adjustment_factor === 0) {
    // Skip this step if no owner concentration adjustment
    return (
      <StepCard
        id="step-4-owner"
        stepNumber={4}
        title="Owner Concentration Adjustment"
        subtitle="No adjustment applied (sufficient non-owner employees)"
        icon={<Users className="w-5 h-5" />}
        color="orange"
        defaultExpanded={false}
      >
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            No owner concentration adjustment was applied because the business has sufficient non-owner employees, 
            indicating low key person risk.
          </p>
        </div>
      </StepCard>
    );
  }

  const adjustmentFactor = ownerConc.adjustment_factor;
  const afterValues = {
    low: beforeValues.low * (1 + adjustmentFactor),
    mid: beforeValues.mid * (1 + adjustmentFactor),
    high: beforeValues.high * (1 + adjustmentFactor)
  };

  const isFullyOwnerOperated = ownerConc.number_of_employees === 0;
  const riskLevel = ownerConc.risk_level || 'UNKNOWN';

  return (
    <StepCard
      id="step-4-owner"
      stepNumber={4}
      title="Owner Concentration Adjustment"
      subtitle={`${riskLevel} Key Person Risk - ${(adjustmentFactor * 100).toFixed(0)}% Adjustment`}
      icon={<Users className="w-5 h-5" />}
      color="orange"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step4Data && (
          <StepMetadata
            stepData={step4Data}
            stepNumber={4}
            showExecutionTime={true}
            showStatus={true}
            calibrationType={calibrationType}
          />
        )}

        {/* Critical Warning for 100% owner-operated */}
        {isFullyOwnerOperated && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚠️</span>
              <h4 className="font-bold text-red-900">CRITICAL: 100% Owner-Operated Business</h4>
            </div>
            <p className="text-sm text-red-800">
              This business has <strong>0 non-owner employees</strong>, meaning it's entirely dependent on the owners. 
              This represents maximum key person risk and significantly impacts valuation.
            </p>
          </div>
        )}

        {/* Formula */}
        <FormulaBox
          formula="Owners / Employees = Ratio → Adjustment %"
          description="Higher owner-to-employee ratios indicate greater key person dependency"
        />

        {/* Risk Assessment */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <span className="text-sm text-gray-600">Active Owner-Managers</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{ownerConc.number_of_owners}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <span className="text-sm text-gray-600">FTE Employees</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{ownerConc.number_of_employees}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
              <span className="text-sm text-gray-600">Owner/Employee Ratio</span>
              <p className="text-2xl font-bold text-orange-700 mt-1">
                {isFullyOwnerOperated ? '100%' : `${(ownerConc.ratio * 100).toFixed(0)}%`}
              </p>
              {isFullyOwnerOperated && (
                <p className="text-xs text-orange-600 mt-1">Fully owner-operated</p>
              )}
            </div>
            <div className={`border-2 rounded-lg p-3 ${
              riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-500' :
              riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-500' :
              riskLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
              'bg-green-50 border-green-500'
            }`}>
              <span className="text-sm text-gray-600">Risk Level</span>
              <p className={`text-2xl font-bold mt-1 ${
                riskLevel === 'CRITICAL' ? 'text-red-700' :
                riskLevel === 'HIGH' ? 'text-orange-700' :
                riskLevel === 'MEDIUM' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {riskLevel}
              </p>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Adjustment Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>
              {isFullyOwnerOperated 
                ? `${ownerConc.number_of_owners} owners / 0 employees = 100% ratio`
                : `${ownerConc.number_of_owners} owners / ${ownerConc.number_of_employees} employees = ${(ownerConc.ratio * 100).toFixed(0)}% ratio`
              }
            </div>
            <div>Risk Level: <strong>{riskLevel}</strong> → Adjustment: <strong className="text-orange-600">{(adjustmentFactor * 100).toFixed(0)}%</strong></div>
            <div className="pt-2 border-t border-blue-300">
              Formula: Enterprise Value × (1 + {(adjustmentFactor * 100).toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <BeforeAfterTable
          before={beforeValues}
          after={afterValues}
          adjustmentLabel="Owner Concentration Adjustment"
          adjustmentPercent={adjustmentFactor}
        />

        {/* Explanation */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <p className="text-sm text-orange-900">
            <strong>Academic Source:</strong> This adjustment reflects key person risk - the dependency on specific individuals 
            for business operations and success. Research shows businesses with high owner concentration trade at 15-25% discounts 
            (Damodaran, 2018; PwC Valuation Guidelines).
          </p>
        </div>
      </div>
    </StepCard>
  );
};

