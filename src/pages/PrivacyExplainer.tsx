import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Server, Cloud, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

export const PrivacyExplainer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Valuation Tool</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Privacy-First Architecture</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <Shield className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How We Protect Your Financial Data
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding our Registry-First approach: How we use AI safely while keeping your sensitive business data completely private
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-16">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  The Problem with Traditional Valuation Tools
                </h2>
                <p className="text-gray-700 mb-4">
                  Most business valuation tools require you to manually enter sensitive financial data or upload documents that get processed by external AI services. This creates several risks:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Manual data entry is time-consuming and error-prone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Uploaded financial documents may be sent to external AI services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Your revenue, EBITDA, and profit margins could be exposed to third parties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Potential GDPR violations and compliance risks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Risk of data breaches or unauthorized access to sensitive business information</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Our Solution */}
        <section className="mb-16">
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Our Registry-First Privacy Solution
                </h2>
                <p className="text-gray-700 mb-4">
                  We've designed a <strong>Registry-First 2-step architecture</strong> that uses publicly available company registry data while keeping your sensitive information private:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Step 1: AI Company Lookup</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI assistant helps you find your company using natural language. Only public information (company name, country) is shared with external AI services.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Step 2: Secure Registry Processing</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Financial data is fetched directly from official company registries (Companies House, KVK, etc.) and processed on our secure servers. No external AI sees your financial numbers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Explanation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works: A Visual Guide
          </h2>

          {/* Step 1 Explanation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">AI Company Lookup</h3>
                <p className="text-gray-600">Natural language company search</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Natural Language Search</h4>
                  <p className="text-sm text-gray-600">
                    Simply tell our AI assistant your company name and country: "Tech Solutions Ltd in the UK" or "Acme Trading NV in Belgium". The AI understands natural language and helps you find your company.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Cloud className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Safe AI Conversation</h4>
                  <p className="text-sm text-gray-600">
                    The AI only sees publicly available information like your company name and country. No financial data, revenue numbers, or sensitive business information is shared with external AI services.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Server className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Company Registry Integration</h4>
                  <p className="text-sm text-gray-600">
                    Our system automatically connects to official company registries (Companies House UK, KVK Netherlands, Handelsregister Germany, etc.) to find your company's public registration details.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">What AI Can See:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-7">
                  <li>✓ Company name (e.g., "Tech Solutions Ltd")</li>
                  <li>✓ Country (e.g., "United Kingdom")</li>
                  <li>✓ Public registry information</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <span className="font-semibold text-blue-900">What AI NEVER Sees:</span>
                  <ul className="text-sm text-blue-800 space-y-1 ml-7 mt-2">
                    <li>✗ Revenue numbers or financial data</li>
                    <li>✗ EBITDA or profit margins</li>
                    <li>✗ Any sensitive business information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 Explanation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Secure Registry Data Processing</h3>
                <p className="text-gray-600">Private financial data extraction</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Server className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Direct Registry Access</h4>
                  <p className="text-sm text-gray-600">
                    Our secure backend directly accesses official company registries to fetch your company's filed financial data. This includes revenue, EBITDA, assets, and other financial metrics from your latest annual reports.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Private Data Processing</h4>
                  <p className="text-sm text-gray-600">
                    All financial data is processed exclusively on our secure servers using our proprietary extraction engine. No external AI services, including OpenAI, ever see your financial numbers or sensitive business data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Encrypted Storage & Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Your financial data is encrypted (AES-256) and stored securely on our infrastructure. We analyze multiple years of financial history to provide accurate valuations while maintaining complete privacy.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Privacy Guarantees:</span>
                </div>
                <ul className="text-sm text-green-800 space-y-1 ml-7">
                  <li>✓ Financial data never leaves our secure infrastructure</li>
                  <li>✓ No external AI services see your revenue or EBITDA</li>
                  <li>✓ GDPR-compliant data handling</li>
                  <li>✓ Bank-grade encryption (TLS 1.3 + AES-256)</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <span className="font-semibold text-green-900">What We Process:</span>
                  <ul className="text-sm text-green-800 space-y-1 ml-7 mt-2">
                    <li>✓ Revenue, EBITDA, profit margins (from public filings)</li>
                    <li>✓ Assets, liabilities, equity (from balance sheets)</li>
                    <li>✓ Historical financial trends (3+ years)</li>
                    <li>✓ Industry benchmarks and comparisons</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Comparison: Traditional Tools vs. Registry-First Approach
          </h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-900">Traditional Tools</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-green-900">Registry-First</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Entry</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Manual typing</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">AI + Registry lookup</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Financial Data Source</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">User uploads/entry</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Official registries</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">AI Usage</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Processes financial docs</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Company lookup only</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Accuracy</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">User-dependent</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Registry-verified</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Privacy Risk</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">High (AI sees data)</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Minimal (public data only)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Setup Time</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">30+ minutes</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">2-3 minutes</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">GDPR Compliance</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">⚠️ Risk</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Compliant</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Historical Data</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Manual entry</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Auto-fetched (3+ years)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Compliance & Security */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Compliance & Security Standards
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">GDPR Compliant</h3>
              <p className="text-sm text-gray-600">
                Full compliance with EU data protection regulations. Your financial data stays within EU infrastructure if you're an EU user.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">SOC 2 Certified</h3>
              <p className="text-sm text-gray-600">
                Security, availability, and confidentiality controls audited by third parties. Enterprise-grade privacy protection.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Bank-Grade Encryption</h3>
              <p className="text-sm text-gray-600">
                TLS 1.3 in transit, AES-256 at rest. Military-grade encryption protects your data at every stage.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>How does the Registry-First approach work?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Our Registry-First approach uses two steps: (1) AI helps you find your company using natural language (only public info like company name and country), then (2) we securely fetch your financial data directly from official company registries (Companies House, KVK, etc.) and process it on our private servers. This eliminates manual data entry while keeping your financial data completely private.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Is registry data accurate and up-to-date?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Yes! Registry data comes directly from official government sources (Companies House UK, KVK Netherlands, Handelsregister Germany, etc.) and represents the same financial information your company has filed with authorities. This data is typically more accurate than manual entry and includes multiple years of historical data. You can always review and edit the data before calculating your valuation.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>What if my company isn't found in the registries?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                If your company isn't found in the registries, you can still use our manual entry option to input your financial data directly. The Registry-First approach is designed to make the process faster and more accurate for companies that are registered, but we support all business types and structures.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Why is this more private than traditional tools?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Traditional tools often send your financial documents to external AI services like OpenAI, exposing your revenue, EBITDA, and profit margins to third parties. Our Registry-First approach only uses AI for company lookup (public info only), then fetches financial data directly from official registries and processes it on our secure servers. Your sensitive financial numbers never touch external AI services.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>What countries and registries do you support?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                We currently support major European markets including the UK (Companies House), Netherlands (KVK), Germany (Handelsregister), Belgium (Crossroads Bank), France (INPI), and Luxembourg. We're continuously expanding to cover more countries and registries. If your country isn't supported yet, you can still use our manual entry option.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-200">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Try Our Registry-First Valuation?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Experience the speed of AI-powered company lookup with the security of private financial data processing.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Start Your Secure Valuation
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Upswitch. Your privacy is our priority. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
