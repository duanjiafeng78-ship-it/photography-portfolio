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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
          hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
          scrolled || menuOpen
            ? 'bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-white/5'
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

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8">
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          >
            <span
              className={clsx(
                'block w-5 h-px bg-white/70 transition-all duration-300 origin-center',
                menuOpen ? 'rotate-45 translate-y-[5px]' : '',
              )}
            />
            <span
              className={clsx(
                'block w-5 h-px bg-white/70 transition-all duration-300',
                menuOpen ? 'opacity-0 scale-x-0' : '',
              )}
            />
            <span
              className={clsx(
                'block w-5 h-px bg-white/70 transition-all duration-300 origin-center',
                menuOpen ? '-rotate-45 -translate-y-[5px]' : '',
              )}
            />
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-30 md:hidden flex flex-col pt-14 transition-all duration-300',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          'bg-[#0f0f0f]/98 backdrop-blur-xl',
        )}
      >
        <ul className="flex flex-col items-center justify-center flex-1 gap-2 pb-20">
          {links.map(({ href, label }) => (
            <li key={href} className="w-full text-center">
              <Link
                href={href}
                className={clsx(
                  'flex items-center justify-center h-14 text-sm tracking-[0.2em] uppercase transition-colors duration-300',
                  pathname === href
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80',
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
