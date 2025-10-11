import React from 'react';

/**
 * IndustryBenchmarkBar - Visual percentile comparison
 * 
 * Shows how company compares to industry (percentile ranking)
 * Design: Visual bar chart with percentile markers
 * 
 * Strategy: Make complex benchmarks instantly understandable
 */

interface IndustryBenchmarkBarProps {
  metricName: string;
  companyValue: number;
  industryP25: number;
  industryMedian: number;
  industryP75: number;
  industryP90: number;
  companyPercentile: number;
  assessment: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  explanation: string;
  formatter?: (value: number) => string;
  isPercentage?: boolean;
}

const ASSESSMENT_CONFIG = {
  excellent: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '🌟',
    label: 'Excellent',
  },
  good: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: '✓',
    label: 'Good',
  },
  average: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: '=',
    label: 'Average',
  },
  below_average: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: '⚠',
    label: 'Below Average',
  },
  poor: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '❌',
    label: 'Poor',
  },
};

export const IndustryBenchmarkBar: React.FC<IndustryBenchmarkBarProps> = ({
  metricName,
  companyValue,
  industryP25,
  industryMedian,
  industryP75,
  industryP90,
  companyPercentile,
  assessment,
  explanation,
  formatter,
  isPercentage = false,
}) => {
  const assessmentConfig = ASSESSMENT_CONFIG[assessment];
  
  const defaultFormatter = (value: number) => {
    if (isPercentage) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(2);
  };
  
  const format = formatter || defaultFormatter;
  
  // Calculate positions (0-100 scale)
  const min = Math.min(industryP25, companyValue) * 0.8;
  const max = Math.max(industryP90, companyValue) * 1.2;
  const range = max - min;
  
  const getPosition = (value: number) => {
    return ((value - min) / range) * 100;
  };
  
  const p25Pos = getPosition(industryP25);
  const medianPos = getPosition(industryMedian);
  const p75Pos = getPosition(industryP75);
  const p90Pos = getPosition(industryP90);
  const companyPos = getPosition(companyValue);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-semibold text-gray-900">{metricName}</h5>
          <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border
            ${assessmentConfig.bgColor} ${assessmentConfig.color} ${assessmentConfig.borderColor}
          `}>
            <span>{assessmentConfig.icon}</span>
            <span>{assessmentConfig.label}</span>
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{format(companyValue)}</p>
          <p className="text-xs text-gray-500">{companyPercentile}th percentile</p>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="relative pt-6 pb-2">
        {/* Industry range bar */}
        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
          {/* Colored zones */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-red-300/40"
            style={{ width: `${p25Pos}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 bg-yellow-300/40"
            style={{ left: `${p25Pos}%`, width: `${medianPos - p25Pos}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 bg-green-300/40"
            style={{ left: `${medianPos}%`, width: `${p75Pos - medianPos}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 bg-blue-300/40"
            style={{ left: `${p75Pos}%`, width: `${p90Pos - p75Pos}%` }}
          />
          
          {/* Percentile markers */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${p25Pos}%` }}
            title="25th percentile"
          />
          <div 
            className="absolute top-0 bottom-0 w-1 bg-gray-600"
            style={{ left: `${medianPos}%` }}
            title="Median (50th percentile)"
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${p75Pos}%` }}
            title="75th percentile"
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${p90Pos}%` }}
            title="90th percentile"
          />
          
          {/* Company marker */}
          <div 
            className="absolute -top-6 transform -translate-x-1/2"
            style={{ left: `${companyPos}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-blue-600 mb-1">You</span>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-600"></div>
            </div>
          </div>
          <div 
            className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
            style={{ left: `${companyPos}%` }}
          />
        </div>

        {/* Labels below bar */}
        <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
          <span>P25: {format(industryP25)}</span>
          <span>Median: {format(industryMedian)}</span>
          <span>P75: {format(industryP75)}</span>
          <span>P90: {format(industryP90)}</span>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
        {explanation}
      </p>
    </div>
  );
};

