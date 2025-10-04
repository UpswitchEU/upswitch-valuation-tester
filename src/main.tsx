import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { PrivacyExplainer } from './pages/PrivacyExplainer';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HeroUIProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/privacy-explainer" element={<PrivacyExplainer />} />
        </Routes>
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
    </BrowserRouter>
  </React.StrictMode>
);
