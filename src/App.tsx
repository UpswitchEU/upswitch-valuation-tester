import { useState } from 'react';
import { Header } from './components/Header';
import { SmartValuationFlow } from './components/SmartValuationFlow';
import { ValuationForm } from './components/ValuationForm';
import { LivePreview } from './components/LivePreview';
import { Results } from './components/Results';
import { useValuationStore } from './store/useValuationStore';

function App() {
  const [useLegacyMode, setUseLegacyMode] = useState(false);
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

        {/* Mode Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {useLegacyMode ? 'Manual Valuation' : 'AI-Powered Valuation'}
            </h2>
            <p className="text-gray-600">
              {useLegacyMode 
                ? 'Enter your business data manually' 
                : 'Upload documents and let AI do the work'}
            </p>
          </div>
          <button
            onClick={() => setUseLegacyMode(!useLegacyMode)}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {useLegacyMode ? '🤖 Try AI Mode' : '✏️ Use Manual Mode'}
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {useLegacyMode ? (
              <ValuationForm />
            ) : (
              <SmartValuationFlow />
            )}

            {/* Results */}
            {result && (
              <div className="mt-8">
                <Results />
              </div>
            )}
          </div>

          {/* Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LivePreview />
              
              {/* AI Flow Benefits */}
              {!useLegacyMode && (
                <div className="mt-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ✨ AI-Powered Benefits
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">✓</span>
                      <span><strong>10x Faster:</strong> Upload docs instead of typing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">✓</span>
                      <span><strong>Auto-Fill:</strong> Company lookup from registries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">✓</span>
                      <span><strong>Smart AI:</strong> Clarifies ambiguous data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">✓</span>
                      <span><strong>Accurate:</strong> Reduces human error</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
