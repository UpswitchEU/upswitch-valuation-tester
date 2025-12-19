import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'UpSwitch Valuation Tester',
    template: '%s | UpSwitch Valuation Tester',
  },
  description: 'Professional business valuation platform for testing and demonstration',
  keywords: ['valuation', 'business', 'M&A', 'financial analysis', 'business valuation'],
  authors: [{ name: 'UpSwitch Team' }],
  creator: 'UpSwitch',
  publisher: 'UpSwitch',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  icons: {
    icon: [
      {
        url: '/favicon-dark-square-var1.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon-16x16.svg',
        type: 'image/svg+xml',
        sizes: '16x16',
      },
      {
        url: '/favicon-32x32.svg',
        type: 'image/svg+xml',
        sizes: '32x32',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.svg',
        type: 'image/svg+xml',
        sizes: '180x180',
      },
    ],
    shortcut: '/favicon-dark-square-var1.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'UpSwitch Valuation Tester',
    title: 'UpSwitch Valuation Tester',
    description: 'Professional business valuation platform for testing and demonstration',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UpSwitch Valuation Tester',
    description: 'Professional business valuation platform',
  },
  robots: {
    index: false, // Tester app should not be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ FIX: Use manual meta tag for viewport to support Next.js 13.5.6 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Manifest is still referenced here as it's not part of metadata API */}
        <link rel="manifest" href="/manifest.json" />
        {/* CRITICAL: Force Service Worker update check and cache clear */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  // Force update check
                  navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (reg) {
                      console.log('[SW Force Update] Checking for updates...')
                      reg.update()
                    }
                  }).catch(function(err) {
                    console.error('[SW Force Update] Error:', err)
                  })
                  
                  // Clear all caches to ensure fresh content
                  caches.keys().then(function(names) {
                    console.log('[Cache Clear] Found caches:', names)
                    return Promise.all(
                      names.map(function(name) {
                        console.log('[Cache Clear] Deleting cache:', name)
                        return caches.delete(name)
                      })
                    )
                  }).then(function() {
                    console.log('[Cache Clear] All caches cleared')
                  }).catch(function(err) {
                    console.error('[Cache Clear] Error:', err)
                  })
                }
              })();
            `,
          }}
        />
        {/* CRITICAL: Pre-React cookie check script - runs before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // CRITICAL: Use console.error for maximum visibility - these logs MUST appear
                console.error('🔍🔍🔍 [PRE-REACT] ===========================================');
                console.error('🔍🔍🔍 [PRE-REACT] PRE-REACT COOKIE CHECK SCRIPT RUNNING');
                console.error('🔍🔍🔍 [PRE-REACT] This runs BEFORE React loads');
                console.error('🔍🔍🔍 [PRE-REACT] Timestamp:', new Date().toISOString());
                console.error('🔍🔍🔍 [PRE-REACT] Hostname:', window.location.hostname);
                console.error('🔍🔍🔍 [PRE-REACT] Origin:', window.location.origin);
                
                // Also log to console.log as backup
                console.log('🔍🔍🔍 [PRE-REACT] ===========================================');
                console.log('🔍🔍🔍 [PRE-REACT] PRE-REACT COOKIE CHECK SCRIPT RUNNING');
                console.log('🔍🔍🔍 [PRE-REACT] This runs BEFORE React loads');
                
                const allCookies = document.cookie || 'none';
                const hasCookie = allCookies.includes('upswitch_session');
                const cookieMatch = allCookies.match(/upswitch_session=([^;]+)/);
                
                // Set global flag for React to check
                window.__COOKIE_CHECK__ = {
                  hasCookie: hasCookie,
                  timestamp: new Date().toISOString(),
                  hostname: window.location.hostname,
                  origin: window.location.origin,
                  allCookies: allCookies,
                  cookieValueLength: cookieMatch ? cookieMatch[1].length : 0
                };
                
                console.error('🔍🔍🔍 [PRE-REACT] Cookie present:', hasCookie ? '✅✅✅ YES!' : '❌❌❌ NO!');
                console.error('🔍🔍🔍 [PRE-REACT] All cookies:', allCookies);
                
                if (cookieMatch) {
                  console.error('🔍🔍🔍 [PRE-REACT] Cookie value length:', cookieMatch[1].length);
                  console.error('🔍🔍🔍 [PRE-REACT] Cookie prefix:', cookieMatch[1].substring(0, 20) + '...');
                }
                
                if (window.location.hostname.includes('valuation.')) {
                  console.error('🔍🔍🔍 [PRE-REACT] SUBDOMAIN DETECTED: valuation.upswitch.biz');
                  if (!hasCookie) {
                    console.error('❌❌❌ [PRE-REACT] CRITICAL: No cookie on subdomain!');
                    console.error('❌❌❌ [PRE-REACT] Cookie from main domain is NOT accessible');
                    console.error('❌❌❌ [PRE-REACT] Possible causes:');
                    console.error('❌❌❌ [PRE-REACT]   1. Cookie not set with domain: .upswitch.biz');
                    console.error('❌❌❌ [PRE-REACT]   2. Browser blocking cross-subdomain cookies');
                    console.error('❌❌❌ [PRE-REACT]   3. Cookie expired or cleared');
                    console.error('❌❌❌ [PRE-REACT]   4. Not logged into upswitch.biz');
                    console.error('❌❌❌ [PRE-REACT] Action: Check DevTools → Application → Cookies');
                    console.error('❌❌❌ [PRE-REACT] Expected: upswitch_session with domain .upswitch.biz');
                  } else {
                    console.error('✅✅✅ [PRE-REACT] Cookie found on subdomain!');
                  }
                }
                
                console.error('🔍🔍🔍 [PRE-REACT] Global flag set: window.__COOKIE_CHECK__');
                console.error('🔍🔍🔍 [PRE-REACT] ===========================================');
                
                // Also log to console.log as backup
                console.log('🔍🔍🔍 [PRE-REACT] Global flag set: window.__COOKIE_CHECK__');
                console.log('🔍🔍🔍 [PRE-REACT] ===========================================');
              })();
            `,
          }}
        />
      </head>
      <body className="bg-zinc-950 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
