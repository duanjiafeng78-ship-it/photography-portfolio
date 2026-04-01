'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Photo } from '@/lib/types';

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [entering, setEntering] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const lastTap = useRef<number>(0);

  const navigate = (newIndex: number) => {
    setZoomed(false);
    setTransitioning(true);
    setTimeout(() => {
      setIndex(newIndex);
      setTransitioning(false);
    }, 150);
  };

  const prev = () => navigate((index - 1 + photos.length) % photos.length);
  const next = () => navigate((index + 1) % photos.length);

  const handleClose = () => {
    setEntering(false);
    setTimeout(onClose, 300);
  };

  const toggleZoom = () => setZoomed((z) => !z);

  // Double-click / double-tap to zoom
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleZoom();
    }
    lastTap.current = now;
  };

  const handleBackdropClick = () => {
    if (zoomed) {
      setZoomed(false);
    } else {
      handleClose();
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomed) setZoomed(false);
        else handleClose();
      }
      if (!zoomed && e.key === 'ArrowLeft') prev();
      if (!zoomed && e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, zoomed]);

  const current = photos[index];

  const content = (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        entering ? 'bg-black/0' : 'bg-black/95'
      } ${zoomed ? 'overflow-auto' : 'flex items-center justify-center'}`}
      onClick={handleBackdropClick}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 pt-5 pointer-events-none">
        <div className="text-white/40 text-xs tracking-wider pointer-events-none">
          {index + 1} / {photos.length}
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Zoom toggle */}
          <button
            className={`transition-colors ${zoomed ? 'text-white' : 'text-white/50 hover:text-white'}`}
            onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
            aria-label={zoomed ? '缩小' : '放大'}
            title={zoomed ? '缩小（双击图片也可切换）' : '放大（双击图片也可切换）'}
          >
            {zoomed ? (
              // Zoom-out icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M8 11h6" />
              </svg>
            ) : (
              // Zoom-in icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
              </svg>
            )}
          </button>
          {/* Close */}
          <button
            className="text-white/50 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Prev / Next — hidden when zoomed */}
      {!zoomed && photos.length > 1 && (
        <>
          <button
            className="fixed left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all hover:scale-110 p-2 z-10"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="上一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all hover:scale-110 p-2 z-10"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="下一张"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      {zoomed ? (
        // Zoomed: scrollable full-size
        <div
          className="min-w-full min-h-full flex items-center justify-center p-10"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            touchStartX.current = null;
          }}
        >
          <Image
            src={current.url}
            alt=""
            width={current.width}
            height={current.height}
            className="w-auto h-auto"
            style={{ maxWidth: 'none' }}
            draggable={false}
            priority
            sizes="200vw"
          />
        </div>
      ) : (
        // Normal: constrained 90vw/90vh
        <div
          className={`relative max-w-[90vw] max-h-[90vh] transition-all duration-300 ${
            entering ? 'scale-95 opacity-0' : transitioning ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
          }`}
          onClick={handleImageClick}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            touchStartX.current = null;
          }}
          style={{
            WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
            userSelect: 'none',
            cursor: 'zoom-in',
          }}
        >
          <Image
            src={current.url}
            alt=""
            width={current.width}
            height={current.height}
            className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-sm"
            draggable={false}
            priority
            sizes="90vw"
          />
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
