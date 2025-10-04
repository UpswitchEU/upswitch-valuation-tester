import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header Component
 * 
 * Displays the Upswitch logo, BETA badge, and app title.
 * Matches the branding from the main Upswitch platform.
 */
export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and BETA Badge */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Upswitch Logo */}
              <svg 
                className="h-8 w-8 text-primary-600" 
                viewBox="0 0 40 40" 
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Arrow Up Icon representing "Up"switch */}
                <path d="M20 4L4 20h10v16h12V20h10L20 4z" />
              </svg>
              
              {/* App Name */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Upswitch
                  <span className="text-primary-600"> Valuation</span>
                </h1>
              </div>
              
              {/* BETA Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-300">
                BETA
              </span>
            </div>
          </div>

          {/* Right Side - Status/Info */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Engine Connected</span>
            </div>
          </div>
        </div>

        {/* Unified Beta Disclaimer Banner */}
        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong className="font-semibold">⚠️ Beta Testing Tool - Important Disclaimer:</strong> This is a beta testing version of the Upswitch Valuation Engine for evaluation purposes only. 
                Valuations are estimates and should not be considered professional financial advice or used as the sole basis for business decisions. 
                Always consult with qualified financial advisors for important transactions.{' '}
                <Link 
                  to="/privacy-explainer" 
                  className="font-semibold underline hover:text-yellow-800 transition-colors"
                >
                  Learn how we protect your financial data →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

