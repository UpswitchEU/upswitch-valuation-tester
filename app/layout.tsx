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
        {/* CRITICAL: Immediate cookie check script - runs before React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] ===========================================');
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Cookie check script running IMMEDIATELY');
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] This runs before React loads');
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Hostname:', window.location.hostname);
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Origin:', window.location.origin);
                
                const allCookies = document.cookie || 'none';
                const hasCookie = allCookies.includes('upswitch_session');
                const cookieMatch = allCookies.match(/upswitch_session=([^;]+)/);
                
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Cookie present:', hasCookie ? '✅✅✅ YES!' : '❌❌❌ NO!');
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] All cookies:', allCookies);
                
                if (cookieMatch) {
                  console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Cookie value length:', cookieMatch[1].length);
                  console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] Cookie prefix:', cookieMatch[1].substring(0, 20) + '...');
                }
                
                if (window.location.hostname.includes('valuation.')) {
                  console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] SUBDOMAIN DETECTED: valuation.upswitch.biz');
                  if (!hasCookie) {
                    console.error('❌❌❌ [IMMEDIATE SCRIPT] CRITICAL: No cookie on subdomain!');
                    console.error('❌❌❌ [IMMEDIATE SCRIPT] Cookie from main domain is NOT accessible');
                    console.error('❌❌❌ [IMMEDIATE SCRIPT] Check: DevTools → Application → Cookies');
                    console.error('❌❌❌ [IMMEDIATE SCRIPT] Expected: upswitch_session with domain .upswitch.biz');
                  } else {
                    console.log('✅✅✅ [IMMEDIATE SCRIPT] Cookie found on subdomain!');
                  }
                }
                
                console.log('🔍🔍🔍 [IMMEDIATE SCRIPT] ===========================================');
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
