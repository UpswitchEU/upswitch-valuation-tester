import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal Header Component for Home Page
 * 
 * Ilara-style invisible header with Upswitch logo, title, and BETA badge.
 * Uses transparent background with backdrop blur for seamless integration.
 * No navigation links - clean landing page experience.
 */
export const MinimalHeader: React.FC = () => {
  return (
    <header className="z-40 flex px-6 py-4 gap-2 sm:gap-3 lg:gap-4 w-full flex-row flex-nowrap items-center justify-start max-w-full overflow-x-hidden bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800 sticky top-0">
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
    </header>
  );
};
