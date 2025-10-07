import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { TwoStepFlow } from './components/TwoStepFlow';
import { AIAssistedValuation } from './components/registry/AIAssistedValuation';
import { ManualValuationFlow } from './components/ManualValuationFlow';
import { ROUTE_TO_VIEW_MODE, VIEW_MODE_TO_ROUTE } from './router/routes';

type ViewMode = 'ai-assisted' | 'manual' | 'document-upload';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine viewMode from route
  const routeBasedViewMode = (ROUTE_TO_VIEW_MODE[location.pathname as keyof typeof ROUTE_TO_VIEW_MODE] || 'ai-assisted') as ViewMode;
  const [viewMode, setViewMode] = useState<ViewMode>(routeBasedViewMode);
  
  // Sync URL with viewMode
  useEffect(() => {
    const newRoute = VIEW_MODE_TO_ROUTE[viewMode];
    if (location.pathname !== newRoute) {
      navigate(newRoute, { replace: true });
    }
  }, [viewMode, navigate, location.pathname]);

  // Full-screen Ilara-style layout for AI-assisted flow
  if (viewMode === 'ai-assisted') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <AIAssistedValuation />
      </div>
    );
  }

  // Full-screen Ilara-style layout for manual flow
  if (viewMode === 'manual') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <ManualValuationFlow />
      </div>
    );
  }

  // Standard layout for document-upload only
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Content */}

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
          </>
        )}
      </main>
    </div>
  );
}

export default App;
