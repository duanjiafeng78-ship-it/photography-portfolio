'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const links = [
  { href: '/gallery', label: '全部' },
  { href: '/commercial', label: '工作样片' },
  { href: '/personal', label: '样片' },
  { href: '/about', label: '关于' },
  { href: '/contact', label: '联系' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setHidden(y > 120 && y > lastY);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        hidden ? '-translate-y-full' : 'translate-y-0',
        scrolled
          ? 'bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <nav
        className={clsx(
          'max-w-screen-xl mx-auto px-6 sm:px-10 flex items-center justify-between transition-all duration-500',
          scrolled ? 'h-10' : 'h-14',
        )}
      >
        <Link
          href="/"
          className="text-xs font-light tracking-[0.2em] uppercase text-white/80 hover:text-white transition-colors"
        >
          Portfolio
        </Link>

        <ul className="flex items-center gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  'relative text-xs tracking-[0.12em] uppercase transition-colors duration-300',
                  pathname === href
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80',
                )}
              >
                {label}
                {pathname === href && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-white/60 rounded-full" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
