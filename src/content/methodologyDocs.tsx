
export const METHODOLOGY_DOCS = {
  'valuation-approach': {
    title: 'Valuation Approach',
    content: (
      <>
        <div className="mb-6">
          <h3>How We Value Your Business</h3>
          <p>
            UpSwitch uses a hybrid approach combining two industry-standard methodologies 
            to provide the most accurate valuation possible for your business.
          </p>
        </div>
        
        <div className="mb-6">
          <h4>Discounted Cash Flow (DCF)</h4>
          <p className="mb-3">
            The DCF method projects your company's future cash flows and discounts them 
            to present value using a weighted average cost of capital (WACC). This method 
            is particularly effective for businesses with:
          </p>
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <p className="text-sm">Predictable cash flow patterns</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <p className="text-sm">Strong historical financial data</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <p className="text-sm">Clear growth trajectories</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4>Market Multiples</h4>
          <p className="mb-3">
            The market multiples approach compares your business to similar companies 
            that have been sold or are publicly traded. We analyze:
          </p>
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <p className="text-sm">
                  <strong>Revenue multiples</strong> (Enterprise Value / Revenue)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <p className="text-sm">
                  <strong>EBITDA multiples</strong> (Enterprise Value / EBITDA)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <p className="text-sm">Industry-specific benchmarks</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4>Weighted Combination</h4>
          <p className="mb-3">
            We don't just average the two methods. Instead, we dynamically weight them 
            based on:
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <p className="text-sm">Quality of your financial data</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <p className="text-sm">Availability of comparable companies</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <p className="text-sm">Business model characteristics</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                <p className="text-sm">Market conditions</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <strong>Result:</strong> This approach ensures your valuation reflects the most reliable 
            methodology for your specific business profile.
          </p>
        </div>
      </>
    )
  },
  
  'confidence-score': {
    title: 'Understanding Your Confidence Score',
    content: (
      <>
        <div className="mb-6">
          <h3>What is the Confidence Score?</h3>
          <p>
            The confidence score indicates how reliable we believe your valuation is, 
            based on the quality and completeness of your data and current market conditions.
          </p>
        </div>
        
        <div className="mb-6">
          <h4>How We Calculate Confidence</h4>
          <p className="mb-4">We evaluate eight key factors:</p>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Data Quality</h5>
              <p className="text-sm">Completeness and accuracy of your financial information</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Historical Data</h5>
              <p className="text-sm">Years of historical financial data available for analysis</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Methodology Agreement</h5>
              <p className="text-sm">How closely DCF and Multiples valuations agree with each other</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Industry Benchmarks</h5>
              <p className="text-sm">Quality and quantity of comparable companies in your industry</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Company Profile</h5>
              <p className="text-sm">Business stability, profitability, and growth characteristics</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Market Conditions</h5>
              <p className="text-sm">Current market volatility and economic environment</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Geographic Data</h5>
              <p className="text-sm">Quality of country-specific market data and benchmarks</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h5 className="text-blue-700 mb-1">Business Model Clarity</h5>
              <p className="text-sm">How well your business model fits standard valuation approaches</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4>What the Score Means</h4>
          <div className="space-y-2 mt-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-semibold text-green-700">90-100%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">Very High Confidence</p>
                <p className="text-xs text-green-700 mt-0.5">Valuation is highly reliable</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-semibold text-emerald-700">80-89%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-800 font-medium">High Confidence</p>
                <p className="text-xs text-emerald-700 mt-0.5">Valuation is very reliable</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-semibold text-blue-700">70-79%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">Good Confidence</p>
                <p className="text-xs text-blue-700 mt-0.5">Valuation is reliable</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-semibold text-yellow-700">60-69%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium">Moderate Confidence</p>
                <p className="text-xs text-yellow-700 mt-0.5">Valuation is reasonably reliable</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-semibold text-orange-700">&lt;60%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-orange-800 font-medium">Lower Confidence</p>
                <p className="text-xs text-orange-700 mt-0.5">Consider providing additional data</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4>How to Improve Your Score</h4>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-sm">Provide complete financial statements</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-sm">Add 3+ years of historical data</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-sm">Ensure accurate revenue and EBITDA figures</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <p className="text-sm">Provide detailed business model information</p>
            </div>
          </div>
        </div>
      </>
    )
  }
} as const;

export type DocumentationKey = keyof typeof METHODOLOGY_DOCS;
