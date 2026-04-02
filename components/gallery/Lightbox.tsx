'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Photo } from '@/lib/types';

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

interface ExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focalLength?: string;
  dateTaken?: string;
}

function parseExif(raw: Record<string, string>): ExifData {
  const make = (raw.Make || '').trim();
  const model = (raw.Model || '').trim();
  // Avoid "Sony ILCE-7M4 ILCE-7M4" duplicates
  const camera = model.startsWith(make) ? model : [make, model].filter(Boolean).join(' ') || undefined;

  const fNum = raw.FNumber;
  const aperture = fNum ? `f/${parseFloat(fNum).toFixed(1)}` : undefined;

  const et = raw.ExposureTime;
  let shutter: string | undefined;
  if (et) {
    const val = parseFloat(et);
    shutter = val >= 1 ? `${val}s` : `1/${Math.round(1 / val)}s`;
  }

  const iso = raw.ISOSpeedRatings ? `ISO ${raw.ISOSpeedRatings}` : undefined;

  const fl = raw.FocalLength;
  const focalLength = fl ? `${parseFloat(fl).toFixed(0)}mm` : undefined;

  const lens = raw.LensModel || raw.Lens || undefined;

  const dateRaw = raw.DateTimeOriginal || raw.DateTime;
  let dateTaken: string | undefined;
  if (dateRaw) {
    // "2024:03:15 14:30:00" → "2024-03-15"
    dateTaken = dateRaw.substring(0, 10).replace(/:/g, '-');
  }

  return { camera, lens, aperture, shutter, iso, focalLength, dateTaken };
}

export default function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [entering, setEntering] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [exif, setExif] = useState<ExifData | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false); // mobile info drawer
  const touchStartX = useRef<number | null>(null);
  const lastTap = useRef<number>(0);

  const navigate = useCallback((newIndex: number) => {
    setTransitioning(true);
    setExif(null);
    setTimeout(() => {
      setIndex(newIndex);
      setTransitioning(false);
    }, 150);
  }, []);

  const prev = useCallback(() => navigate((index - 1 + photos.length) % photos.length), [index, photos.length, navigate]);
  const next = useCallback(() => navigate((index + 1) % photos.length), [index, photos.length, navigate]);

  const handleClose = useCallback(() => {
    setEntering(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Open animation
  useEffect(() => {
    requestAnimationFrame(() => setEntering(false));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [handleClose, prev, next]);

  // Fetch EXIF data when photo changes
  useEffect(() => {
    const photo = photos[index];
    setExifLoading(true);
    fetch(`/api/photos/${encodeURIComponent(photo.id)}`)
      .then((r) => r.json())
      .then((data) => {
        setExif(data.exif ? parseExif(data.exif) : null);
        setExifLoading(false);
      })
      .catch(() => setExifLoading(false));
  }, [index, photos]);

  const current = photos[index];

  // Double-tap / double-click handler
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) setInfoOpen((v) => !v);
    lastTap.current = now;
  };

  const hasInfo = !!(current.caption || exif);

  const content = (
    <div
      className={`fixed inset-0 z-50 flex flex-col md:flex-row transition-all duration-300 ${
        entering ? 'opacity-0' : 'opacity-100'
      } bg-[#0d0d0d]`}
    >
      {/* ── Photo area ── */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: 0 }}
        onClick={handleClose}
      >
        {/* Navigation — prev */}
        {photos.length > 1 && (
          <button
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/40 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="上一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Photo */}
        <div
          className={`relative transition-all duration-300 max-w-full max-h-full px-14 py-14 md:py-16 ${
            transitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'
          }`}
          style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'default',
            WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
            userSelect: 'none',
          }}
          onClick={handleImageClick}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
            touchStartX.current = null;
          }}
        >
          <Image
            src={current.url}
            alt=""
            width={current.width}
            height={current.height}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-sm select-none"
            style={{ maxHeight: 'calc(100dvh - 112px)', maxWidth: '100%' }}
            draggable={false}
            priority
            sizes="(min-width: 768px) calc(100vw - 320px), 100vw"
          />
        </div>

        {/* Navigation — next */}
        {photos.length > 1 && (
          <button
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/40 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="下一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Top-left: counter */}
        <div
          className="absolute top-0 left-0 z-10 px-4 py-3 text-white/30 text-xs tracking-widest"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          {index + 1} / {photos.length}
        </div>

        {/* Top-right: close + mobile info toggle */}
        <div
          className="absolute top-0 right-0 z-10 flex items-center gap-1 px-2"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
          {hasInfo && (
            <button
              className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setInfoOpen((v) => !v); }}
              aria-label="查看信息"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          )}
          <button
            className="p-2 text-white/40 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="关闭"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Info panel (desktop: right sidebar; mobile: slide-up drawer) ── */}
      <div
        className={`
          md:w-[300px] md:flex-shrink-0 md:border-l md:border-white/8 md:flex md:flex-col md:overflow-y-auto
          ${/* mobile: bottom drawer */ ''}
          fixed md:static bottom-0 left-0 right-0 z-20
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${infoOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          bg-[#111] md:bg-transparent
          max-h-[60dvh] md:max-h-none
          rounded-t-2xl md:rounded-none
          overflow-y-auto md:overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="p-5 md:p-6 space-y-5 flex-1">
          {/* Caption / Story */}
          {current.caption && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2">故事</p>
              <p className="text-sm text-white/75 leading-relaxed font-light">{current.caption}</p>
            </div>
          )}

          {/* EXIF */}
          {(exifLoading || exif) && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-3">拍摄参数</p>
              {exifLoading && !exif ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 bg-white/10 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                  ))}
                </div>
              ) : exif && (
                <div className="space-y-2">
                  {exif.camera && <ExifRow icon="📷" label="相机" value={exif.camera} />}
                  {exif.lens && <ExifRow icon="🔭" label="镜头" value={exif.lens} />}
                  {(exif.aperture || exif.shutter || exif.iso) && (
                    <div className="flex gap-3 pt-1">
                      {exif.aperture && <ExifChip value={exif.aperture} />}
                      {exif.shutter && <ExifChip value={exif.shutter} />}
                      {exif.iso && <ExifChip value={exif.iso} />}
                      {exif.focalLength && <ExifChip value={exif.focalLength} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date + Categories */}
          <div className="space-y-2 pt-1">
            {exif?.dateTaken && (
              <p className="text-xs text-white/30">{exif.dateTaken}</p>
            )}
            {current.categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {current.categories.map((cat) => (
                  <span key={cat} className="text-[10px] tracking-widest uppercase text-white/25 border border-white/10 px-2 py-0.5 rounded">
                    {cat === 'commercial' ? '工作样片' : '样片'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile info drawer backdrop */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden bg-black/40"
          onClick={() => setInfoOpen(false)}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}

function ExifRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm leading-tight mt-px">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label} </span>
        <span className="text-xs text-white/65 break-words">{value}</span>
      </div>
    </div>
  );
}

function ExifChip({ value }: { value: string }) {
  return (
    <span className="text-xs text-white/55 bg-white/8 px-2 py-0.5 rounded font-mono">{value}</span>
  );
}
