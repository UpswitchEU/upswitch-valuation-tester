/**
 * App Component (Enhanced with Code Splitting)
 * 
 * Enhanced version with improved code splitting strategy:
 * - Route-based splitting for pages
 * - Component-based splitting for heavy components
 * - Dynamic imports for rarely-used features
 * 
 * @module App
 */

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { generateReportId } from './utils/reportIdGenerator';
import UrlGeneratorService from './services/urlGenerator';

// Route-level code splitting - Pages
const ValuationReport = lazy(() => import('./components/ValuationReport').then(module => ({ default: module.ValuationReport })));
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

// Component-level code splitting - Heavy components (lazy loaded on demand)
// These will be imported dynamically when needed
// Note: Currently unused, kept for potential future use
const lazyComponents = {
  // Results view (heavy - charts, calculations)
  Results: lazy(() => import('./components/Results').then(m => ({ default: m.Results }))),
  
  // Valuation info panel (rarely used)
  ValuationInfoPanel: lazy(() => import('./components/ValuationInfoPanel').then(m => ({ default: m.ValuationInfoPanel }))),
  
  // Full report view (heavy HTML rendering)
  LiveValuationReport: lazy(() => import('./components/LiveValuationReport').then(m => ({ default: m.LiveValuationReport }))),
  
  // Progressive report (used during generation)
  ProgressiveValuationReport: lazy(() => import('./components/ProgressiveValuationReport').then(m => ({ default: m.ProgressiveValuationReport }))),
};

// Loading fallback component - shown while lazy components load
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="text-zinc-400">Loading valuation engine...</p>
    </div>
  </div>
);

// Lightweight loading skeleton for inline components
// Note: Currently unused, kept for potential future use
const InlineLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
  </div>
);

// Legacy route redirect component
const LegacyRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const newReportId = generateReportId();
    const searchParams = new URLSearchParams(location.search);
    
    // Detect flow type from pathname
    if (location.pathname === '/manual') {
      searchParams.set('flow', 'manual');
    } else if (location.pathname === '/ai-guided' || location.pathname === '/instant') {
      searchParams.set('flow', 'ai-guided');
    }
    
    const newUrl = `${UrlGeneratorService.reportById(newReportId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    navigate(newUrl, {
      replace: true,
      state: location.state,
    });
  }, [navigate, location]);
  
  return <LoadingFallback />;
};

// New report redirect component
const NewReportRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const newReportId = generateReportId();
    const searchParams = new URLSearchParams(location.search);
    const newUrl = `${UrlGeneratorService.reportById(newReportId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    navigate(newUrl, { replace: true });
  }, [navigate, location]);
  
  return <LoadingFallback />;
};

/**
 * Main App Component
 * 
 * Features:
 * - Route-based code splitting for all pages
 * - Suspense boundaries for graceful loading
 * - Legacy route redirects
 */
function App() {
  return (
    <Routes>
      {/* Main report route with unique ID */}
      <Route path="/reports/:reportId" element={
        <Suspense fallback={<LoadingFallback />}>
          <ValuationReport />
        </Suspense>
      } />
      
      {/* New report creation */}
      <Route path="/reports/new" element={<NewReportRedirect />} />
      
      {/* Legacy routes - redirect to new report */}
      <Route path="/manual" element={<LegacyRedirect />} />
      <Route path="/ai-guided" element={<LegacyRedirect />} />
      <Route path="/instant" element={<LegacyRedirect />} />
      
      {/* HomePage - accessible via both /home and / */}
      <Route path="/home" element={
        <Suspense fallback={<LoadingFallback />}>
          <HomePage />
        </Suspense>
      } />
      
      {/* Root path also shows HomePage */}
      <Route path="/" element={
        <Suspense fallback={<LoadingFallback />}>
          <HomePage />
        </Suspense>
      } />
      
      {/* 404 */}
      <Route path="*" element={
        <Suspense fallback={<LoadingFallback />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
}

export default App;

