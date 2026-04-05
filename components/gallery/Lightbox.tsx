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
  const [infoOpen, setInfoOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const navigate = useCallback((newIndex: number) => {
    setTransitioning(true);
    setExif(null);
    setInfoOpen(false);
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

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false));
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (infoOpen) setInfoOpen(false);
        else handleClose();
      }
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'i' || e.key === 'I') setInfoOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [handleClose, prev, next, infoOpen]);

  // Fetch EXIF
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
  const hasInfo = !!(current.caption || exif);

  const content = (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        entering ? 'opacity-0' : 'opacity-100'
      } bg-black`}
    >
      {/* ── Full-screen photo ── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={handleClose}
      >
        <div
          className={`transition-all duration-300 w-full h-full flex items-center justify-center ${
            transitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
            touchStartX.current = null;
          }}
          style={{ WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'], userSelect: 'none' }}
        >
          <Image
            src={current.url}
            alt=""
            width={current.width}
            height={current.height}
            className="w-auto h-auto object-contain select-none"
            style={{ maxHeight: '100dvh', maxWidth: '100vw' }}
            draggable={false}
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {/* ── Minimal top overlay (fades on idle) ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between pointer-events-none"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {/* Counter */}
        <div className="px-4 py-2 text-white/30 text-xs tracking-widest">
          {index + 1} / {photos.length}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-0.5 px-2 pointer-events-auto">
          {/* Info toggle */}
          {hasInfo && (
            <button
              className={`p-2.5 transition-colors ${infoOpen ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
              onClick={() => setInfoOpen((v) => !v)}
              aria-label="照片信息"
              title="照片信息 (I)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          )}
          {/* Close */}
          <button
            className="p-2.5 text-white/35 hover:text-white/70 transition-colors"
            onClick={handleClose}
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Prev / Next ── */}
      {photos.length > 1 && (
        <>
          <button
            className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-10 p-4 text-white/25 hover:text-white/70 transition-colors"
            onClick={prev}
            aria-label="上一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-10 p-4 text-white/25 hover:text-white/70 transition-colors"
            onClick={next}
            aria-label="下一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Info overlay (slides up from bottom) ── */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 z-20
          transition-all duration-300 ease-out
          ${infoOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
        `}
      >
        {/* Gradient fade into photo */}
        <div className="h-20 bg-gradient-to-t from-black/90 to-transparent" />

        <div className="bg-black/90 backdrop-blur-md pb-6 px-5 sm:px-8"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto">
            {/* Caption / Story */}
            {current.caption && (
              <p className="text-sm text-white/75 leading-relaxed font-light mb-4">{current.caption}</p>
            )}

            {/* EXIF row — compact horizontal layout */}
            {exifLoading && !exif ? (
              <div className="flex gap-3">
                {[80, 100, 60].map((w, i) => (
                  <div key={i} className="h-3 bg-white/10 rounded animate-pulse" style={{ width: w }} />
                ))}
              </div>
            ) : exif && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/40">
                {exif.camera && (
                  <span className="text-white/55">{exif.camera}</span>
                )}
                {exif.lens && (
                  <span>{exif.lens}</span>
                )}
                {(exif.aperture || exif.shutter || exif.iso || exif.focalLength) && (
                  <span className="flex gap-2 font-mono text-white/45">
                    {exif.focalLength && <span>{exif.focalLength}</span>}
                    {exif.aperture && <span>{exif.aperture}</span>}
                    {exif.shutter && <span>{exif.shutter}</span>}
                    {exif.iso && <span>{exif.iso}</span>}
                  </span>
                )}
                {exif.dateTaken && (
                  <span className="text-white/25">{exif.dateTaken}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
