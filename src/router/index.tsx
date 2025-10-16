/**
 * Router Configuration
 * 
 * Main router setup using React Router v7 (createBrowserRouter)
 */

import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { ROUTES } from './routes';
import { HomePage } from '../pages/HomePage';
import { NotFound } from '../pages/NotFound';
import { PrivacyExplainer } from '../pages/PrivacyExplainer';
import { About } from '../pages/About';
import { HowItWorks } from '../pages/HowItWorks';
// import { Reports } from '../pages/Reports'; // DISABLED: Reports now shown on upswitch.biz

/**
 * Main application router
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.INSTANT_VALUATION,
    element: <App />,
  },
  {
    path: ROUTES.MANUAL_VALUATION,
    element: <App />,
  },
  {
    path: ROUTES.DOCUMENT_UPLOAD,
    element: <App />,
  },
  {
    path: ROUTES.RESULTS,
    element: <App />,
  },
  // 📝 DISABLED: Reports page removed - reports now displayed on upswitch.biz
  // This saves to database automatically and parent window shows reports
  // TODO: Re-enable for guest users (localStorage fallback)
  // {
  //   path: ROUTES.REPORTS,
  //   element: <Reports />,
  // },
  {
    path: ROUTES.PRIVACY,
    element: <PrivacyExplainer />,
  },
  {
    path: '/privacy-explainer',
    element: <PrivacyExplainer />,
  },
  {
    path: ROUTES.ABOUT,
    element: <About />,
  },
  {
    path: ROUTES.HOW_IT_WORKS,
    element: <HowItWorks />,
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFound />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

