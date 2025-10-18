import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ROUTE_TO_VIEW_MODE, VIEW_MODE_TO_ROUTE } from './router/routes';
import { ScrollToTop } from './utils';

// Lazy load heavy components
const AIAssistedValuation = lazy(() => import('./components/AIAssistedValuation').then(module => ({ default: module.AIAssistedValuation })));
const ManualValuationFlow = lazy(() => import('./components/ManualValuationFlow').then(module => ({ default: module.ManualValuationFlow })));
const DocumentUploadFlow = lazy(() => import('./components/DocumentUploadFlow').then(module => ({ default: module.DocumentUploadFlow })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="text-zinc-400">Loading valuation engine...</p>
    </div>
  </div>
);

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
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <AIAssistedValuation />
        </Suspense>
      </div>
    );
  }

  // Full-screen Ilara-style layout for manual flow
  if (viewMode === 'manual') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <ManualValuationFlow />
        </Suspense>
      </div>
    );
  }

  // Full-screen Ilara-style layout for document upload flow
  if (viewMode === 'document-upload') {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <DocumentUploadFlow />
        </Suspense>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-gradient-hero">
      <ScrollToTop />
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
