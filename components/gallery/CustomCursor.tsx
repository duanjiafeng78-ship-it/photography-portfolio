'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const visibleRef = useRef(false);
  const hoveringPhotoRef = useRef(false);
  const rafRef = useRef<number>(0);
  const [isTouch, setIsTouch] = useState(true); // default true to hide on SSR

  useEffect(() => {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || window.matchMedia('(hover: none)').matches;
    setIsTouch(isTouchDevice);
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      // Check if inside gallery area
      const target = e.target as HTMLElement;
      const inGallery = target.closest('[data-gallery]') !== null;
      const onPhoto = target.closest('[data-photo]') !== null;

      if (inGallery && !visibleRef.current) {
        visibleRef.current = true;
        cursor.style.opacity = '1';
        document.body.style.cursor = 'none';
      } else if (!inGallery && visibleRef.current) {
        visibleRef.current = false;
        cursor.style.opacity = '0';
        document.body.style.cursor = '';
      }

      if (onPhoto && !hoveringPhotoRef.current) {
        hoveringPhotoRef.current = true;
        cursor.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(1.2)`;
      } else if (!onPhoto && hoveringPhotoRef.current) {
        hoveringPhotoRef.current = false;
      }
    };

    const onMouseLeave = () => {
      visibleRef.current = false;
      cursor.style.opacity = '0';
      document.body.style.cursor = '';
    };

    // Lerp animation loop
    const animate = () => {
      const lerp = 0.12;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * lerp;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * lerp;

      const scale = hoveringPhotoRef.current ? 1.2 : 1;
      cursor.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;

      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = '';
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-50 pointer-events-none flex items-center justify-center"
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.6)',
        opacity: 0,
        transition: 'opacity 0.3s ease, transform 0.15s ease-out',
        willChange: 'transform',
        backdropFilter: 'blur(2px)',
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <span
        className="text-white/80 uppercase tracking-[0.2em]"
        style={{ fontSize: 9, fontWeight: 300 }}
      >
        View
      </span>
    </div>
  );
}
