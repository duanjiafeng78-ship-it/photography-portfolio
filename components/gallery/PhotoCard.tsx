'use client';

import Image from 'next/image';
import type { Photo } from '@/lib/types';
import ScrollReveal from '@/components/common/ScrollReveal';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick: () => void;
}

export default function PhotoCard({ photo, index, onClick }: PhotoCardProps) {
  return (
    <ScrollReveal delay={Math.min(index * 60, 300)}>
      <div
        className="relative mb-[3px] overflow-hidden cursor-pointer group"
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
          userSelect: 'none',
        }}
      >
        <Image
          src={photo.url}
          alt=""
          width={photo.width}
          height={photo.height}
          className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          draggable={false}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 pointer-events-none" />
      </div>
    </ScrollReveal>
  );
}
