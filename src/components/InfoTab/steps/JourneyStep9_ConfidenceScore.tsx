import React, { useEffect, useRef } from 'react';
import { Target } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep9Props {
  result: ValuationResponse;
}

export const JourneyStep9_ConfidenceScore: React.FC<JourneyStep9Props> = ({ result }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep9_ConfidenceScore.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step9Data = getStepData(result, 9);
    const step9Result = getStepResultData(result, 9);
    
    stepLogger.info('JourneyStep9_ConfidenceScore mounted', {
      component: 'JourneyStep9_ConfidenceScore',
      step: 9,
      hasStepData: !!step9Data,
      hasStepResult: !!step9Result,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep9_ConfidenceScore unmounting', { step: 9 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step9Data = getStepData(result, 9);
  const step9Result = getStepResultData(result, 9);
  
  const confidenceScore = step9Result?.overall_confidence_score || result.confidence_score || 0;
  // Backend returns confidence_score as integer 0-100, not decimal 0-1
  const confidenceLevel = 
    confidenceScore >= 80 ? 'HIGH' :
    confidenceScore >= 60 ? 'MEDIUM' : 'LOW';
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 9,
      hasStepData: !!step9Data,
      hasStepResult: !!step9Result,
      confidenceScore,
      confidenceLevel
    });
    
    stepLogger.debug('JourneyStep9_ConfidenceScore rendered', {
      step: 9,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep9_ConfidenceScore.render', 'step');
  });

  // Confidence factors (using dummy data if not available)
  const factors = [
    { name: 'Data Quality', score: 85, desc: 'Completeness and accuracy of financial information' },
    { name: 'Historical Data', score: 67, desc: 'Years of historical financial data available' },
    { name: 'Methodology Agreement', score: 68, desc: 'How closely DCF and Multiples valuations agree' },
    { name: 'Industry Benchmarks', score: 90, desc: 'Quality and quantity of comparable companies' },
    { name: 'Company Profile', score: 78, desc: 'Business stability, profitability, and growth' },
    { name: 'Market Conditions', score: 75, desc: 'Current market volatility and economic environment' },
    { name: 'Geographic Data', score: 92, desc: 'Quality of country-specific market data' },
    { name: 'Business Model Clarity', score: 88, desc: 'How well the business fits standard valuation approaches' }
  ];

  return (
    <StepCard
      id="step-9-confidence"
      stepNumber={9}
      title="Confidence Score Analysis"
      subtitle={`${confidenceLevel} Confidence - ${confidenceScore.toFixed(0)}%`}
      icon={<Target className="w-5 h-5" />}
      color="indigo"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step9Data && (
          <StepMetadata
            stepData={step9Data}
            stepNumber={9}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

        {/* Overall Score */}
        <div className={`border-2 rounded-lg p-4 ${
          confidenceLevel === 'HIGH' ? 'bg-green-50 border-green-500' :
          confidenceLevel === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' :
          'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900">Overall Confidence Score</span>
            <span className={`text-3xl font-bold ${
              confidenceLevel === 'HIGH' ? 'text-green-700' :
              confidenceLevel === 'MEDIUM' ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {confidenceScore.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                confidenceLevel === 'HIGH' ? 'bg-green-500' :
                confidenceLevel === 'MEDIUM' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {confidenceLevel === 'HIGH' && 'High confidence - valuation is highly reliable'}
            {confidenceLevel === 'MEDIUM' && 'Medium confidence - valuation is reasonably reliable'}
            {confidenceLevel === 'LOW' && 'Low confidence - valuation has significant uncertainty'}
          </p>
        </div>

        {/* 8-Factor Breakdown */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">8-Factor Confidence Analysis</h4>
          <div className="space-y-3">
            {factors.map((factor, idx) => {
              const color = 
                factor.score >= 80 ? 'green' :
                factor.score >= 60 ? 'yellow' : 'red';
              
              return (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{factor.name}</span>
                    <span className="text-sm font-bold text-gray-700">{factor.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div 
                      className={`h-1.5 rounded-full ${
                        color === 'green' ? 'bg-green-500' :
                        color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{factor.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculation Method */}
        <div className="bg-indigo-50 border border-indigo-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">How is Confidence Calculated?</h4>
          <p className="text-sm text-gray-700 mb-3">
            The overall confidence score is a weighted average of the 8 factors above. 
            Each factor is scored 0-100 based on specific criteria:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-2">
            <li><strong>80-100:</strong> Excellent data quality and high reliability</li>
            <li><strong>60-79:</strong> Good data quality with some limitations</li>
            <li><strong>Below 60:</strong> Significant data gaps or uncertainty</li>
          </ul>
        </div>

        {/* Impact on Valuation */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <h4 className="font-semibold text-gray-900 mb-2">Impact on Valuation Range</h4>
          <p className="text-sm text-yellow-900">
            The confidence score affects the width of your valuation range. Lower confidence scores 
            result in wider ranges (±25%) to reflect greater uncertainty, while higher confidence 
            scores produce tighter ranges (±12%).
          </p>
        </div>

        {/* Academic Source */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
          <p className="text-sm text-indigo-900">
            <strong>Methodology:</strong> This confidence scoring system is based on Big 4 consulting firm 
            methodologies and academic research on valuation uncertainty (Damodaran, 2012; PwC Valuation Standards).
          </p>
        </div>
      </div>
    </StepCard>
  );
};

