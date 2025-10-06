/**
 * Router Configuration
 * 
 * Main router setup using React Router v7 (createBrowserRouter)
 */

import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { ROUTES } from './routes';
import { NotFound } from '../pages/NotFound';
import { PrivacyExplainer } from '../pages/PrivacyExplainer';
import { About } from '../pages/About';
import { HowItWorks } from '../pages/HowItWorks';

/**
 * Main application router
 */
export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <App />,
    errorElement: <NotFound />,
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

export { ROUTES } from './routes';
export { UrlGenerator, urls, isExternalUrl, isActiveRoute } from './urlGenerator';
