'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Photo, PhotoCategory } from '@/lib/types';

interface PhotoManagerProps {
  refreshKey: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

function sortPhotos(photos: Photo[], sort: SortOption): Photo[] {
  const sorted = [...photos];
  switch (sort) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'name-asc':
      return sorted.sort((a, b) => a.id.localeCompare(b.id));
    case 'name-desc':
      return sorted.sort((a, b) => b.id.localeCompare(a.id));
  }
}

export default function PhotoManager({ refreshKey }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [featuredUpdating, setFeaturedUpdating] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Caption editing modal
  const [captionModal, setCaptionModal] = useState<{ id: string; current: string } | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const [captionSaving, setCaptionSaving] = useState(false);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchWorking, setBatchWorking] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/photos')
      .then((r) => r.json())
      .then((data) => { setPhotos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  function exitBatch() {
    setBatchMode(false);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function selectAll() {
    setSelected(new Set(photos.map((p) => p.id)));
  }

  function openCaptionModal(photo: Photo) {
    setCaptionModal({ id: photo.id, current: photo.caption ?? '' });
    setCaptionValue(photo.caption ?? '');
  }

  async function saveCaption() {
    if (!captionModal) return;
    setCaptionSaving(true);
    try {
      await fetch(`/api/photos/${encodeURIComponent(captionModal.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: captionValue }),
      });
      setPhotos((prev) => prev.map((p) => p.id === captionModal.id ? { ...p, caption: captionValue } : p));
      setCaptionModal(null);
    } catch {
      alert('保存失败，请重试');
    }
    setCaptionSaving(false);
  }

  // ── Single-photo actions ──────────────────────────────────────────────

  async function handleDelete(photo: Photo) {
    if (!confirm('确定要删除这张照片吗？')) return;
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    const res = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, { method: 'DELETE' });
    if (!res.ok) {
      setPhotos((prev) => [...prev, photo]);
      alert('删除失败，请重试');
    }
  }

  async function handleFeaturedToggle(photo: Photo) {
    if (featuredUpdating.has(photo.id)) return;
    const newFeatured = !photo.featured;
    setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, featured: newFeatured } : p));
    setFeaturedUpdating((prev) => new Set(prev).add(photo.id));

    const res = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: newFeatured }),
    });

    setFeaturedUpdating((prev) => { const s = new Set(prev); s.delete(photo.id); return s; });
    if (!res.ok) {
      setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, featured: photo.featured } : p));
      alert('操作失败，请重试');
    }
  }

  async function handleCategoryToggle(photo: Photo, category: PhotoCategory) {
    if (updating.has(photo.id)) return;
    const hasCategory = photo.categories.includes(category);
    // Must keep at least one category
    if (hasCategory && photo.categories.length <= 1) return;
    const newCategories = hasCategory
      ? photo.categories.filter((c) => c !== category)
      : [...photo.categories, category];
    setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, categories: newCategories } : p));
    setUpdating((prev) => new Set(prev).add(photo.id));

    const res = await fetch(`/api/photos/${encodeURIComponent(photo.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, enabled: !hasCategory }),
    });

    setUpdating((prev) => { const s = new Set(prev); s.delete(photo.id); return s; });
    if (!res.ok) {
      setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, categories: photo.categories } : p));
      alert('分类修改失败，请重试');
    }
  }

  // ── Batch actions ─────────────────────────────────────────────────────

  async function batchDelete() {
    if (selected.size === 0) return;
    if (!confirm(`确定删除选中的 ${selected.size} 张照片？此操作不可撤销。`)) return;
    setBatchWorking(true);
    const ids = Array.from(selected);
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' })
    ));
    setBatchWorking(false);
  }

  async function batchToggleCategory(category: PhotoCategory, enabled: boolean) {
    if (selected.size === 0) return;
    setBatchWorking(true);
    const ids = Array.from(selected);
    setPhotos((prev) => prev.map((p) => {
      if (!ids.includes(p.id)) return p;
      let newCategories: PhotoCategory[];
      if (enabled) {
        newCategories = p.categories.includes(category) ? p.categories : [...p.categories, category];
      } else {
        // Don't remove if it's the only category
        if (p.categories.length <= 1 && p.categories.includes(category)) return p;
        newCategories = p.categories.filter((c) => c !== category);
      }
      return { ...p, categories: newCategories };
    }));
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, enabled }),
      })
    ));
    setBatchWorking(false);
    setSelected(new Set());
  }

  async function batchSetFeatured(featured: boolean) {
    if (selected.size === 0) return;
    setBatchWorking(true);
    const ids = Array.from(selected);
    setPhotos((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, featured } : p));
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured }),
      })
    ));
    setBatchWorking(false);
    setSelected(new Set());
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">暂无照片</p>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{photos.length} 张照片</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-black/10 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
          >
            <option value="date-desc">日期 ↓ 最新</option>
            <option value="date-asc">日期 ↑ 最早</option>
            <option value="name-asc">名称 A→Z</option>
            <option value="name-desc">名称 Z→A</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {batchMode && (
            <button
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg border border-black/10"
              onClick={selected.size === photos.length ? () => setSelected(new Set()) : selectAll}
            >
              {selected.size === photos.length ? '取消全选' : '全选'}
            </button>
          )}
          <button
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
              batchMode
                ? 'bg-gray-900 text-white hover:bg-gray-700'
                : 'border border-black/10 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => batchMode ? exitBatch() : setBatchMode(true)}
          >
            {batchMode ? '退出批量' : '批量管理'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sortPhotos(photos, sortBy).map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                batchMode ? 'cursor-pointer' : 'group'
              } ${batchMode && isSelected ? 'ring-2 ring-blue-500' : ''}`}
              onClick={batchMode ? () => toggleSelect(photo.id) : undefined}
            >
              <Image
                src={photo.url}
                alt=""
                width={300}
                height={300}
                className="w-full h-full object-cover aspect-square"
                draggable={false}
              />

              {/* Batch mode: checkbox overlay */}
              {batchMode && (
                <div className="absolute inset-0 bg-black/10">
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/80 border-white'
                  }`}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* Normal mode: badges + hover overlay */}
              {!batchMode && (
                <>
                  {/* Top badges */}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {photo.featured && (
                      <span className="bg-yellow-400 text-yellow-900 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                        ★ 首页
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-stretch justify-end p-2 gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      className={`text-xs px-2 py-1 rounded transition-colors text-left disabled:opacity-50 ${
                        photo.featured
                          ? 'bg-yellow-400/90 text-yellow-900 hover:bg-yellow-300'
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      onClick={() => handleFeaturedToggle(photo)}
                      disabled={featuredUpdating.has(photo.id)}
                    >
                      {featuredUpdating.has(photo.id) ? '更新中…' : (photo.featured ? '★ 已选为首页' : '☆ 设为首页轮播')}
                    </button>
                    {/* Category toggles */}
                    {(['commercial', '工作样片'] as const).map((_, idx) => {
                      const cat: PhotoCategory = idx === 0 ? 'commercial' : 'personal';
                      const label = idx === 0 ? '工作样片' : '样片';
                      const active = photo.categories.includes(cat);
                      const isOnly = active && photo.categories.length <= 1;
                      return (
                        <button
                          key={cat}
                          className={`text-xs px-2 py-1 rounded transition-colors text-left disabled:opacity-50 ${
                            active
                              ? 'bg-white/90 text-gray-900 hover:bg-white'
                              : 'bg-black/60 text-white/60 hover:bg-black/80'
                          }`}
                          onClick={() => handleCategoryToggle(photo, cat)}
                          disabled={updating.has(photo.id) || isOnly}
                          title={isOnly ? '至少保留一个分类' : undefined}
                        >
                          <span className="opacity-60">{active ? '✓' : '○'}</span> {label}
                        </button>
                      );
                    })}
                    <button
                      className="text-xs px-2 py-1 rounded transition-colors text-left bg-black/60 text-white/70 hover:bg-black/80"
                      onClick={() => openCaptionModal(photo)}
                    >
                      ✏ {photo.caption ? '编辑简介' : '添加简介'}
                    </button>
                    <button
                      className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                      onClick={() => handleDelete(photo)}
                    >
                      删除
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Caption edit modal */}
      {captionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setCaptionModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">照片简介 / 故事</h3>
            <p className="text-xs text-gray-400 mb-4">这段文字将在访客点开照片时显示</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              rows={5}
              placeholder="写下这张照片背后的故事、拍摄背景或创作心得…"
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                className="text-sm px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors"
                onClick={() => setCaptionModal(null)}
                disabled={captionSaving}
              >
                取消
              </button>
              <button
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                onClick={saveCaption}
                disabled={captionSaving}
              >
                {captionSaving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch action bar */}
      {batchMode && (
        <div className={`mt-4 p-4 bg-gray-900 rounded-2xl flex flex-wrap items-center gap-3 transition-opacity ${
          selected.size > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}>
          <span className="text-sm text-white/60 mr-auto">
            已选 <span className="text-white font-semibold">{selected.size}</span> 张
          </span>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            onClick={() => batchToggleCategory('commercial', true)}
            disabled={batchWorking}
          >
            + 工作样片
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors disabled:opacity-50"
            onClick={() => batchToggleCategory('commercial', false)}
            disabled={batchWorking}
          >
            − 工作样片
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            onClick={() => batchToggleCategory('personal', true)}
            disabled={batchWorking}
          >
            + 样片
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors disabled:opacity-50"
            onClick={() => batchToggleCategory('personal', false)}
            disabled={batchWorking}
          >
            − 样片
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 transition-colors disabled:opacity-50"
            onClick={() => batchSetFeatured(true)}
            disabled={batchWorking}
          >
            ★ 设为首页
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors disabled:opacity-50"
            onClick={() => batchSetFeatured(false)}
            disabled={batchWorking}
          >
            ☆ 取消首页
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
            onClick={batchDelete}
            disabled={batchWorking}
          >
            {batchWorking ? '处理中…' : '删除选中'}
          </button>
        </div>
      )}
    </div>
  );
}
