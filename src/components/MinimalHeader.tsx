import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal Header Component for Home Page
 * 
 * Only displays the Upswitch logo, title, and BETA badge.
 * No navigation links - clean landing page experience.
 */
export const MinimalHeader: React.FC = () => {
  return (
    <header className="z-40 flex px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-start h-[var(--navbar-height)] max-w-full overflow-x-hidden bg-white border-b border-gray-200 sticky top-0 shadow-sm">
      {/* Logo and Title */}
      <div className="flex basis-0 flex-row flex-grow flex-nowrap justify-start bg-transparent items-center no-underline text-medium whitespace-nowrap box-border">
        <Link className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" to="/">
          {/* Upswitch Logo - Using var1 logo */}
          <img 
            src="/UpSwitch_logo_var1.svg" 
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
    </header>
  );
};
