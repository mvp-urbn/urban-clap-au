import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Urban Clap AU — Home Services Made Simple',
  description:
    'Book professional home cleaning and services across Australia. Fixed prices, vetted contractors, instant confirmation.',
  keywords: ['home cleaning', 'house cleaning', 'cleaning service', 'Australia', 'booking'],
  openGraph: {
    title: 'Urban Clap AU',
    description: 'Professional home services. Fixed prices. Instant booking.',
    type: 'website',
    locale: 'en_AU',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
