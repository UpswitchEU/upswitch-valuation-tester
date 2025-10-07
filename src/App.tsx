import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { AIAssistedValuation } from './components/registry/AIAssistedValuation';
import { ManualValuationFlow } from './components/ManualValuationFlow';
import { DocumentUploadFlow } from './components/DocumentUploadFlow';
import { ROUTE_TO_VIEW_MODE, VIEW_MODE_TO_ROUTE } from './router/routes';

type ViewMode = 'ai-assisted' | 'manual' | 'document-upload';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine viewMode from route
  const routeBasedViewMode = (ROUTE_TO_VIEW_MODE[location.pathname as keyof typeof ROUTE_TO_VIEW_MODE] || 'ai-assisted') as ViewMode;
  const [viewMode] = useState<ViewMode>(routeBasedViewMode);
  
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

  // Full-screen Ilara-style layout for document upload flow
  if (viewMode === 'document-upload') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <DocumentUploadFlow />
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-zinc-400">The requested page could not be found.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
