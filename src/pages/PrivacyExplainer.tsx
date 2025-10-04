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
            Understanding our privacy-first approach: Why your sensitive business data never touches external AI services
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-16">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  The Problem with Most AI Tools
                </h2>
                <p className="text-gray-700 mb-4">
                  Many AI-powered valuation tools send your financial documents directly to external AI services like OpenAI's GPT-4. This means:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Your revenue, EBITDA, and profit margins are visible to third-party servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Sensitive financial documents leave your control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Potential GDPR violations and compliance risks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Risk of data breaches or unauthorized access</span>
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
                  Our Privacy-First Solution
                </h2>
                <p className="text-gray-700 mb-4">
                  We've designed a <strong>2-step architecture</strong> that separates private financial processing from public AI assistance:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">Step 1: Private Processing</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your financial documents are processed exclusively by our proprietary engine on secure servers. No external AI services see your data.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Step 2: Public AI Chat</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI assistant only processes publicly available information like company names and industry data. Your financial numbers stay private.
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
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Secure Document Upload</h3>
                <p className="text-gray-600">Private financial data processing</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Server className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Documents → Our Secure Servers</h4>
                  <p className="text-sm text-gray-600">
                    When you upload your P&L statements, balance sheets, or financial reports, they're transmitted securely via HTTPS (TLS 1.3 encryption) directly to our servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Lock className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Processed by Our Proprietary Engine</h4>
                  <p className="text-sm text-gray-600">
                    We use our own extraction engine (built with self-hosted ML models, OCR, and PDF parsing) to extract financial data. This happens entirely on our infrastructure - <strong>no external AI services are involved</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Encrypted Storage</h4>
                  <p className="text-sm text-gray-600">
                    Extracted data (revenue, EBITDA, margins) is stored in our encrypted database (AES-256 encryption at rest) and never leaves our secure infrastructure.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">What This Means For You:</span>
                </div>
                <ul className="text-sm text-green-800 space-y-1 ml-7">
                  <li>✓ Your financial numbers never touch OpenAI or any external AI</li>
                  <li>✓ Data stays within our GDPR-compliant infrastructure</li>
                  <li>✓ Full control over your sensitive business information</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 Explanation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">AI Conversation</h3>
                <p className="text-gray-600">Public information only</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Company Lookup (Public Data)</h4>
                  <p className="text-sm text-gray-600">
                    The AI assistant looks up your company in public registries (Companies House, KVK, Handelsregister) to auto-fill details like founding year, employee count, and industry. This is all publicly available information.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Cloud className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Safe AI Conversations</h4>
                  <p className="text-sm text-gray-600">
                    The AI asks clarifying questions about non-financial aspects: "Do you have intellectual property?" "What's your growth trajectory?" "Any strategic partnerships?" These conversations can safely use external AI services because they don't contain sensitive financial data.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">What AI Can See:</span>
                </div>
                <ul className="text-sm text-blue-800 space-y-1 ml-7">
                  <li>✓ Your company name (e.g., "Acme Trading NV")</li>
                  <li>✓ Industry and country (e.g., "Retail in Belgium")</li>
                  <li>✓ Public registry data (founding year, employee count)</li>
                  <li>✓ Qualitative responses (e.g., "We have 2 patents")</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <span className="font-semibold text-blue-900">What AI NEVER Sees:</span>
                  <ul className="text-sm text-blue-800 space-y-1 ml-7 mt-2">
                    <li>✗ Revenue numbers (e.g., €2.5M)</li>
                    <li>✗ EBITDA or profit margins</li>
                    <li>✗ Financial documents or statements</li>
                    <li>✗ Contract values or sensitive deals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Comparison: Traditional AI Tools vs. Upswitch
          </h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-900">Traditional AI Tools</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-green-900">Upswitch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Financial Documents</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Sent to OpenAI</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Private Servers</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Revenue/EBITDA Data</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Visible to LLM</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Hidden from LLM</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Extraction</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">GPT-4 Vision (External)</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Proprietary Engine</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">GDPR Compliance</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">⚠️ Risk</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Compliant</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Breach Risk</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">High</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Minimal</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">AI Benefits</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">Yes (but risky)</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Yes (safe & private)</td>
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
                <span>Why can't you just use OpenAI for everything?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                While OpenAI's GPT-4 is powerful, sending your financial documents to their servers means your sensitive business data (revenue, EBITDA, profit margins) would be processed on their infrastructure. This creates privacy risks, potential GDPR violations, and compliance issues. By using our own extraction engine for financial data, we keep your sensitive information secure while still leveraging AI for non-sensitive tasks.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>How accurate is your proprietary extraction engine?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Our extraction engine uses a combination of custom ML models, OCR (optical character recognition), and intelligent parsing algorithms. We show you a confidence score with each extraction, and you can always review and correct the data before calculating your valuation. Accuracy typically ranges from 85-95% depending on document quality.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>What happens to my data after the valuation?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Your data is stored securely in our encrypted database for the duration of your session and for a limited time afterward (typically 30 days) to allow you to return to your valuation. You can request immediate deletion at any time, and we comply with GDPR's "right to be forgotten."
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I still get AI help without risking my financial data?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Absolutely! In Step 2, our AI assistant helps with company lookups, qualitative questions, and clarifications. The AI only sees publicly available information (company name, industry, country) and your non-financial responses. This gives you the benefits of AI assistance without exposing sensitive financial data.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-200">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Try Our Privacy-First Valuation?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Experience the power of AI assistance without compromising your financial data security.
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
