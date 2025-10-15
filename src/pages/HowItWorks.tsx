/**
 * How It Works Page
 */

import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { urls } from '../router/exports';
import { ScrollToTop } from '../utils';

export const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <ScrollToTop />
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How Our Valuation Engine Works
          </h1>
          <p className="text-xl text-gray-600">
            Professional methodology made simple
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">1️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Enter Data
            </h3>
            <p className="text-gray-600">
              Choose your method: instant AI lookup, manual entry, or document upload. 
              We need your company's financials (revenue, EBITDA, etc.).
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">2️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              We Calculate
            </h3>
            <p className="text-gray-600">
              Our Big 4 methodology runs DCF and Market Multiples analysis, 
              synthesizes results, and generates confidence scores.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">3️⃣</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Get Results
            </h3>
            <p className="text-gray-600">
              Receive a comprehensive report with valuation range, risk factors, 
              value drivers, and detailed methodology breakdown.
            </p>
          </div>
        </div>

        {/* Methodology Details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Big 4 Methodology
          </h2>

          <div className="space-y-8">
            {/* DCF */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Discounted Cash Flow (DCF)
                </h3>
              </div>
              <p className="text-gray-700 ml-16 mb-3">
                We project your free cash flows for 10 years, calculate a terminal value, 
                and discount everything back to present value using your Weighted Average Cost of Capital (WACC).
              </p>
              <ul className="list-disc pl-20 space-y-1 text-sm text-gray-600">
                <li>10-year FCF projections based on historical growth</li>
                <li>WACC calculated from cost of equity and debt</li>
                <li>Terminal value using perpetuity growth method</li>
                <li>Confidence: 60-80% weight (based on data quality)</li>
              </ul>
            </div>

            {/* Market Multiples */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Market Multiples
                </h3>
              </div>
              <p className="text-gray-700 ml-16 mb-3">
                We compare your company to similar businesses and industry benchmarks, 
                applying appropriate multiples with adjustments for size, liquidity, and geography.
              </p>
              <ul className="list-disc pl-20 space-y-1 text-sm text-gray-600">
                <li>EV/EBITDA (60% weight) - most reliable for profitable companies</li>
                <li>EV/Revenue (30% weight) - useful for high-growth businesses</li>
                <li>P/E Ratio (10% weight) - supplementary validation</li>
                <li>Adjustments: Size (-20-30%), Liquidity (-25-35%), Country (0% for Belgium)</li>
              </ul>
            </div>

            {/* Synthesis */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Synthesized Result
                </h3>
              </div>
              <p className="text-gray-700 ml-16 mb-3">
                We calculate a weighted midpoint and apply a confidence-based range (±10-22%), 
                never exceeding 2x spread even in high-uncertainty scenarios.
              </p>
              <div className="ml-16 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Range Methodology (Big 4 Standard):
                </p>
                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                  <li>Strong agreement (&lt;15% variance): ±12% range</li>
                  <li>Moderate agreement (&lt;30% variance): ±18% range</li>
                  <li>Significant divergence (&gt;30% variance): ±22% range</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Data Sources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">🌍 OECD</h3>
              <p className="text-sm text-gray-600">
                GDP growth, inflation rates, economic indicators (free API)
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">🏦 ECB</h3>
              <p className="text-sm text-gray-600">
                Risk-free rates, bond yields, monetary policy data (free API)
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">📊 Market Data</h3>
              <p className="text-sm text-gray-600">
                Industry multiples, comparable companies, market trends
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">🇧🇪 Official Registries</h3>
              <p className="text-sm text-gray-600">
                Verified company financials, historical data (for instant lookup)
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link
              to={urls.instantValuation()}
              className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Instant Valuation
            </Link>
            <Link
              to={urls.manualValuation()}
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              Manual Entry
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
