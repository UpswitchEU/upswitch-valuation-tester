import React from 'react';

export const CompetitiveComparison: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology & Data Sources</h3>
      
      <div className="space-y-4">
        {/* Calculation Approach */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Valuation Approach</h4>
          <p className="text-sm text-gray-600 mb-2">
            This valuation combines two industry-standard methodologies:
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Discounted Cash Flow (DCF)</strong>: Projects future cash flows and discounts to present value using WACC</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Market Multiples</strong>: Compares to similar companies using revenue and EBITDA multiples</span>
            </li>
          </ul>
        </div>

        {/* Data Sources */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Risk-Free Rate</span>
              <span className="text-sm font-medium text-gray-900">ECB 10-year bond (2.5%)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Industry Multiples</span>
              <span className="text-sm font-medium text-gray-900">OECD sector benchmarks</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Market Data</span>
              <span className="text-sm font-medium text-gray-900">FMP comparable companies</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Company Registry</span>
              <span className="text-sm font-medium text-gray-900">KBO/BCE (1.8M companies)</span>
            </div>
          </div>
        </div>

        {/* Accuracy & Validation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
          <p className="text-sm text-gray-600">
            Methodology validated against academic research (Damodaran, Brealey-Myers) 
            and professional standards (CFA Institute, IFRS 13). Calculations follow 
            industry best practices used by leading valuation firms.
          </p>
        </div>
      </div>
    </div>
  );
};
