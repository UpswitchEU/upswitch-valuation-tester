/**
 * Router Configuration
 * 
 * Main router setup using React Router v7 (createBrowserRouter)
 */

import { createBrowserRouter } from 'react-router-dom';
import App from '../App';

/**
 * Main application router
 * 
 * Simplified to use catch-all route to avoid conflicts with App.tsx routing.
 * All routing logic is now handled in App.tsx.
 */
export const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
    errorElement: (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-zinc-400 mb-4">Something went wrong.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    ),
  },
]);

