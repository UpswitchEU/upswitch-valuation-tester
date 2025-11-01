import React, { useMemo, useState } from 'react';
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
  const [showEducationalContent, setShowEducationalContent] = useState(false);
  
  // Detect data source: backend vs frontend fallback
  const resultAny = result as any;
  const isUsingBackendData = !!resultAny.transparency?.confidence_factors || !!resultAny.transparency?.confidence_breakdown;
  const hasEstimatedFactors = !isUsingBackendData; // Frontend fallback uses some hardcoded estimates
  
  // Calculate confidence factors with memoization
  const confidenceFactors = useMemo(
    () => calculateConfidenceFactors(result),
    [result]
  );
  
  // Identify which factors are estimates (hardcoded in fallback)
  const estimatedFactors = useMemo(() => {
    if (isUsingBackendData) return new Set<string>();
    // These are hardcoded in weightExplanation.ts fallback
    return new Set(['market_conditions', 'geographic_data', 'business_model_clarity']);
  }, [isUsingBackendData]);
  
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
    
    // NOTE: Backend uses weighted average, frontend fallback uses simple average
    // This is documented as an approximation
    const average = validFactors.reduce((a, b) => a + b, 0) / validFactors.length;
    return Math.max(0, Math.min(100, Math.round(average)));
  }, [result.confidence_score, confidenceFactors]);

  const content = (
    <div className="space-y-6">
      {/* Data Source Transparency Indicator */}
      {hasEstimatedFactors && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">Calculated Confidence Factors</p>
              <p className="text-sm text-yellow-800">
                Confidence factors are calculated from available data. Some factors (Market Conditions, Geographic Data, Business Model Clarity) use default estimates. 
                For more accurate breakdown with actual market data and business model analysis, ensure complete financial data is provided to enable backend calculation.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isUsingBackendData && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">Backend Confidence Analysis</p>
              <p className="text-sm text-green-800">
                Confidence factors calculated using comprehensive backend analysis with market data, industry benchmarks, and business model assessment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Confidence Score</h3>
            <p className="text-sm text-gray-600">Overall assessment of valuation reliability based on data quality and market conditions</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {Math.max(0, Math.min(100, Math.round(overallConfidence)))}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overallConfidence >= 80 ? 'High' : overallConfidence >= 60 ? 'Moderate' : 'Low'} Confidence
            </p>
            {hasEstimatedFactors && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">(Estimated)</p>
            )}
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
              <span className="text-sm font-semibold text-gray-900">
                {confidenceFactors.data_quality}%
                {estimatedFactors.has('data_quality') && (
                  <span className="ml-1 text-xs text-yellow-600 font-normal">(Est.)</span>
                )}
              </span>
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
              <span className="text-sm font-semibold text-gray-900">
                {confidenceFactors.methodology_agreement}%
                {estimatedFactors.has('methodology_agreement') && (
                  <span className="ml-1 text-xs text-yellow-600 font-normal">(Est.)</span>
                )}
              </span>
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
              <span className="text-sm font-semibold text-gray-900">
                {confidenceFactors.industry_benchmarks}%
                {estimatedFactors.has('industry_benchmarks') && (
                  <span className="ml-1 text-xs text-yellow-600 font-normal">(Est.)</span>
                )}
              </span>
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
              <span className="text-sm font-semibold text-gray-900">
                {confidenceFactors.company_profile}%
                {estimatedFactors.has('company_profile') && (
                  <span className="ml-1 text-xs text-yellow-600 font-normal">(Est.)</span>
                )}
              </span>
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
              description: "Completeness and accuracy of financial data provided. Higher scores (80%+) indicate complete financial statements, audited data, and comprehensive historical records. Lower scores suggest missing or incomplete financial information.",
              impact: (confidenceFactors.data_quality > 80 ? 'Strong' : confidenceFactors.data_quality > 60 ? 'Moderate' : 'Weak') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.data_quality < 80 ? 'Add complete financial statements (income statement, balance sheet, cash flow) for current year' : null,
              isEstimated: estimatedFactors.has('data_quality')
            },
            {
              name: "Historical Data",
              score: confidenceFactors.historical_data,
              description: "Years of historical financial data available for analysis. Provides trend analysis and growth pattern validation. 3+ years of data typically yields 80%+ confidence.",
              impact: (confidenceFactors.historical_data > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.historical_data < 80 ? 'Provide 3+ years of historical financial data including revenue, EBITDA, and key financial metrics' : null,
              isEstimated: estimatedFactors.has('historical_data')
            },
            {
              name: "Methodology Agreement",
              score: confidenceFactors.methodology_agreement,
              description: "How closely DCF and Multiples valuations agree. Agreement within 20% variance indicates high confidence (>80%). Disagreement >50% suggests valuation uncertainty requiring additional data points.",
              impact: (confidenceFactors.methodology_agreement > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.methodology_agreement < 70 ? 'Valuations differ significantly - consider providing additional financial metrics, market data, or comparable company information' : null,
              isEstimated: estimatedFactors.has('methodology_agreement')
            },
            {
              name: "Industry Benchmarks",
              score: confidenceFactors.industry_benchmarks,
              description: "Quality and quantity of comparable companies and market data available. 10+ high-quality comparables typically yield 80%+ confidence. Limited comparables (<5) reduce confidence for niche markets.",
              impact: (confidenceFactors.industry_benchmarks > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.industry_benchmarks < 80 ? 'Industry has limited comparable data - this is normal for niche markets. Consider providing additional industry-specific metrics or benchmarks' : null,
              isEstimated: estimatedFactors.has('industry_benchmarks')
            },
            {
              name: "Company Profile",
              score: confidenceFactors.company_profile,
              description: "Business stability, profitability, and growth characteristics. Assesses financial health score, revenue growth trajectory, EBITDA margins, and operational maturity. Higher scores indicate established, profitable operations.",
              impact: (confidenceFactors.company_profile > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: confidenceFactors.company_profile < 80 ? 'Improve financial stability (positive cash flow, manageable debt levels) and profitability metrics (EBITDA margin >15% typical for SMEs)' : null,
              isEstimated: estimatedFactors.has('company_profile')
            },
            {
              name: "Market Conditions",
              score: confidenceFactors.market_conditions,
              description: "Current market volatility and economic conditions affecting valuation. Factors include market risk premium, economic uncertainty, and sector-specific trends. Higher scores indicate stable market conditions with predictable patterns.",
              impact: (confidenceFactors.market_conditions > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null,
              isEstimated: estimatedFactors.has('market_conditions')
            },
            {
              name: "Geographic Data",
              score: confidenceFactors.geographic_data,
              description: "Quality of country-specific market data, regulatory environment, and economic indicators. European markets (EU/EEA) typically have 80%+ data availability. Emerging markets may have lower data quality scores.",
              impact: (confidenceFactors.geographic_data > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null,
              isEstimated: estimatedFactors.has('geographic_data')
            },
            {
              name: "Business Model Clarity",
              score: confidenceFactors.business_model_clarity,
              description: "How well business model fits standard valuation approaches (DCF, Multiples). Clear B2B SaaS models score higher (85%+), while complex multi-business entities may score lower. Higher scores enable more reliable cash flow projections.",
              impact: (confidenceFactors.business_model_clarity > 80 ? 'Strong' : 'Moderate') as 'Strong' | 'Moderate' | 'Weak',
              improvement: null,
              isEstimated: estimatedFactors.has('business_model_clarity')
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
          {confidenceFactors.data_quality < 80 && <li>• Add complete financial statements (income statement, balance sheet, cash flow) for current year</li>}
          {confidenceFactors.historical_data < 80 && <li>• Provide 3+ years of historical financial data including revenue, EBITDA, and key metrics</li>}
          {confidenceFactors.industry_benchmarks < 80 && <li>• Industry has limited comparable data - this is normal for niche markets. Consider providing additional industry-specific benchmarks</li>}
          {confidenceFactors.company_profile < 80 && <li>• Improve financial stability (positive cash flow, manageable debt) and profitability metrics (target EBITDA margin {'>'}15% for SMEs)</li>}
        </ul>
      </div>

      {/* Methodology Explanation */}
      <div className="mt-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 p-4 sm:p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">How Confidence Score is Calculated</h4>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            The overall confidence score combines eight factors using a <strong>weighted average methodology</strong> aligned with 
            industry valuation standards (IFRS 13, IVSC guidance).
          </p>
          
          {isUsingBackendData ? (
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="font-medium text-green-900 mb-2">Backend Calculation (Weighted Average):</p>
              <ul className="space-y-1 text-xs text-gray-700 ml-4 list-disc">
                <li>Data Quality: 20% weight</li>
                <li>Historical Data: 15% weight</li>
                <li>Methodology Agreement: 15% weight</li>
                <li>Industry Benchmarks: 15% weight</li>
                <li>Company Profile: 10% weight</li>
                <li>Market Conditions: 10% weight</li>
                <li>Geographic Data: 10% weight</li>
                <li>Business Model Clarity: 5% weight</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                <strong>Source:</strong> Backend calculation using comprehensive market data and industry benchmarks
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-3 border border-yellow-200">
              <p className="font-medium text-yellow-900 mb-2">Frontend Calculation (Approximation):</p>
              <p className="text-xs text-gray-700 mb-2">
                Using simple average of calculated factors. Some factors use default estimates where data is unavailable.
                <strong className="block mt-1">For accurate weighted calculation, ensure complete financial data is provided.</strong>
              </p>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              <strong>Academic Reference:</strong> Confidence scoring methodology aligned with valuation best practices from 
              McKinsey & Company's "Valuation" (Koller, Goedhart, Wessels), Damodaran's "The Dark Side of Valuation", 
              and PwC Valuation Handbook standards.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content Section */}
      <div className="mt-6 border-t-2 border-gray-200 pt-6">
        <button
          onClick={() => setShowEducationalContent(!showEducationalContent)}
          className="w-full flex items-center justify-between text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-semibold text-gray-900">Understanding Your Confidence Score</span>
          <svg 
            className={`w-5 h-5 text-gray-600 transition-transform ${showEducationalContent ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showEducationalContent && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">What is the Confidence Score?</h5>
              <p className="text-sm text-gray-700">
                The confidence score indicates how reliable we believe your valuation is, based on the quality and 
                completeness of your data and current market conditions. Higher scores (80%+) indicate valuations with 
                comprehensive data, strong methodology agreement, and reliable market benchmarks.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 mb-2">What the Score Means</h5>
              <div className="space-y-2 mt-2">
                <div className="flex items-start gap-3 p-2.5 bg-green-50 rounded border border-green-200">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-semibold text-green-700">90-100%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-green-800 font-semibold">Very High Confidence</p>
                    <p className="text-xs text-green-700 mt-0.5">Valuation is highly reliable with comprehensive data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded border border-emerald-200">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-semibold text-emerald-700">80-89%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-emerald-800 font-semibold">High Confidence</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Valuation is very reliable</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2.5 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-semibold text-blue-700">70-79%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-800 font-semibold">Good Confidence</p>
                    <p className="text-xs text-blue-700 mt-0.5">Valuation is reliable with minor data gaps</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2.5 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-semibold text-yellow-700">60-69%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-yellow-800 font-semibold">Moderate Confidence</p>
                    <p className="text-xs text-yellow-700 mt-0.5">Valuation is reasonably reliable, consider additional data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2.5 bg-orange-50 rounded border border-orange-200">
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-xs font-semibold text-orange-700">{'<'}60%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-orange-800 font-semibold">Lower Confidence</p>
                    <p className="text-xs text-orange-700 mt-0.5">Provide additional financial data to improve accuracy</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Why It Matters</h5>
              <p className="text-sm text-gray-700">
                Confidence scores help investors, buyers, and stakeholders understand the reliability of the valuation. 
                Higher confidence scores support stronger negotiation positions, reduce valuation disputes, and enable more 
                informed decision-making in M&A transactions, fundraising, and strategic planning.
              </p>
            </div>
          </div>
        )}
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

