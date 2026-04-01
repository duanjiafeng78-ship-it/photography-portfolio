'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Phase = 'visible' | 'fade-out' | 'fade-in';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('visible');
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // Phase 1: Fade out to black
    setPhase('fade-out');

    timerRef.current = setTimeout(() => {
      // Phase 2: Content is now swapped by Next.js, fade in from black
      setPhase('fade-in');
      window.scrollTo(0, 0);

      timerRef.current = setTimeout(() => {
        setPhase('visible');
      }, 600);
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  const overlayOpacity = phase === 'fade-out' || phase === 'fade-in' ? 1 : 0;
  const contentVisible = phase === 'visible' || phase === 'fade-in';

  return (
    <>
      {/* Black overlay */}
      <div
        className="fixed inset-0 z-30 pointer-events-none bg-[#0f0f0f]"
        style={{
          opacity: phase === 'visible' ? 0 : phase === 'fade-out' ? 1 : 0,
          transition:
            phase === 'fade-out'
              ? 'opacity 350ms ease-in'
              : 'opacity 500ms ease-out',
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'translateY(0)' : 'translateY(40px)',
          transition:
            phase === 'fade-in'
              ? 'opacity 500ms ease-out, transform 500ms cubic-bezier(0.16,1,0.3,1)'
              : phase === 'fade-out'
                ? 'opacity 200ms ease-in'
                : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
}
