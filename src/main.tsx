/**
 * Delphi - UpSwitch Valuation Tester Interface
 * The Oracle's wisdom for business insights
 * 
 * The home of the Oracle interface for business valuation testing
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './router';
import PlatformPasswordProtection from './shared/components/security/PlatformPasswordProtection';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <AuthProvider>
        <PlatformPasswordProtection>
          <RouterProvider router={router} />
        </PlatformPasswordProtection>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#111827',
            boxShadow: '0 12px 24px -6px rgba(20, 184, 166, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </HeroUIProvider>
  </React.StrictMode>
);
