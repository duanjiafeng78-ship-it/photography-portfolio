export default function Footer() {
  const socials = [
    {
      label: '微信',
      href: '#',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 10.5a1 1 0 100-2 1 1 0 000 2zm5 0a1 1 0 100-2 1 1 0 000 2zm-2.5 7c-4.97 0-9-3.358-9-7.5C2 6.358 6.03 3 11 3s9 3.358 9 7.5c0 1.676-.617 3.225-1.657 4.5L19.5 18l-2.843-.947A9.9 9.9 0 0111 17.5z" />
        </svg>
      ),
    },
    {
      label: '微博',
      href: '#',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.098 20c-4.194 0-8.1-2.103-8.1-5.21 0-1.636.96-3.43 2.63-5.094 2.22-2.197 4.797-3.2 5.766-2.24.427.426.468 1.139.14 1.993a.75.75 0 001.015.97C13.116 9.56 16 9.03 16 11.25c0 .424-.14.84-.407 1.226a.75.75 0 00.957 1.104C18.267 12.792 19.5 12.04 19.5 11c0-2.657-3.015-3.94-6.15-3.476-.04-.13-.086-.26-.14-.386-.623-1.46-2.066-2.138-3.93-1.914C6.93 5.62 4.5 8.024 4.5 10.5c0 .15.01.3.027.448C3.007 11.914 2 13.435 2 14.79 2 18.538 6.4 21.5 11 21.5a12.5 12.5 0 002.5-.25.75.75 0 10-.3-1.47 11 11 0 01-2.2.22H10.1zm5.9-5.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        </svg>
      ),
    },
    {
      label: '小红书',
      href: '#',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-5H9v-2h2V8h2v1.5h2v2h-2v5z" />
        </svg>
      ),
    },
    {
      label: '抖音',
      href: '#',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.16 8.16 0 004.77 1.52V6.82a4.85 4.85 0 01-1-.13z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/20">
            Portfolio
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-[10px] tracking-[0.15em] text-white/15 hover:text-white/30 transition-colors duration-300"
            >
              开发者设置
            </a>
            <span className="text-[10px] tracking-[0.15em] text-white/15">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="text-white/20 hover:text-white/50 transition-colors duration-300"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
