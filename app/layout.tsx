import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/common/PageTransition';
import BackToTop from '@/components/common/BackToTop';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: '摄影作品集',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen" style={{ background: '#0f0f0f' }}>
        <Navbar />
        <PageTransition>
          <main>{children}</main>
        </PageTransition>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
