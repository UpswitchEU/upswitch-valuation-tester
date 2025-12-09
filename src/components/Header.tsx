import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { FileText } from 'lucide-react'; // Removed with reports link
import { ChevronDown } from 'lucide-react';
// import { urls } from '../router'; // Removed with reports link
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Reports now on upswitch.biz
import { useAuth } from '../hooks/useAuth';
import { generalLogger } from '../utils/logger';
import { UserDropdown } from './UserDropdown';
import { CreditBadge } from './credits/CreditBadge';

/**
 * Header Component
 * 
 * Displays the Upswitch logo, BETA badge, and app title.
 * Matches the branding from the main Upswitch platform.
 */
export const Header: React.FC = () => {
  // const { reports } = useReportsStore(); // Deprecated: Reports now on upswitch.biz
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshAuth } = useAuth();
  console.log('🔵 [Header] User from useAuth:', user);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const valuationMethods = [
    { id: 'manual', label: 'Manual Input', path: '/manual', badge: 'Recommended' },
    { id: 'ai-guided', label: 'Conversational AI', path: '/ai-guided', badge: 'Premium' },
    { id: 'instant', label: 'Instant Valuation', path: '/instant' },
    { id: 'document', label: 'From Documents', path: '/upload' }
  ];

  // Determine current valuation method from URL
  const getCurrentMethod = () => {
    if (location.pathname.startsWith('/reports/')) return 'reports';
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/manual') return 'manual';
    if (location.pathname === '/ai-guided') return 'ai-guided';
    if (location.pathname === '/instant') return 'instant';
    if (location.pathname === '/upload') return 'document';
    return 'home';
  };

  const currentMethod = getCurrentMethod();

  const handleLogout = async () => {
    try {
      generalLogger.info('Logging out user');
      
      // Get backend URL from environment
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                        import.meta.env.VITE_API_BASE_URL || 
                        'https://web-production-8d00b.up.railway.app';
      
      // Call backend logout endpoint
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send authentication cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        generalLogger.info('Logout successful');
        // Refresh auth state to clear user data
        await refreshAuth();
      } else {
        generalLogger.warn('Logout request failed', { status: response.status });
        // Still refresh auth state in case session is already invalid
        await refreshAuth();
      }
    } catch (error) {
      generalLogger.error('Logout failed', { error });
      // Still refresh auth state to clear local state
      await refreshAuth();
    }
  };
  
  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <header className="z-40 flex px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-between h-[var(--navbar-height)] max-w-full overflow-visible bg-white border-b border-gray-200 sticky top-0 shadow-sm">
        {/* Left Side - Logo and Title */}
        <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
          <Link className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" to="/">
            {/* Upswitch Logo - Using dark logo */}
            <img 
              src="/logo_upswitch_dark.svg" 
              alt="Upswitch Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 transition-opacity hover:opacity-80" 
              style={{ height: '32px', objectFit: 'contain', opacity: 1, visibility: 'visible', display: 'block' }}
            />
            
            {/* Animated Gradient Circle - Ilara Style */}
            <div className="w-4 h-4 rounded bg-gradient-to-br from-primary-500 to-primary-700 animate-pulse ml-2"></div>
            
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
            <li className="text-medium whitespace-nowrap box-border list-none flex items-center relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-sm font-medium transition-colors relative group text-neutral-700 hover:text-primary-600 flex items-center gap-1.5"
              >
                Valuation
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-600 transition-transform origin-left scale-x-0 group-hover:scale-x-100"></span>
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {valuationMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        navigate(method.path);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        currentMethod === method.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700">{method.label}</span>
                      {method.badge && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          method.badge === 'Recommended' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {method.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </li>
            {/* DISABLED: Reports now shown on upswitch.biz */}
            {/* <li className="text-medium whitespace-nowrap box-border list-none">
              <Link 
                className="text-sm font-medium transition-colors relative group text-neutral-700 hover:text-primary-600 flex items-center gap-1.5" 
                to={urls.reports()}
              >
                <FileText className="w-4 h-4" />
                Reports
                {reports.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {reports.length}
                  </span>
                )}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-600 transition-transform origin-left scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            </li> */}
          </ul>
        </div>

        {/* Right Side - Status and User Info */}
        <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-end bg-transparent items-center min-w-0">
          <ul className="h-full flex-row flex-nowrap flex items-center gap-2 sm:gap-3 lg:gap-4" data-justify="end">
            {/* Flow Toggle Icons - Only show in report view */}
            {/* MOVED TO VALUATION TOOLBAR */}
            
            {/* Engine Status - Desktop */}
            
            {/* Engine Status - Desktop */}
            <li className="text-medium whitespace-nowrap box-border list-none hidden lg:flex items-center gap-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Engine Connected</span>
              </div>
            </li>
            
            {/* Credit Badge */}
            <li className="text-medium whitespace-nowrap box-border list-none hidden lg:flex items-center">
              <CreditBadge variant="compact" />
            </li>
            
            {/* User Avatar */}
            <li className="text-medium whitespace-nowrap box-border list-none flex items-center">
              <UserDropdown user={user} onLogout={handleLogout} />
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
      
      {/* Flow Switch Warning Modal moved to ValuationToolbar */}
    </>
  );
};

