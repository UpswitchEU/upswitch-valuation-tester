import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';

interface JourneyStep0Props {
  result: ValuationResponse;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep0_HistoricalTrends: React.FC<JourneyStep0Props> = ({ result }) => {
  const historicalData = result.historical_years_data || [];
  const currentData = result.current_year_data;
  
  // Need at least 1 year of historical data to show trends
  if (historicalData.length < 1 || !currentData) {
    return null;
  }
  
  // Sort historical data by year (oldest first)
  const sortedHistorical = [...historicalData].sort((a, b) => a.year - b.year);
  const allYears = [...sortedHistorical, currentData];
  
  // Calculate YoY growth rates
  const revenueGrowthRates: number[] = [];
  const ebitdaGrowthRates: number[] = [];
  
  for (let i = 1; i < allYears.length; i++) {
    const prevYear = allYears[i - 1];
    const currYear = allYears[i];
    
    if (prevYear.revenue > 0) {
      const revenueGrowth = ((currYear.revenue - prevYear.revenue) / prevYear.revenue) * 100;
      revenueGrowthRates.push(revenueGrowth);
    }
    
    if (prevYear.ebitda > 0 && currYear.ebitda > 0) {
      const ebitdaGrowth = ((currYear.ebitda - prevYear.ebitda) / Math.abs(prevYear.ebitda)) * 100;
      ebitdaGrowthRates.push(ebitdaGrowth);
    } else if (prevYear.ebitda < 0 && currYear.ebitda > 0) {
      // Negative to positive is significant improvement
      ebitdaGrowthRates.push(100); // Flag as 100%+ improvement
    }
  }
  
  // Calculate CAGR if we have first and last year
  const firstYear = sortedHistorical[0];
  const lastYear = currentData;
  const yearsDiff = lastYear.year - firstYear.year;
  
  let revenueCAGR = 0;
  let ebitdaCAGR = 0;
  
  if (yearsDiff > 0 && firstYear.revenue > 0) {
    revenueCAGR = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / yearsDiff) - 1) * 100;
  }
  
  if (yearsDiff > 0 && firstYear.ebitda > 0 && lastYear.ebitda > 0) {
    ebitdaCAGR = (Math.pow(lastYear.ebitda / firstYear.ebitda, 1 / yearsDiff) - 1) * 100;
  }
  
  // Determine trend direction
  const avgRevenueGrowth = revenueGrowthRates.length > 0 
    ? revenueGrowthRates.reduce((a, b) => a + b, 0) / revenueGrowthRates.length 
    : 0;
  
  const isDeclining = avgRevenueGrowth < -5; // More than 5% decline
  const isGrowing = avgRevenueGrowth > 5; // More than 5% growth
  const isStable = !isDeclining && !isGrowing;
  
  const trendDirection = isDeclining ? 'Declining' : isGrowing ? 'Growing' : 'Stable';
  const trendColor = isDeclining ? 'red' : isGrowing ? 'green' : 'yellow';
  const TrendIcon = isDeclining ? TrendingDown : isGrowing ? TrendingUp : Minus;
  
  return (
    <StepCard
      id="step-0-trends"
      stepNumber={0}
      title="Historical Trend Analysis"
      subtitle={`${trendDirection} Revenue Trend`}
      icon={<TrendIcon className="w-5 h-5" />}
      color={trendColor}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Formula */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Formula</span>
          </div>
          <div className="font-mono text-sm sm:text-base text-gray-900 font-medium whitespace-pre-wrap break-words">
            YoY Growth = (Current Year - Previous Year) / Previous Year × 100%
          </div>
          <p className="text-xs text-gray-600 mt-2 italic">
            CAGR = (Final Value / Initial Value)^(1/Years) - 1
          </p>
        </div>

        {/* Year-by-Year Revenue */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Revenue Trend</h4>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {allYears.map((year, index) => {
              const isCurrent = index === allYears.length - 1;
              const prevYear = index > 0 ? allYears[index - 1] : null;
              const growth = prevYear && prevYear.revenue > 0 
                ? ((year.revenue - prevYear.revenue) / prevYear.revenue) * 100 
                : null;
              
              return (
                <div 
                  key={year.year} 
                  className={`flex justify-between items-center px-4 py-3 ${isCurrent ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{year.year}</span>
                    {isCurrent && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-base font-bold ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                      {formatCurrency(year.revenue)}
                    </span>
                    {growth !== null && (
                      <span className={`text-sm font-semibold ${
                        growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth Metrics */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Growth Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {revenueGrowthRates.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <span className="text-sm text-gray-600">Average YoY Revenue Growth</span>
                <p className={`text-2xl font-bold mt-1 ${
                  avgRevenueGrowth > 0 ? 'text-green-600' : avgRevenueGrowth < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {avgRevenueGrowth > 0 ? '+' : ''}{avgRevenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on {revenueGrowthRates.length} year{revenueGrowthRates.length > 1 ? 's' : ''} of data
                </p>
              </div>
            )}
            
            {revenueCAGR !== 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <span className="text-sm text-gray-600">Revenue CAGR ({yearsDiff} years)</span>
                <p className={`text-2xl font-bold mt-1 ${
                  revenueCAGR > 0 ? 'text-green-600' : revenueCAGR < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {revenueCAGR > 0 ? '+' : ''}{revenueCAGR.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Compound Annual Growth Rate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trend Analysis */}
        <div className={`border-l-4 p-4 rounded ${
          isDeclining ? 'bg-red-50 border-red-500' :
          isGrowing ? 'bg-green-50 border-green-500' :
          'bg-yellow-50 border-yellow-500'
        }`}>
          <h4 className="font-semibold text-gray-900 mb-2">Trend Analysis</h4>
          {isDeclining && (
            <p className="text-sm text-red-900">
              ⚠️ <strong>Revenue is declining</strong> (average {avgRevenueGrowth.toFixed(1)}% per year). 
              This may indicate business challenges and could impact valuation multiples. Declining revenue 
              typically results in lower valuation multiples as buyers perceive higher risk.
            </p>
          )}
          {isGrowing && (
            <p className="text-sm text-green-900">
              ✅ <strong>Revenue is growing</strong> (average {avgRevenueGrowth.toFixed(1)}% per year). 
              Positive growth trend supports higher valuation multiples. Growing businesses typically 
              command premium valuations as they demonstrate market traction and scalability.
            </p>
          )}
          {isStable && (
            <p className="text-sm text-yellow-900">
              📊 <strong>Revenue trend is relatively stable</strong>. Consistent performance may indicate 
              a mature business model. Stable revenue can support steady valuations, though growth 
              potential may be limited.
            </p>
          )}
        </div>

        {/* Impact on Valuation */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h4 className="font-semibold text-gray-900 mb-2">Impact on Valuation</h4>
          <p className="text-sm text-blue-900">
            Historical revenue trends are a key factor in valuation multiples. <strong>Growing businesses</strong> 
            typically command higher multiples (1.2-2.0x revenue), while <strong>declining businesses</strong> 
            receive lower multiples (0.5-1.0x revenue). This trend analysis informs the base multiple 
            selection in the next step.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

