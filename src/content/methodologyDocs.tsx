
export const METHODOLOGY_DOCS = {
  'valuation-approach': {
    title: 'Valuation Approach',
    content: (
      <>
        <h3>How We Value Your Business</h3>
        <p>
          UpSwitch uses a hybrid approach combining two industry-standard methodologies 
          to provide the most accurate valuation possible for your business.
        </p>
        
        <h4>Discounted Cash Flow (DCF)</h4>
        <p>
          The DCF method projects your company's future cash flows and discounts them 
          to present value using a weighted average cost of capital (WACC). This method 
          is particularly effective for businesses with:
        </p>
        <ul>
          <li>Predictable cash flow patterns</li>
          <li>Strong historical financial data</li>
          <li>Clear growth trajectories</li>
        </ul>
        
        <h4>Market Multiples</h4>
        <p>
          The market multiples approach compares your business to similar companies 
          that have been sold or are publicly traded. We analyze:
        </p>
        <ul>
          <li>Revenue multiples (Enterprise Value / Revenue)</li>
          <li>EBITDA multiples (Enterprise Value / EBITDA)</li>
          <li>Industry-specific benchmarks</li>
        </ul>
        
        <h4>Weighted Combination</h4>
        <p>
          We don't just average the two methods. Instead, we dynamically weight them 
          based on:
        </p>
        <ul>
          <li>Quality of your financial data</li>
          <li>Availability of comparable companies</li>
          <li>Business model characteristics</li>
          <li>Market conditions</li>
        </ul>
        
        <p>
          This approach ensures your valuation reflects the most reliable methodology 
          for your specific business profile.
        </p>
      </>
    )
  },
  
  'confidence-score': {
    title: 'Understanding Your Confidence Score',
    content: (
      <>
        <h3>What is the Confidence Score?</h3>
        <p>
          The confidence score represents how reliable we believe the valuation is, 
          based on the quality and completeness of your data and market conditions.
        </p>
        
        <h4>How We Calculate Confidence</h4>
        <p>We evaluate eight key factors:</p>
        
        <h5>Data Quality (0-100%)</h5>
        <p>Completeness and accuracy of your financial information</p>
        
        <h5>Historical Data (0-100%)</h5>
        <p>Years of historical financial data available for analysis</p>
        
        <h5>Methodology Agreement (0-100%)</h5>
        <p>How closely DCF and Multiples valuations agree with each other</p>
        
        <h5>Industry Benchmarks (0-100%)</h5>
        <p>Quality and quantity of comparable companies in your industry</p>
        
        <h5>Company Profile (0-100%)</h5>
        <p>Business stability, profitability, and growth characteristics</p>
        
        <h5>Market Conditions (0-100%)</h5>
        <p>Current market volatility and economic environment</p>
        
        <h5>Geographic Data (0-100%)</h5>
        <p>Quality of country-specific market data and benchmarks</p>
        
        <h5>Business Model Clarity (0-100%)</h5>
        <p>How well your business model fits standard valuation approaches</p>
        
        <h4>What the Score Means</h4>
        <ul>
          <li><strong>90-100%:</strong> Very high confidence - valuation is highly reliable</li>
          <li><strong>80-89%:</strong> High confidence - valuation is very reliable</li>
          <li><strong>70-79%:</strong> Good confidence - valuation is reliable</li>
          <li><strong>60-69%:</strong> Moderate confidence - valuation is reasonably reliable</li>
          <li><strong>Below 60%:</strong> Lower confidence - consider providing additional data</li>
        </ul>
        
        <h4>How to Improve Your Score</h4>
        <p>You can increase your confidence score by:</p>
        <ul>
          <li>Providing complete financial statements</li>
          <li>Adding 3+ years of historical data</li>
          <li>Ensuring accurate revenue and EBITDA figures</li>
          <li>Providing detailed business model information</li>
        </ul>
      </>
    )
  }
} as const;

export type DocumentationKey = keyof typeof METHODOLOGY_DOCS;
