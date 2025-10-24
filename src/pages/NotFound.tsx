/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import { urls } from '../router/exports';
import { ScrollToTop } from '../utils';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <ScrollToTop />
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to={urls.home()}
            className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Home
          </Link>
          
          <Link
            to="/reports/new"
            className="block w-full px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
          >
            Start Valuation
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to={urls.howItWorks()} className="text-primary-600 hover:underline">
              How It Works
            </Link>
            <Link to={urls.about()} className="text-primary-600 hover:underline">
              About
            </Link>
            <Link to={urls.privacy()} className="text-primary-600 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
