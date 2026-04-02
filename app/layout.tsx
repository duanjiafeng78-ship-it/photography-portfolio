import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/common/PageTransition';
import BackToTop from '@/components/common/BackToTop';

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portfolio',
  description: '摄影作品集',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen" style={{ background: '#0f0f0f' }}>
        <Navbar />
        <PageTransition>
          <main>{children}</main>
        </PageTransition>
        <Footer />
        <BackToTop />
        <Analytics />
      </body>
    </html>
  );
}
