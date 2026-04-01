import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理后台 — Portfolio',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div data-admin>{children}</div>;
}
