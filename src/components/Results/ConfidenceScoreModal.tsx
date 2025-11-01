import React, { useMemo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { ValuationResponse } from '../../types/valuation';
import { DocumentationModal } from '../ui/DocumentationModal';
import { ConfidenceFactor } from './ConfidenceFactor';
import { calculateConfidenceFactors } from './utils/weightExplanation';

interface ConfidenceScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ValuationResponse;
}

export const ConfidenceScoreModal: React.FC<ConfidenceScoreModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate confidence factors with memoization
  const confidenceFactors = useMemo(
    () => calculateConfidenceFactors(result),
    [result]
  );
  
  // Calculate overall confidence with safe fallback
  const overallConfidence = useMemo(() => {
    // Use backend confidence_score if available
    if (result.confidence_score !== undefined && result.confidence_score !== null) {
      return Math.max(0, Math.min(100, result.confidence_score));
    }
    
    // Fallback: Calculate from confidence factors with validation
    const factors = Object.values(confidenceFactors) as number[];
    const validFactors = factors.filter(f => isFinite(f) && f >= 0 && f <= 100);
    
    if (validFactors.length === 0) {
      return 50; // Default to medium confidence if no valid factors
    }
    
    const average = validFactors.reduce((a, b) => a + b, 0) / validFactors.length;
    return Math.max(0, Math.min(100, Math.round(average)));
  }, [result.confidence_score, confidenceFactors]);

  const content = (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Confidence Score</h3>
            <p className="text-sm text-gray-600">Overall assessment of valuation reliability</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {Math.max(0, Math.min(100, Math.round(overallConfidence)))}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overallConfidence >= 80 ? 'High' : overallConfidence >= 60 ? 'Moderate' : 'Low'} Confidence
            </p>
          </div>
        </div>
      </div>

      {/* Primary Factors Grid */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Primary Confidence Factors</h4>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Data Quality</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.data_quality}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-blue-500 h-2 rounded-full ${
                  prefersReducedMotion ? '' : 'transition-progress'
                }`}
                style={{ width: `${confidenceFactors.data_quality}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Methodology Agreement</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.methodology_agreement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-green-500 h-2 rounded-full ${
                  prefersReducedMotion ? '' : 'transition-progress'
                }`}
                style={{ width: `${confidenceFactors.methodology_agreement}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Industry Benchmarks</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.industry_benchmarks}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-yellow-500 h-2 rounded-full ${
                  prefersReducedMotion ? '' : 'transition-progress'
                }`}
                style={{ width: `${confidenceFactors.industry_benchmarks}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Company Profile</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.company_profile}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-purple-500 h-2 rounded-full ${
                  prefersReducedMotion ? '' : 'transition-progress'
                }`}
                style={{ width: `${confidenceFactors.company_profile}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Confidence Factors</h4>
        <div className="space-y-3">
          {[
            {
              name: "Data Quality",
              score: confidenceFactors.data_quality,
              description: "Completeness and accuracy of financial data provided",
              impact: (confidenceFactors.data_quality > 80 ? 'Strong' : confidenceFactors.data_quality > 60 ? 'Moderate' : 'Weak') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.data_quality < 80 ? 'Add complete financial statements for current year' : null
            },
            {
              name: "Historical Data",
              score: confidenceFactors.historical_data,
              description: "Years of historical financial data available",
              impact: (confidenceFactors.historical_data > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.historical_data < 80 ? 'Provide 3+ years of historical data' : null
            },
            {
              name: "Methodology Agreement",
              score: confidenceFactors.methodology_agreement,
              description: "How closely DCF and Multiples valuations agree",
              impact: (confidenceFactors.methodology_agreement > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.methodology_agreement < 70 ? 'Valuations differ significantly - consider additional data points' : null
            },
            {
              name: "Industry Benchmarks",
              score: confidenceFactors.industry_benchmarks,
              description: "Quality of comparable companies and market data",
              impact: (confidenceFactors.industry_benchmarks > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.industry_benchmarks < 80 ? 'Industry has limited comparable data - this is normal for niche markets' : null
            },
            {
              name: "Company Profile",
              score: confidenceFactors.company_profile,
              description: "Business stability, profitability, and growth characteristics",
              impact: (confidenceFactors.company_profile > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.company_profile < 80 ? 'Improve financial stability and profitability metrics' : null
            },
            {
              name: "Market Conditions",
              score: confidenceFactors.market_conditions,
              description: "Current market volatility and economic conditions",
              impact: (confidenceFactors.market_conditions > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null
            },
            {
              name: "Geographic Data",
              score: confidenceFactors.geographic_data,
              description: "Quality of country-specific market data",
              impact: (confidenceFactors.geographic_data > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null
            },
            {
              name: "Business Model Clarity",
              score: confidenceFactors.business_model_clarity,
              description: "How well business model fits valuation approach",
              impact: (confidenceFactors.business_model_clarity > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null
            }
          ].map((factor, index) => (
            <div
              key={factor.name}
              className={`animate-fade-in animate-stagger-${index + 1}`}
            >
              <ConfidenceFactor {...factor} />
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h5 className="font-medium text-blue-900 mb-2">💡 How to Improve Confidence Score</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          {confidenceFactors.data_quality < 80 && <li>• Add complete financial statements for current year</li>}
          {confidenceFactors.historical_data < 80 && <li>• Provide 3+ years of historical financial data</li>}
          {confidenceFactors.industry_benchmarks < 80 && <li>• Industry has limited comparable data - this is normal for niche markets</li>}
          {confidenceFactors.company_profile < 80 && <li>• Improve financial stability and profitability metrics</li>}
        </ul>
      </div>
    </div>
  );

  return (
    <DocumentationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confidence Score Breakdown"
      content={content}
    >
      {/* Modal content is passed as children prop to DocumentationModal */}
    </DocumentationModal>
  );
};

