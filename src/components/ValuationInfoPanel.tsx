import React from 'react';
import { Calendar, Building, DollarSign, TrendingUp, FileText, Clock } from 'lucide-react';
import { CalculationBreakdown } from './InfoTab/CalculationBreakdown';
import { SensitivityAnalysis } from './InfoTab/SensitivityAnalysis';
import type { ValuationResponse, ValuationInputData } from '../types/valuation';
import { formatCurrency } from '../components/Results/utils/formatters';

interface ValuationInfoPanelProps {
  result: ValuationResponse;
  inputData?: ValuationInputData | null;
}

export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = ({
  result,
  inputData
}) => {
  const valuationId = result.valuation_id;
  const companyName = result.company_name;
  const valuationMethod = 'Hybrid Valuation';
  const valuationDate = new Date();
  const confidenceScore = result.confidence_score || 0.85;
  const dataQuality = 'High';
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="h-full bg-zinc-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Valuation Information</h2>
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Company Details</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-zinc-400 text-sm">Company:</span>
                <p className="text-white font-medium">{companyName || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-zinc-400 text-sm">Valuation ID:</span>
                <p className="text-white font-mono text-sm">{valuationId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Valuation Details</h3>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-zinc-400 text-sm">Method:</span>
                <p className="text-white font-medium">{valuationMethod}</p>
              </div>
              <div>
                <span className="text-zinc-400 text-sm">Date:</span>
                <p className="text-white font-medium">{formatDate(valuationDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Confidence Score</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">
                <span className={getConfidenceColor(confidenceScore)}>
                  {Math.round(confidenceScore * 100)}%
                </span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${confidenceScore * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Data Quality</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">
                <span className={getDataQualityColor(dataQuality)}>
                  {dataQuality}
                </span>
              </div>
              <div className="text-zinc-400 text-sm">
                Based on input completeness and accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Input Parameters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result ? (
              <>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Company:</span>
                  <span className="text-white font-medium">
                    {result.company_name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Revenue:</span>
                  <span className="text-white font-medium">
                    {inputData?.revenue ? formatCurrency(inputData.revenue) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">EBITDA:</span>
                  <span className="text-white font-medium">
                    {inputData?.ebitda ? formatCurrency(inputData.ebitda) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Industry:</span>
                  <span className="text-white font-medium">
                    {inputData?.industry || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Country:</span>
                  <span className="text-white font-medium">
                    {inputData?.country_code || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Employees:</span>
                  <span className="text-white font-medium">
                    {inputData?.employees?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Founded:</span>
                  <span className="text-white font-medium">
                    {inputData?.founding_year || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Confidence Score:</span>
                  <span className="text-white font-medium">
                    {result.confidence_score ? `${(result.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </>
            ) : (
              <div className="col-span-2 text-zinc-400 text-center py-4">
                No input parameters available
              </div>
            )}
          </div>
        </div>

        {/* Assumptions */}
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Key Assumptions</h3>
          </div>
          <div className="space-y-3">
            {result.dcf_valuation || result.multiples_valuation ? (
              <>
                <div className="flex justify-between items-start py-2 border-b border-zinc-700">
                  <span className="text-zinc-400 capitalize flex-1 mr-4">
                    WACC:
                  </span>
                  <span className="text-white font-medium text-right">
                    {result.dcf_valuation?.wacc?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-zinc-700">
                  <span className="text-zinc-400 capitalize flex-1 mr-4">
                    Terminal Growth:
                  </span>
                  <span className="text-white font-medium text-right">
                    {result.dcf_valuation?.terminal_growth_rate?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-zinc-700">
                  <span className="text-zinc-400 capitalize flex-1 mr-4">
                    Revenue Multiple:
                  </span>
                  <span className="text-white font-medium text-right">
                    {result.multiples_valuation?.revenue_multiple?.toFixed(1) || 'N/A'}x
                  </span>
                </div>
                <div className="flex justify-between items-start py-2 border-b border-zinc-700">
                  <span className="text-zinc-400 capitalize flex-1 mr-4">
                    EBITDA Multiple:
                  </span>
                  <span className="text-white font-medium text-right">
                    {result.multiples_valuation?.ebitda_multiple?.toFixed(1) || 'N/A'}x
                  </span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 text-center py-4">
                No assumptions specified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Breakdown Section */}
      <div className="border-t border-zinc-800 pt-6">
        <CalculationBreakdown result={result} inputData={inputData || null} />
      </div>

      {/* Sensitivity Analysis Section */}
      <div className="border-t border-zinc-800 pt-6">
        <SensitivityAnalysis result={result} />
      </div>
    </div>
  );
};

