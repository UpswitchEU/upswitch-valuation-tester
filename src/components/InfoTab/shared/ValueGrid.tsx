import React from 'react';

export interface ValueGridProps {
  low: number;
  mid: number;
  high: number;
  label?: string;
  highlightMid?: boolean;
}

const formatCurrency = (value: number): string => {
  return `€${Math.round(value).toLocaleString()}`;
};

const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `€${Math.round(value / 1_000)}K`;
  }
  return `€${Math.round(value).toLocaleString()}`;
};

export const ValueGrid: React.FC<ValueGridProps> = ({
  low,
  mid,
  high,
  label,
  highlightMid = true
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Low */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Low Estimate</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrencyCompact(low)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(low)}</p>
        </div>

        {/* Mid */}
        <div className={`rounded-lg p-3 text-center ${
          highlightMid 
            ? 'bg-blue-50 border-2 border-blue-500' 
            : 'bg-gray-50 border border-gray-300'
        }`}>
          <p className={`text-xs mb-1 font-semibold ${
            highlightMid ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Mid-Point
          </p>
          <p className={`text-xl sm:text-2xl font-bold ${
            highlightMid ? 'text-blue-700' : 'text-gray-900'
          }`}>
            {formatCurrencyCompact(mid)}
          </p>
          <p className={`text-xs mt-1 ${
            highlightMid ? 'text-blue-500' : 'text-gray-500'
          }`}>
            {formatCurrency(mid)}
          </p>
        </div>

        {/* High */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">High Estimate</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrencyCompact(high)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(high)}</p>
        </div>
      </div>
    </div>
  );
};

