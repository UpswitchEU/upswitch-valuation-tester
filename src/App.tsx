import { useState } from 'react';
import { Header } from './components/Header';
import { TwoStepFlow } from './components/TwoStepFlow';
import { ValuationForm } from './components/ValuationForm';
import { Results } from './components/Results';
import { useValuationStore } from './store/useValuationStore';

type ViewMode = 'two-step' | 'manual';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('two-step');
  const { result } = useValuationStore();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Mode Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              {viewMode === 'two-step' ? '🔒 Privacy-First Valuation' : '✏️ Manual Entry'}
            </h2>
            <p className="text-gray-600">
              {viewMode === 'two-step'
                ? 'Secure document upload + AI assistant (your financial data stays private)'
                : 'Enter your business data manually'}
            </p>
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'two-step' ? 'manual' : 'two-step')}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            {viewMode === 'two-step' ? '✏️ Manual Mode' : '🔒 Privacy-First Mode'}
          </button>
        </div>

        {/* Content */}
        {viewMode === 'two-step' ? (
          <>
            <TwoStepFlow />
            
            {/* Results */}
            {result && (
              <div id="results" className="mt-8">
                <Results />
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <ValuationForm />
              </div>

              {/* Results */}
              {result && (
                <div id="results" className="mt-8">
                  <Results />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
