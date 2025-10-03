import { useState } from 'react';
import { Header } from './components/Header';
import { DocumentUpload } from './components/DocumentUpload';
import { CompanyLookup } from './components/CompanyLookup';
import { ValuationForm } from './components/ValuationForm';
import { LivePreview } from './components/LivePreview';
import { Results } from './components/Results';
import { useValuationStore } from './store/useValuationStore';

function App() {
  const [activeMethod, setActiveMethod] = useState<'upload' | 'lookup' | 'manual'>('upload');
  const { result } = useValuationStore();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Beta Warning */}
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ Beta Testing Tool - Important Disclaimer
              </h3>
              <p className="text-yellow-700">
                This is a beta testing tool for evaluation purposes only. Valuations are
                estimates and should not be considered professional financial advice.
              </p>
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            How would you like to get started?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveMethod('upload')}
              className={`p-6 rounded-xl border-2 transition-all ${
                activeMethod === 'upload'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-semibold text-lg mb-2">Upload Documents</h3>
              <p className="text-sm text-gray-600">
                Upload financial statements and let AI extract the data
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                Phase 2 - Coming Soon
              </span>
            </button>

            <button
              onClick={() => setActiveMethod('lookup')}
              className={`p-6 rounded-xl border-2 transition-all ${
                activeMethod === 'lookup'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-lg mb-2">Company Lookup</h3>
              <p className="text-sm text-gray-600">
                Search your company and auto-fill public data
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                Phase 2 - Coming Soon
              </span>
            </button>

            <button
              onClick={() => setActiveMethod('manual')}
              className={`p-6 rounded-xl border-2 transition-all ${
                activeMethod === 'manual'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="text-4xl mb-3">✏️</div>
              <h3 className="font-semibold text-lg mb-2">Manual Entry</h3>
              <p className="text-sm text-gray-600">
                Enter your financial data manually
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded-full">
                ✅ Available Now
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeMethod === 'upload' && <DocumentUpload />}
            {activeMethod === 'lookup' && <CompanyLookup />}
            {activeMethod === 'manual' && <ValuationForm />}

            {/* Results */}
            {result && (
              <div className="mt-8">
                <Results />
              </div>
            )}
          </div>

          {/* Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <LivePreview />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
