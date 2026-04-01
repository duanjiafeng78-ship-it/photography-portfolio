'use client';

import { useState } from 'react';
import type { Photo } from '@/lib/types';
import PhotoCard from './PhotoCard';
import Lightbox from './Lightbox';

interface MasonryGridProps {
  photos: Photo[];
}

export default function MasonryGrid({ photos }: MasonryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[30vh] text-white/20 text-xs tracking-[0.2em] uppercase">
        暂无照片
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-[3px] px-4 sm:px-6 lg:px-8">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            onClick={() => setLightboxIndex(index)}
          />
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
