import React from 'react';
import { Database, TrendingUp } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import type { ValuationInputData } from '../../../types/valuation';

interface JourneyStep1Props {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep1_Inputs: React.FC<JourneyStep1Props> = ({ result, inputData }) => {
  // Extract backend step data
  const step1Data = getStepData(result, 1);
  const step1Result = getStepResultData(result, 1);
  
  // Extract from backend or fallback to legacy
  const revenue = step1Result?.revenue || inputData?.revenue || result.current_year_data?.revenue || 0;
  const ebitda = step1Result?.ebitda || inputData?.ebitda || result.current_year_data?.ebitda || 0;
  const employees = inputData?.employees || 0;
  const ebitdaMargin = step1Result?.ebitda_margin || (revenue > 0 ? (ebitda / revenue) : 0);
  
  // Check for weighted metrics from backend
  const usingWeightedMetrics = step1Result?.using_weighted_metrics || false;
  const weightedRevenue = step1Result?.weighted_revenue;
  const weightedEbitda = step1Result?.weighted_ebitda;
  const weightedEbitdaMargin = step1Result?.weighted_ebitda_margin;

  return (
    <StepCard
      id="step-1-inputs"
      stepNumber={1}
      title="Input Data & Business Profile"
      subtitle="Raw data entered and business characteristics"
      icon={<Database className="w-5 h-5" />}
      color="blue"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step1Data && (
          <StepMetadata
            stepData={step1Data}
            stepNumber={1}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

        {/* Weighted Metrics Notice */}
        {usingWeightedMetrics && weightedRevenue && weightedEbitda && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Weighted Metrics Used</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              Using 3-year weighted average metrics per McKinsey Valuation standards (Year1×1/6 + Year2×2/6 + Year3×3/6)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-blue-200 rounded p-3">
                <div className="text-xs text-blue-600 mb-1">Weighted Revenue</div>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(weightedRevenue)}</div>
                <div className="text-xs text-gray-600 mt-1">
                  vs Current: {formatCurrency(revenue)}
                </div>
              </div>
              <div className="bg-white border border-blue-200 rounded p-3">
                <div className="text-xs text-blue-600 mb-1">Weighted EBITDA</div>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(weightedEbitda)}</div>
                <div className="text-xs text-gray-600 mt-1">
                  vs Current: {formatCurrency(ebitda)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              <strong>Formula:</strong> Weighted Metric = (Year1 × 1/6) + (Year2 × 2/6) + (Year3 × 3/6)
              <br />
              <strong>Source:</strong> McKinsey Valuation Handbook - Recent years weighted more heavily
            </div>
          </div>
        )}

        {/* Company Information */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Company Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Company Name</span>
                <span className="text-xs text-gray-500">User Input</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{result.company_name || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Industry</span>
                <span className="text-xs text-gray-500">User Selected</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{inputData?.industry || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Business Model</span>
                <span className="text-xs text-gray-500">User Selected</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{inputData?.business_model || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Country</span>
                <span className="text-xs text-gray-500">User Selected</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{inputData?.country_code || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Founded</span>
                <span className="text-xs text-gray-500">User Input</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{inputData?.founding_year || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Employees (FTE)</span>
                <span className="text-xs text-gray-500">User Input</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{employees}</p>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Financial Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Annual Revenue</span>
                <span className="text-xs text-blue-600 font-semibold">User Input</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(revenue)}</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">EBITDA</span>
                <span className="text-xs text-blue-600 font-semibold">User Input</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(ebitda)}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">EBITDA Margin</span>
                <span className="text-xs text-purple-600">Calculated</span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-1">{(ebitdaMargin * 100).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Formula: EBITDA / Revenue</p>
            </div>

            {result.financial_metrics?.revenue_cagr_3y !== undefined && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Growth Rate (CAGR)</span>
                  <span className="text-xs text-purple-600">Calculated</span>
                </div>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {(result.financial_metrics.revenue_cagr_3y * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">From historical data</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Quality Note */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900">
            <strong>Data Source:</strong> All inputs above are either provided by the user or calculated from user-provided data. 
            These form the foundation for all subsequent valuation calculations.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

