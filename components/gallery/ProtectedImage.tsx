'use client';

import Image from 'next/image';

interface ProtectedImageProps {
  src: string;
  width: number;
  height: number;
  maxWidth?: number;
  priority?: boolean;
}

export default function ProtectedImage({ src, width, height, maxWidth = 1200, priority }: ProtectedImageProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        maxWidth,
        aspectRatio: `${width} / ${height}`,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-contain"
        priority={priority}
        sizes={`(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`}
        draggable={false}
        style={{
          userSelect: 'none',
          WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
        }}
      />
      <span
        className="absolute bottom-3 right-4 text-[11px] text-white/[0.12] font-light tracking-wider pointer-events-none select-none"
        aria-hidden="true"
      >
        Photography
      </span>
    </div>
  );
}
