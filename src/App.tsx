import { useState } from 'react';
import { Header } from './components/Header';
import { ValuationChat } from './components/ValuationChat';
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
        {/* Mode Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {useLegacyMode ? 'Manual Valuation' : '💬 Chat with AI'}
            </h2>
            <p className="text-gray-600">
              {useLegacyMode 
                ? 'Enter your business data manually' 
                : 'Have a conversation with AI to value your business'}
            </p>
          </div>
          <button
            onClick={() => setUseLegacyMode(!useLegacyMode)}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {useLegacyMode ? '🤖 Try AI Chat' : '✏️ Use Manual Form'}
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  {useLegacyMode ? (
                    <ValuationForm />
                  ) : (
                    <ValuationChat onValuationComplete={() => {
                      // Scroll to results when calculation completes
                      setTimeout(() => {
                        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                      }, 500);
                    }} />
                  )}

                  {/* Results */}
                  {result && (
                    <div id="results" className="mt-8">
                      <Results />
                    </div>
                  )}
                </div>

          {/* Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LivePreview />
              
              {/* AI Chat Benefits */}
              {!useLegacyMode && (
                <div className="mt-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    ✨ Why Chat with AI?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">💬</span>
                      <span><strong>Natural Conversation:</strong> Just talk like you would to an advisor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">📄</span>
                      <span><strong>Upload Docs:</strong> Drop your financials, AI extracts everything</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">🔍</span>
                      <span><strong>Auto-Lookup:</strong> Finds your company in registries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">⚡</span>
                      <span><strong>10x Faster:</strong> No forms, no tedious data entry</span>
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
