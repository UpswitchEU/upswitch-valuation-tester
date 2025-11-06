import React from 'react';
import { Database } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';
import type { ValuationInputData } from '../../../types/valuation';

interface JourneyStep1Props {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep1_Inputs: React.FC<JourneyStep1Props> = ({ result, inputData }) => {
  const revenue = inputData?.revenue || result.current_year_data?.revenue || 0;
  const ebitda = inputData?.ebitda || result.current_year_data?.ebitda || 0;
  const employees = inputData?.employees || 0;
  const ebitdaMargin = revenue > 0 ? (ebitda / revenue) : 0;

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

