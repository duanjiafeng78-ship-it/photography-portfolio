'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Photo } from '@/lib/types';
import PhotoHover from './PhotoHover';
import Lightbox from './Lightbox';

interface JustifiedGalleryProps {
  photos: Photo[];
  targetRowHeight?: number;
}

interface RowData {
  photos: { photo: Photo; width: number; height: number }[];
  height: number;
}

function computeRows(photos: Photo[], containerWidth: number, targetHeight: number): RowData[] {
  if (!containerWidth || photos.length === 0) return [];

  const rows: RowData[] = [];
  let currentRow: Photo[] = [];
  let aspectSum = 0;

  for (const photo of photos) {
    const ar = photo.width / photo.height;
    currentRow.push(photo);
    aspectSum += ar;

    const rowHeight = containerWidth / aspectSum;
    if (rowHeight <= targetHeight) {
      // Row is full — finalize
      rows.push({
        height: rowHeight,
        photos: currentRow.map((p) => ({
          photo: p,
          width: Math.floor((p.width / p.height) * rowHeight),
          height: rowHeight,
        })),
      });
      currentRow = [];
      aspectSum = 0;
    }
  }

  // Last incomplete row
  if (currentRow.length > 0) {
    const naturalWidth = aspectSum * targetHeight;
    const fillRatio = naturalWidth / containerWidth;

    if (fillRatio >= 0.6) {
      // Stretch to fill
      const rowHeight = containerWidth / aspectSum;
      rows.push({
        height: rowHeight,
        photos: currentRow.map((p) => ({
          photo: p,
          width: Math.floor((p.width / p.height) * rowHeight),
          height: rowHeight,
        })),
      });
    } else {
      // Keep natural height
      rows.push({
        height: targetHeight,
        photos: currentRow.map((p) => ({
          photo: p,
          width: Math.floor((p.width / p.height) * targetHeight),
          height: targetHeight,
        })),
      });
    }
  }

  return rows;
}

function ScrollRevealRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already in viewport on mount (handles initial render)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '100px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ${index * 0.06}s ease-out, transform 0.7s ${index * 0.06}s ease-out`,
      }}
    >
      {children}
    </div>
  );
}

const skeletonRows = [
  [1.8, 1.2],
  [1.0, 1.4, 0.9],
  [1.5, 1.0],
];

export default function JustifiedGallery({ photos, targetRowHeight }: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Responsive target height
  const effectiveTargetHeight = targetRowHeight ?? (typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 320);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(
    () => computeRows(photos, containerWidth, effectiveTargetHeight),
    [photos, containerWidth, effectiveTargetHeight]
  );

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[30vh] text-white/20 text-xs tracking-[0.2em] uppercase">
        暂无照片
      </div>
    );
  }

  // Skeleton while container width is being measured
  if (rows.length === 0) {
    return (
      <div ref={containerRef} className="w-full">
        {skeletonRows.map((cols, i) => (
          <div key={i} className="flex w-full" style={{ height: 290 }}>
            {cols.map((flex, j) => (
              <div
                key={j}
                className="bg-white/[0.04] animate-pulse"
                style={{ flex, height: 290 }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="w-full" data-gallery>
        {rows.map((row, rowIndex) => (
          <ScrollRevealRow key={rowIndex} index={rowIndex}>
            <div className="flex" style={{ height: row.height }}>
              {row.photos.map(({ photo, width, height }, photoIndex) => (
                <PhotoHover
                  key={photo.id}
                  style={{
                    width,
                    height,
                    flexShrink: 0,
                  }}
                  onClick={() => setLightboxIndex(photos.findIndex(p => p.id === photo.id))}
                >
                  <div className="relative w-full h-full select-none">
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      className="object-cover"
                      draggable={false}
                      sizes={`${Math.ceil((width / containerWidth) * 100)}vw`}
                    />
                    <span
                      className="absolute bottom-1.5 right-2.5 text-[9px] text-white/[0.12] font-light tracking-wider pointer-events-none"
                      aria-hidden="true"
                    >
                      Photography
                    </span>
                  </div>
                </PhotoHover>
              ))}
            </div>
          </ScrollRevealRow>
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );

}
