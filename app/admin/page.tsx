'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadForm from '@/components/admin/UploadForm';
import PhotoManager from '@/components/admin/PhotoManager';

export default function AdminPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">管理后台</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          退出登录
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Upload Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">上传照片</h2>
          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <UploadForm onUploadComplete={() => setRefreshKey((k) => k + 1)} />
          </div>
        </section>

        {/* Manage Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">管理照片</h2>
          <div className="bg-white rounded-2xl border border-black/5 p-6">
            <PhotoManager refreshKey={refreshKey} />
          </div>
        </section>
      </div>
    </div>
  );
}
