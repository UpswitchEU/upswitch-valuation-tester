import React from 'react';
import { formatPercent } from './utils/formatters';
import { getValueDrivers } from './utils/calculations';
import type { ValuationResponse } from '../../types/valuation';

interface ValueDriversProps {
  result: ValuationResponse;
}

export const ValueDrivers: React.FC<ValueDriversProps> = ({ result }) => {
  const drivers = getValueDrivers(result);
  
  if (drivers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Value Drivers</h3>
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No value drivers identified</p>
          <p className="text-gray-400 text-xs mt-1">Add more financial data for detailed analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Value Drivers</h3>
      
      <div className="space-y-3">
        {drivers.map((driver, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${
                driver.impact === 'positive' ? 'bg-green-500' :
                driver.impact === 'negative' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <span className="text-sm font-medium text-gray-700">{driver.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-900">
                {driver.label.includes('Rate') || driver.label.includes('Margin') ? 
                  formatPercent(driver.value) : driver.value.toFixed(1)}
              </span>
              {driver.impact === 'positive' && (
                <div className="text-xs text-green-600">↑ Positive impact</div>
              )}
              {driver.impact === 'negative' && (
                <div className="text-xs text-red-600">↓ Negative impact</div>
              )}
              {driver.impact === 'neutral' && (
                <div className="text-xs text-blue-600">→ Neutral factor</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <strong>Note:</strong> These factors significantly influence your company's valuation. 
        Focus on improving positive drivers and addressing negative ones.
      </div>
    </div>
  );
};
