import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { generateReportId } from './utils/reportIdGenerator';
import UrlGeneratorService from './services/urlGenerator';

// Lazy load heavy components
const ValuationReport = lazy(() => import('./components/ValuationReport').then(module => ({ default: module.ValuationReport })));
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const PrivacyExplainer = lazy(() => import('./pages/PrivacyExplainer').then(module => ({ default: module.PrivacyExplainer })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const HowItWorks = lazy(() => import('./pages/HowItWorks').then(module => ({ default: module.HowItWorks })));
const NotFound = lazy(() => import('./pages/NotFound').then(module => ({ default: module.NotFound })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="text-zinc-400">Loading valuation engine...</p>
    </div>
  </div>
);

// Legacy route redirect component
const LegacyRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const newReportId = generateReportId();
    // Preserve all URL parameters (query string)
    const searchParams = new URLSearchParams(location.search);
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
  
  useEffect(() => {
    const newReportId = generateReportId();
    navigate(UrlGeneratorService.reportById(newReportId), { replace: true });
  }, [navigate]);
  
  return <LoadingFallback />;
};

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
      
      {/* Home redirects to new report */}
      <Route path="/" element={
        <Suspense fallback={<LoadingFallback />}>
          <HomePage />
        </Suspense>
      } />
      
      {/* Info pages */}
      <Route path="/privacy" element={
        <Suspense fallback={<LoadingFallback />}>
          <PrivacyExplainer />
        </Suspense>
      } />
      <Route path="/about" element={
        <Suspense fallback={<LoadingFallback />}>
          <About />
        </Suspense>
      } />
      <Route path="/how-it-works" element={
        <Suspense fallback={<LoadingFallback />}>
          <HowItWorks />
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
