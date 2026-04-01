'use client';

import { useState, useMemo } from 'react';
import type { Photo } from '@/lib/types';
import PhotoSlideshow from './PhotoSlideshow';
import Lightbox from './Lightbox';

interface BentoGridProps {
  photos: Photo[];
}

// Distribute photos across 7 cells, each cell gets a rotating subset
function distributePhotos(photos: Photo[], cellCount: number, minPerCell: number): Photo[][] {
  if (photos.length === 0) return Array(cellCount).fill([]);
  const cells: Photo[][] = Array.from({ length: cellCount }, () => []);
  photos.forEach((photo, i) => {
    cells[i % cellCount].push(photo);
  });
  // Ensure each cell has at least minPerCell photos (pad with random)
  return cells.map((cell) => {
    if (cell.length >= minPerCell) return cell;
    const extra = [...photos].sort(() => Math.random() - 0.5).slice(0, minPerCell - cell.length);
    return [...cell, ...extra];
  });
}

export default function BentoGrid({ photos }: BentoGridProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);
  const allPhotos = useMemo(() => photos, [photos]);

  const cells = useMemo(() => distributePhotos(photos, 7, 2), [photos]);

  const openLightbox = (photo: Photo) => {
    const idx = allPhotos.findIndex((p) => p.id === photo.id);
    setLightboxPhoto(idx >= 0 ? idx : 0);
  };

  if (photos.length === 0) return null;

  return (
    <>
      {/* Desktop: 4-column bento */}
      <div
        className="hidden md:grid w-full gap-1"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(3, 28vw)',
          maxHeight: '84vw',
        }}
      >
        {/* A — 2×2 large */}
        <div style={{ gridColumn: '1 / span 2', gridRow: '1 / span 2' }}>
          <PhotoSlideshow photos={cells[0]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* B — 1×1 */}
        <div style={{ gridColumn: '3', gridRow: '1' }}>
          <PhotoSlideshow photos={cells[1]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* C — 1×1 */}
        <div style={{ gridColumn: '4', gridRow: '1' }}>
          <PhotoSlideshow photos={cells[2]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* D — 1×1 */}
        <div style={{ gridColumn: '3', gridRow: '2' }}>
          <PhotoSlideshow photos={cells[3]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* E — 1×2 tall */}
        <div style={{ gridColumn: '4', gridRow: '2 / span 2' }}>
          <PhotoSlideshow photos={cells[4]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* F — 1×1 */}
        <div style={{ gridColumn: '1', gridRow: '3' }}>
          <PhotoSlideshow photos={cells[5]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        {/* G — 2×1 wide */}
        <div style={{ gridColumn: '2 / span 2', gridRow: '3' }}>
          <PhotoSlideshow photos={cells[6]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
      </div>

      {/* Mobile: 2-column simplified */}
      <div
        className="md:hidden grid w-full gap-1"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(3, 52vw)',
        }}
      >
        <div style={{ gridColumn: '1 / span 2', gridRow: '1' }}>
          <PhotoSlideshow photos={cells[0]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        <div style={{ gridColumn: '1', gridRow: '2' }}>
          <PhotoSlideshow photos={cells[1]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        <div style={{ gridColumn: '2', gridRow: '2' }}>
          <PhotoSlideshow photos={cells[2]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        <div style={{ gridColumn: '1', gridRow: '3' }}>
          <PhotoSlideshow photos={cells[3]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
        <div style={{ gridColumn: '2', gridRow: '3' }}>
          <PhotoSlideshow photos={cells[4]} initialIndex={0} onClick={openLightbox} className="w-full h-full" />
        </div>
      </div>

      {lightboxPhoto !== null && (
        <Lightbox
          photos={allPhotos}
          initialIndex={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </>
  );
}
