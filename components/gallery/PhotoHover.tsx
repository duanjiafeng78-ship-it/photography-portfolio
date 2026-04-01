'use client';

import { useRef, useState, useCallback } from 'react';

interface PhotoHoverProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function PhotoHover({ children, className = '', style, onClick }: PhotoHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number>(0);
  const transformRef = useRef('scale(1) perspective(800px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const rotateY = ((mouseX - centerX) / (rect.width / 2)) * 5;
      const rotateX = ((centerY - mouseY) / (rect.height / 2)) * 5;

      transformRef.current = `scale(1.03) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      const inner = el.querySelector('[data-hover-inner]') as HTMLElement;
      if (inner) {
        inner.style.transform = transformRef.current;
        inner.style.filter = 'brightness(1.1)';
      }
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    cancelAnimationFrame(rafRef.current);
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelector('[data-hover-inner]') as HTMLElement;
    if (inner) {
      inner.style.transform = 'scale(1) perspective(800px) rotateX(0deg) rotateY(0deg)';
      inner.style.filter = 'brightness(1)';
    }
  }, []);

  return (
    <div
      ref={ref}
      data-photo
      className={`overflow-hidden cursor-none ${className}`}
      style={style}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        data-hover-inner
        className="w-full h-full"
        style={{
          transform: 'scale(1) perspective(800px) rotateX(0deg) rotateY(0deg)',
          filter: 'brightness(1)',
          transition: hovered
            ? 'filter 0.4s ease-out'
            : 'transform 0.4s ease-out, filter 0.4s ease-out',
          willChange: 'transform, filter',
          WebkitTouchCallout: 'none' as React.CSSProperties['WebkitTouchCallout'],
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
