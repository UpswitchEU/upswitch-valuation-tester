import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UpSwitch Valuation Tester',
  description: 'Professional business valuation platform',
  keywords: ['valuation', 'business', 'M&A', 'financial analysis'],
  authors: [{ name: 'UpSwitch Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}