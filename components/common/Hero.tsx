'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Photo } from '@/lib/types';

interface HeroProps {
  backgroundPhotos?: Photo[];
}

export default function Hero({ backgroundPhotos = [] }: HeroProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const [nextBg, setNextBg] = useState(1);
  const [crossfading, setCrossfading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (backgroundPhotos.length < 2) return;
    const interval = setInterval(() => {
      const next = (currentBg + 1) % backgroundPhotos.length;
      setNextBg(next);
      setCrossfading(true);
      setTimeout(() => {
        setCurrentBg(next);
        setCrossfading(false);
      }, 1200);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentBg, backgroundPhotos.length]);

  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen min-h-[100dvh] pt-14 px-6 text-center overflow-hidden">
      {/* Background slideshow */}
      {backgroundPhotos.length > 0 && (
        <>
          {/* Current photo */}
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundPhotos[currentBg]?.url ?? ''}
              alt=""
              fill
              className="object-contain sm:object-cover"
              priority
              sizes="100vw"
              draggable={false}
              style={{ transition: 'opacity 1.2s ease-in-out', opacity: crossfading ? 0 : 1 }}
            />
          </div>
          {/* Next photo (fades in during transition) */}
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundPhotos[nextBg]?.url ?? ''}
              alt=""
              fill
              className="object-contain sm:object-cover"
              sizes="100vw"
              draggable={false}
              style={{ transition: 'opacity 1.2s ease-in-out', opacity: crossfading ? 1 : 0 }}
            />
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 z-0 bg-black/60" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-px bg-white/20 mb-6 sm:mb-12" />

        <h1
          className="text-[clamp(3rem,10vw,9rem)] font-extralight tracking-[0.15em] uppercase text-white leading-none"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          Portfolio
        </h1>

        <p
          className="mt-6 text-xs tracking-[0.35em] uppercase text-white/50 font-light"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 1.2s 0.3s cubic-bezier(0.16,1,0.3,1), transform 1.2s 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          Portrait · Commercial · Fashion
        </p>

        <Link
          href="/gallery"
          className="mt-10 sm:mt-16 px-10 py-3.5 border border-white/30 text-[10px] tracking-[0.3em] uppercase text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 1.2s 0.6s cubic-bezier(0.16,1,0.3,1), transform 1.2s 0.6s cubic-bezier(0.16,1,0.3,1), background-color 0.5s, color 0.5s, border-color 0.5s',
          }}
        >
          View Work →
        </Link>
      </div>
    </section>
  );
}
