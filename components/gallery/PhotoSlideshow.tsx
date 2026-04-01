'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Photo } from '@/lib/types';

interface PhotoSlideshowProps {
  photos: Photo[];
  initialIndex?: number;
  onClick?: (photo: Photo) => void;
  className?: string;
}

/** Returns the largest rectangle with photoW:photoH ratio that fits in cW×cH */
function getContainedBox(photoW: number, photoH: number, cW: number, cH: number) {
  if (!cW || !cH) return null;
  const photoRatio = photoW / photoH;
  const cellRatio = cW / cH;
  if (photoRatio > cellRatio) {
    // Photo is wider relative to cell → constrain by width
    return { w: cW, h: Math.round(cW / photoRatio) };
  } else {
    // Photo is taller relative to cell → constrain by height
    return { w: Math.round(cH * photoRatio), h: cH };
  }
}

export default function PhotoSlideshow({
  photos,
  initialIndex = 0,
  onClick,
  className = '',
}: PhotoSlideshowProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex % photos.length);
  const [nextIdx, setNextIdx] = useState<number | null>(null);
  const [cellSize, setCellSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Measure cell size before first paint to avoid flash
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setCellSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCellSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Slideshow timer — random 3–7 s stagger per cell
  useEffect(() => {
    if (photos.length <= 1) return;

    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        const candidates = photos.map((_, i) => i).filter((i) => i !== currentIdx);
        const next = candidates[Math.floor(Math.random() * candidates.length)];
        setNextIdx(next);
        fadeTimerRef.current = setTimeout(() => {
          setCurrentIdx(next);
          setNextIdx(null);
          scheduleNext();
        }, 900);
      }, delay);
    };

    scheduleNext();
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(fadeTimerRef.current);
    };
  }, [photos.length, currentIdx]);

  const current = photos[currentIdx];
  const next = nextIdx !== null ? photos[nextIdx] : null;

  const { w, h } = cellSize;
  const currentBox = getContainedBox(current.width, current.height, w, h);
  const nextBox = next ? getContainedBox(next.width, next.height, w, h) : null;

  // During transition: box morphs to next photo's shape
  const targetBox = next && nextBox ? nextBox : currentBox;

  // Fallback before ResizeObserver fires: render invisible, avoid flash
  const boxStyle: React.CSSProperties = targetBox
    ? {
        position: 'relative',
        width: targetBox.w,
        height: targetBox.h,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.9s ease-in-out, height 0.9s ease-in-out',
      }
    : {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center bg-[#0f0f0f] cursor-pointer ${className}`}
      onClick={() => onClick?.(current)}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        userSelect: 'none',
        WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
      }}
    >
      {/* Photo box — reshapes during crossfade to match next photo's aspect ratio */}
      <div style={boxStyle}>
        {/* Current photo — fades out */}
        <Image
          key={`c-${currentIdx}`}
          src={current.url}
          alt=""
          fill
          className="object-cover"
          style={{
            opacity: next ? 0 : 1,
            transition: next ? 'opacity 0.9s ease-in-out' : 'none',
          }}
          draggable={false}
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Next photo — visible underneath */}
        {next && (
          <Image
            key={`n-${nextIdx}`}
            src={next.url}
            alt=""
            fill
            className="object-cover"
            style={{ opacity: 1 }}
            draggable={false}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Hover tint — on the cell, not the photo box */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors duration-500 pointer-events-none" />
    </div>
  );
}
