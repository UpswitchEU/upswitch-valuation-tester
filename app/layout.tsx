import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

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
        {/* Manifest is still referenced here as it's not part of metadata API */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-zinc-950 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
