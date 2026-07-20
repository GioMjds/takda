'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

export interface LanguageSwitcherProps {
  currentLang: string;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const isEn = currentLang === 'en';

  const getLocalePath = (targetLang: string) => {
    if (!pathname) return `/${targetLang}`;
    const segments = pathname.split('/');
    if (segments[1] === 'tl' || segments[1] === 'en') {
      segments[1] = targetLang;
      return segments.join('/') || `/${targetLang}`;
    }
    return `/${targetLang}${pathname}`;
  };

  return (
    <div
      className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 p-0.5 text-xs font-semibold"
      aria-label={isEn ? 'Select language' : 'Pumili ng wika'}
    >
      <Link
        href={getLocalePath('en') as Route}
        scroll={false}
        className={`rounded-sm px-2.5 py-1 transition-colors ${
          isEn
            ? 'bg-primary text-primary-foreground shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Switch to English"
      >
        EN
      </Link>
      <Link
        href={getLocalePath('tl') as Route}
        scroll={false}
        className={`rounded-sm px-2.5 py-1 transition-colors ${
          !isEn
            ? 'bg-primary text-primary-foreground shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Lumipat sa Tagalog"
      >
        TL
      </Link>
    </div>
  );
}

export default LanguageSwitcher;
