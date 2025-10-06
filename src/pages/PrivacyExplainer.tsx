/**
 * Privacy Policy & Data Protection Explainer
 * Updated with information from Privacy & Compliance Whitepaper
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Server, CheckCircle, ArrowLeft, AlertTriangle, Database, FileText } from 'lucide-react';
import { urls } from '../router';

export const PrivacyExplainer: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={urls.home()}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Valuation Tool</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">Enterprise-Grade Privacy</span>
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
            Enterprise-Grade Data Protection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our 3-Pipeline Privacy Architecture ensures your sensitive financial data never leaves your infrastructure, 
            while still enabling AI-powered features for public data
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-16">
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Why Financial Data Privacy Matters
                </h2>
                <p className="text-gray-700 mb-4">
                  Financial data is uniquely sensitive. A data breach doesn't just leak information—it can <strong>destroy businesses, 
                  violate fiduciary duties, and trigger millions in fines</strong>.
                </p>
                
                <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
                  <h3 className="font-bold text-gray-900 mb-2">Real-World Consequences:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>2023:</strong> Manufacturing company's financials leaked → competitor undercut pricing → €5M revenue loss</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>2022:</strong> SaaS startup's metrics exposed → acquirer withdrew offer → valuation dropped 60%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>2021:</strong> Retailer's customer data breach → GDPR fine €3M → 2-year recovery</span>
                    </li>
                  </ul>
                </div>

                <h3 className="font-bold text-gray-900 mb-2">The AI Dilemma:</h3>
                <p className="text-gray-700 mb-4">
                  Traditional valuation tools send your financial documents to external AI services (like OpenAI GPT-4), creating serious risks:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Data leaves EU jurisdiction (GDPR Article 44 violation: €20M fine or 4% of global turnover)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Financial data stored on US servers (Schrems II ruling invalidates Privacy Shield)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Your revenue, EBITDA, and profit margins could be used for AI model training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>No control over data handling or deletion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <EyeOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Risk of SOC 2 compliance failure (lose enterprise customers)</span>
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
                  The Upswitch Solution: 3-Pipeline Privacy Architecture
                </h2>
                <p className="text-gray-700 mb-6">
                  We've engineered a revolutionary architecture that <strong>separates private financial data from public data and market data</strong>, 
                  ensuring sensitive information never leaves your secure infrastructure while still enabling AI-powered features.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="w-6 h-6 text-red-600" />
                      <h3 className="font-bold text-gray-900">Pipeline 1: Private</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>TOP SECRET - Never Externalized</strong>
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>✓ User-uploaded financials</li>
                      <li>✓ Revenue, EBITDA, margins</li>
                      <li>✓ Projections, trade secrets</li>
                      <li className="font-bold text-red-600">✗ NEVER sent to external AI</li>
                      <li className="font-bold text-green-600">✓ AES-256 encrypted</li>
                      <li className="font-bold text-green-600">✓ EU-only servers</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <h3 className="font-bold text-gray-900">Pipeline 2: Public</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>PUBLIC - AI-Safe</strong>
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>✓ Registry filings (KBO/BCE)</li>
                      <li>✓ Already public by law</li>
                      <li>✓ Companies House, etc.</li>
                      <li className="font-bold text-green-600">✓ SAFE to send to AI</li>
                      <li className="font-bold text-green-600">✓ Aggressive caching</li>
                      <li className="font-bold text-green-600">✓ No privacy concerns</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-6 h-6 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Pipeline 3: Market</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>MARKET DATA - No Privacy Risk</strong>
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>✓ OECD (GDP, inflation)</li>
                      <li>✓ ECB (interest rates)</li>
                      <li>✓ Industry benchmarks</li>
                      <li className="font-bold text-green-600">✓ No personal data</li>
                      <li className="font-bold text-green-600">✓ Global sources</li>
                      <li className="font-bold text-green-600">✓ No privacy concerns</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white border-2 border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-900">Result: AI Benefits Without Privacy Risks</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    You get the speed and intelligence of AI-powered features, with the security guarantee that your 
                    sensitive financial data never touches external services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GDPR Compliance */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            GDPR & Compliance Framework
          </h2>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Key Compliance Achievements</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">GDPR Compliant</p>
                    <p className="text-sm text-gray-600">Article 32 (Security), Article 44 (Data Transfers)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">SOC 2 Type II Ready</p>
                    <p className="text-sm text-gray-600">CC6 (Logical Access), CC7 (System Operations)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">ISO 27001 Aligned</p>
                    <p className="text-sm text-gray-600">Information Security Management System</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Privacy by Design</p>
                    <p className="text-sm text-gray-600">GDPR Article 25 (Built into architecture)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Data Minimization</p>
                    <p className="text-sm text-gray-600">Only collect what's necessary for valuation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Audit Logging</p>
                    <p className="text-sm text-gray-600">Every data access tracked and timestamped</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Subject Rights */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Data Rights (GDPR Articles 12-22)</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">Right of Access (Article 15)</h4>
                <p className="text-sm text-gray-700">
                  Export all your data in machine-readable JSON format. Includes account information, valuation history, 
                  uploaded documents metadata, and audit logs. <strong>Delivered within 1 month</strong>.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-gray-900 mb-2">Right to Erasure (Article 17)</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Complete data deletion within <strong>30 days</strong> with 14-day recovery grace period. Includes:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• User account and all valuations</li>
                  <li>• Uploaded documents (from encrypted storage)</li>
                  <li>• Financial data (encrypted database records)</li>
                  <li>• Audit logs (anonymized after 90 days for compliance)</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-2">Right to Data Portability (Article 20)</h4>
                  <p className="text-sm text-gray-700">
                    Download your data in JSON format to migrate to another service. Includes all user-provided data.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-gray-900 mb-2">Right to Rectification (Article 16)</h4>
                  <p className="text-sm text-gray-700">
                    Edit all input data directly in the UI. Changes reflected immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Security Best Practices
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Encryption Everywhere</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <p className="font-semibold text-gray-900">In Transit:</p>
                  <p>TLS 1.3, HSTS enforced, certificate pinning</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">At Rest:</p>
                  <p>AES-256-GCM, separate keys per tenant, 90-day rotation</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Key Storage:</p>
                  <p>AWS KMS / HashiCorp Vault</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Access Controls</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <p className="font-semibold text-gray-900">Multi-Factor Authentication:</p>
                  <p>Required for Premium/Enterprise users. TOTP, SMS backup, recovery codes</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Role-Based Access Control (RBAC):</p>
                  <p>Granular permissions, least privilege principle</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Data Sovereignty</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <p className="font-semibold text-gray-900">Private Data:</p>
                  <p>EU-only (Frankfurt). Never crosses borders</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">No Cross-Border Transfers:</p>
                  <p>GDPR Article 44 compliant. No Schrems II issues</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Audits:</p>
                  <p>Quarterly penetration tests, annual compliance audits</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Technical Implementation
          </h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Database-Level Security</h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Row-Level Security (RLS)
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  PostgreSQL Row-Level Security ensures users can only access their own data at the database level. 
                  Even if application security is bypassed, data isolation is enforced.
                </p>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                  CREATE POLICY user_isolation ON private_financial_data<br />
                  FOR ALL TO authenticated_users<br />
                  USING (user_id = current_setting('app.user_id'));
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Comprehensive Audit Logging
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Every access to financial data is logged with:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• Timestamp (ISO 8601, UTC)</li>
                  <li>• User ID and action (read, write, delete, export)</li>
                  <li>• Resource accessed (valuation ID, document ID)</li>
                  <li>• IP address (anonymized - last octet removed per GDPR)</li>
                  <li>• Result (success, denied, error)</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2 italic">
                  Logs are immutable, append-only, and retained for compliance (90 days minimum).
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Automated Security Monitoring
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Real-time detection of suspicious activity:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 ml-4">
                  <li>• 5+ failed access attempts in 1 hour → Account locked, alert sent</li>
                  <li>• Unusual data export patterns → Review flagged</li>
                  <li>• Multiple concurrent sessions → MFA re-challenge</li>
                  <li>• Irregular API usage → Rate limiting enforced</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Privacy Comparison
          </h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Security Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-900">Traditional Tools</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-green-900">Upswitch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Financial Data Storage</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">External AI servers</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">EU-only, encrypted</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">AI Processing</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Sees all financial data</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Public data only</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Transfer</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">US servers (GDPR risk)</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">No cross-border</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Encryption</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Basic TLS</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">TLS 1.3 + AES-256-GCM</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">GDPR Compliance</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">⚠️ Risk</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">✓ Certified</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Data Deletion</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Manual request</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">30 days (automated)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Audit Logging</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Basic</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Comprehensive + Immutable</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">SOC 2 Certification</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600">Often missing</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-semibold">Type II Ready</td>
                </tr>
              </tbody>
            </table>
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
                <span>How does the 3-Pipeline Architecture protect my data?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Our architecture separates three types of data: (1) <strong>Private Financial Data</strong> (revenue, EBITDA, margins) stays on EU-only servers, 
                never sent to external AI, encrypted with AES-256. (2) <strong>Public Company Data</strong> (registry filings, already legally public) can safely 
                use AI for enhancement. (3) <strong>Market Data</strong> (OECD, ECB indicators) has no privacy concerns. This separation ensures AI benefits 
                without privacy risks.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>What happens if I request data deletion?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                When you request account deletion (GDPR Right to Erasure), we soft-delete your data with a 14-day recovery window. After 14 days, 
                permanent deletion occurs: all user account data, valuations, uploaded documents, financial data, and encrypted records are irreversibly 
                deleted from all systems. Audit logs are anonymized (user ID replaced with "DELETED_USER") but retained for 90 days for compliance. 
                Total timeline: 30 days from request to complete deletion.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Are you GDPR compliant for EU users?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Yes. We're fully GDPR compliant with: (1) Article 32 (Security of Processing) - AES-256 encryption, TLS 1.3, audit logging. 
                (2) Article 44 (Data Transfers) - Private data stays in EU, no cross-border transfers. (3) Articles 12-22 (Data Subject Rights) - 
                Right of access, erasure, portability, rectification all implemented. (4) Article 25 (Privacy by Design) - Security built into architecture. 
                We're also SOC 2 Type II ready and ISO 27001 aligned.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Can I export my data?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                Yes, absolutely. Under GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability), you can request a full export 
                of your data in machine-readable JSON format. This includes: account information, valuation history, uploaded document metadata, 
                audit logs, and all user-provided financial data. The export is delivered within 1 month (GDPR requirement). No vendor lock-in—you 
                own your data.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>How do you detect security breaches?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                We use automated security monitoring with real-time alerts: (1) 5+ failed access attempts in 1 hour → Account locked, security team notified. 
                (2) Unusual data export patterns → Manual review triggered. (3) Multiple concurrent sessions → MFA re-challenge required. 
                (4) Irregular API usage → Rate limiting enforced. All events are logged in immutable audit logs for forensic analysis. We also conduct 
                quarterly penetration tests and vulnerability scans.
              </p>
            </details>

            <details className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                <span>Do you sell or share my data with third parties?</span>
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-gray-600 text-sm">
                <strong>No, never.</strong> We do not sell, rent, trade, or share your private financial data with any third parties. Your revenue, EBITDA, 
                profit margins, and all sensitive business data remain exclusively on our secure EU servers. External AI services (like OpenAI) only see 
                public company data (registry filings, already legally public). This is a core principle of our 3-Pipeline Architecture and a contractual 
                commitment to our users.
              </p>
            </details>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Security & Compliance Contacts
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="font-semibold text-gray-900 mb-2">Security Inquiries</p>
                <a href="mailto:security@upswitch.com" className="text-primary-600 hover:underline text-sm">
                  security@upswitch.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Data Protection Officer</p>
                <a href="mailto:dpo@upswitch.com" className="text-primary-600 hover:underline text-sm">
                  dpo@upswitch.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Incident Reports</p>
                <a href="mailto:incidents@upswitch.com" className="text-primary-600 hover:underline text-sm">
                  incidents@upswitch.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-200">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Ready for Enterprise-Grade Privacy?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Experience AI-powered business valuation with the confidence that your sensitive financial data is protected 
              by enterprise-grade security.
            </p>
            <Link
              to={urls.home()}
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
          <p className="text-gray-400 text-sm mb-2">
            © 2025 Upswitch. Enterprise-Grade Data Protection. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Privacy & Compliance Whitepaper v1.0 | GDPR Compliant | SOC 2 Type II Ready | ISO 27001 Aligned
          </p>
        </div>
      </footer>
    </div>
  );
};