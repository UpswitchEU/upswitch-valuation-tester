import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generalLogger } from '../utils/logger';
import { UserDropdown } from './UserDropdown';

/**
 * Minimal Header Component for Home Page
 * 
 * Ilara-style invisible header with Upswitch logo, title, and BETA badge.
 * Uses transparent background with backdrop blur for seamless integration.
 * No navigation links - clean landing page experience.
 */
export const MinimalHeader: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  console.log('🔵 [MinimalHeader] User from useAuth:', user);

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
      {/* Skip Link for Keyboard Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <header className="fixed top-0 left-0 right-0 z-50 flex px-6 py-4 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-between max-w-full overflow-visible bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
      {/* Logo and Title */}
      <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
        <Link className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" to="/">
          {/* Upswitch Logo - Using dark logo */}
          <img 
            src="/logo_upswitch_dark.svg" 
            alt="Upswitch Logo" 
            className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 transition-opacity hover:opacity-80" 
            style={{ height: '32px', objectFit: 'contain', opacity: 1, visibility: 'visible', display: 'block' }}
          />
          
          {/* App Name - Dark theme typography */}
          <span className="font-display text-lg sm:text-xl font-light text-white leading-none mt-0.5 flex-shrink-0">
            Upswitch
            <span className="text-zinc-300 font-light"> Valuation</span>
          </span>
          
          {/* BETA Badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800/50 text-zinc-200 border border-zinc-700/50 ml-2">
            BETA
          </span>
        </Link>
      </div>
      
      {/* User Avatar - Right side */}
      <div className="flex items-center">
        <UserDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
    </>
  );
};
