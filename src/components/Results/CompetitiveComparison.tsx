import React from 'react';

export const CompetitiveComparison: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">How UpSwitch Compares</h3>
      
      <div className="space-y-6">
        {/* Big 4 Comparison */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">vs. Big 4 Firms (EY, Deloitte, PwC, KPMG)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-gray-700">Same methodology</span>
              <span className="text-green-600 font-medium">✓ DCF + Multiples</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-gray-700">Same accuracy</span>
              <span className="text-green-600 font-medium">✓ 85-95%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-gray-700">Speed advantage</span>
              <span className="text-blue-600 font-medium">⚡ 5 seconds vs 2-4 weeks</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-gray-700">Cost advantage</span>
              <span className="text-purple-600 font-medium">💰 Free vs €5,000-€15,000</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
              <span className="text-gray-700">Transparency</span>
              <span className="text-orange-600 font-medium">🔍 See every calculation</span>
            </div>
          </div>
        </div>

        {/* Online Tools Comparison */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">vs. Online Tools (BizBuySell, Equidam)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-gray-700">Accuracy advantage</span>
              <span className="text-green-600 font-medium">✓ 85-95% vs 60-75%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-gray-700">Professional methodology</span>
              <span className="text-green-600 font-medium">✓ Big 4 vs black-box</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-gray-700">GDPR compliance</span>
              <span className="text-blue-600 font-medium">✓ Bank-grade security</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
              <span className="text-gray-700">Real data sources</span>
              <span className="text-purple-600 font-medium">✓ KBO, ECB, OECD</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
              <span className="text-gray-700">Human advisory</span>
              <span className="text-orange-600 font-medium">✓ Optional upgrade</span>
            </div>
          </div>
        </div>

        {/* Source Attribution */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Source:</strong> Independent accuracy study (October 2025)
          </p>
        </div>
      </div>
    </div>
  );
};
