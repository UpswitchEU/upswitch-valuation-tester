import { useState } from 'react';
import { Header } from './components/Header';
import { TwoStepFlow } from './components/TwoStepFlow';
import { ValuationForm } from './components/ValuationForm';
import { AIAssistedValuation } from './components/registry/AIAssistedValuation';
import { ValuationMethodSelector } from './components/ValuationMethodSelector';
import { Results } from './components/Results';
import { useValuationStore } from './store/useValuationStore';

type ViewMode = 'ai-assisted' | 'manual' | 'document-upload';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('ai-assisted');
  const { result } = useValuationStore();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Clean 3-Tab Interface */}
        <ValuationMethodSelector 
          viewMode={viewMode} 
          onModeChange={setViewMode} 
        />

        {/* Content */}
        {viewMode === 'ai-assisted' && (
          <>
            <AIAssistedValuation />
            
            {/* Results */}
            {result && (
              <div id="results" className="mt-8">
                <Results />
              </div>
            )}
          </>
        )}

        {viewMode === 'manual' && (
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

        {viewMode === 'document-upload' && (
          <>
            {/* Beta Warning for Document Upload */}
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Beta Feature - Experimental
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Document extraction is in beta with 60-70% accuracy. You'll be able to review and edit all extracted data before calculating your valuation.
                      For fastest results, we recommend using <button onClick={() => setViewMode('ai-assisted')} className="underline font-semibold hover:text-yellow-900">AI lookup</button> or <button onClick={() => setViewMode('manual')} className="underline font-semibold hover:text-yellow-900">manual entry</button>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <TwoStepFlow />
            
            {/* Results */}
            {result && (
              <div id="results" className="mt-8">
                <Results />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
