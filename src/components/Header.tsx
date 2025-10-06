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
    <>
      <header className="z-40 flex px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-between h-[var(--navbar-height)] max-w-full overflow-x-hidden bg-white border-b border-gray-200 sticky top-0 shadow-sm">
        {/* Left Side - Logo and Title */}
        <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
          <Link className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" to="/">
            {/* Upswitch Logo - Using the optimized var2 logo */}
            <img 
              src="/UpSwitch_logo_var2.svg" 
              alt="Upswitch Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 transition-opacity hover:opacity-80" 
              style={{ height: '32px', objectFit: 'contain', opacity: 1, visibility: 'visible', display: 'block' }}
            />
            
            {/* App Name - Matching main site typography */}
            <span className="font-display text-lg sm:text-xl font-light text-primary-700 leading-none mt-0.5 flex-shrink-0">
              Upswitch
              <span className="text-primary-600 font-medium"> Valuation</span>
            </span>
            
            {/* BETA Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-300 ml-2">
              BETA
            </span>
          </Link>
        </div>

        {/* Center - Navigation (Hidden on mobile, shown on desktop) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:block">
          <ul className="h-full flex-row flex-nowrap items-center flex gap-6">
            <li className="text-medium whitespace-nowrap box-border list-none flex items-center">
              <Link 
                className="text-sm font-medium transition-colors relative group text-neutral-700 hover:text-primary-600" 
                to="/"
              >
                Valuation Tool
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-600 transition-transform origin-left scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            </li>
            <li className="text-medium whitespace-nowrap box-border list-none">
              <Link 
                className="text-sm font-medium transition-colors relative group text-neutral-700 hover:text-primary-600" 
                to="/privacy-explainer"
              >
                Privacy
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-600 transition-transform origin-left scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Side - Status and User Info */}
        <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-end bg-transparent items-center min-w-0">
          <ul className="h-full flex-row flex-nowrap flex items-center gap-2 sm:gap-3 lg:gap-4" data-justify="end">
            {/* Engine Status - Desktop */}
            <li className="text-medium whitespace-nowrap box-border list-none hidden lg:flex items-center gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Engine Connected</span>
              </div>
            </li>
            
            {/* Mobile Menu Button */}
            <li className="text-medium whitespace-nowrap box-border list-none flex lg:hidden items-center gap-1.5 sm:gap-2">
              <button 
                type="button" 
                className="inline-flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-none focus:ring-3 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed outline-none cursor-pointer relative overflow-hidden bg-white font-medium hover:bg-neutral-50 focus:ring-neutral-500/30 shadow-sm hover:shadow-md active:scale-[0.98] border border-neutral-300 min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 p-2 rounded-lg text-neutral-700"
                aria-label="Open mobile menu"
              >
                <span className="flex items-center justify-center opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu w-5 h-5 sm:w-6 sm:h-6 text-neutral-700">
                    <line x1="4" x2="20" y1="12" y2="12"></line>
                    <line x1="4" x2="20" y1="6" y2="6"></line>
                    <line x1="4" x2="20" y1="18" y2="18"></line>
                  </svg>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </header>
      
      {/* Unified Beta Disclaimer Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
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
    </>
  );
};

