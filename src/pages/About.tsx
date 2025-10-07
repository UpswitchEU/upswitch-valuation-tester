/**
 * About Page
 */

import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { urls } from '../router';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About Upswitch Valuation Engine
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              Professional-grade business valuations powered by AI and Big 4 methodology.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-4">
              We democratize access to professional business valuations by combining cutting-edge AI 
              technology with proven methodologies used by Deloitte, PwC, KPMG, and EY.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Big 4 Methodology
            </h2>
            <p className="text-gray-700 mb-4">
              Our valuation engine follows professional standards with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>DCF Analysis:</strong> 10-year cash flow projections with WACC calculations</li>
              <li><strong>Market Multiples:</strong> Industry-specific EV/EBITDA and EV/Revenue multiples</li>
              <li><strong>Synthesized Approach:</strong> Weighted methodology based on confidence and data quality</li>
              <li><strong>Professional Ranges:</strong> ±10-22% ranges following Big 4 standards</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Why Trust Us?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ Professional Standards</h3>
                <p className="text-sm text-gray-700">
                  Follows International Valuation Standards (IVS) and ASA guidelines
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ Real-Time Data</h3>
                <p className="text-sm text-gray-700">
                  Integrates with OECD, ECB, and market data sources
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ Transparent</h3>
                <p className="text-sm text-gray-700">
                  Full methodology breakdown with all assumptions disclosed
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">✓ Fast & Accurate</h3>
                <p className="text-sm text-gray-700">
                  85-95% accuracy target with results in 1-2 minutes
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Who We Serve
            </h2>
            <p className="text-gray-700 mb-4">
              Our platform is designed for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
              <li>Business owners exploring M&A opportunities</li>
              <li>Investors evaluating potential acquisitions</li>
              <li>Financial advisors needing quick valuations</li>
              <li>SMEs seeking funding or partnerships</li>
            </ul>

            <div className="mt-12 p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ready to value your business?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={urls.instantValuation()}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center"
                >
                  Start Instant Valuation
                </Link>
                <Link
                  to={urls.howItWorks()}
                  className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors text-center"
                >
                  Learn How It Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
