'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Menu, X, QrCode, Globe } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface MobileNavProps {
  lang: string;
  links: {
    how: string;
    forBusiness: string;
    pricing: string;
    signIn: string;
  };
}

export function MobileNav({ lang, links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEn = lang === 'en';

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden flex items-center gap-1.5">
      <ThemeToggle />
      <button
        type="button"
        onClick={toggleMenu}
        className="inline-flex h-9 items-center justify-center rounded-md px-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={isEn ? (isOpen ? 'Close menu' : 'Open menu') : (isOpen ? 'Isara ang menu' : 'Buksan ang menu')}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-x-0 top-16 z-50 flex flex-col gap-4 border-b border-border bg-background/95 p-6 shadow-xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'Mobile Navigation' : 'Navigasyong Pang-mobile'}
        >
          <nav className="flex flex-col gap-3">
            <Link
              href="#how-it-works"
              onClick={closeMenu}
              className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            >
              {links.how}
            </Link>
            <Link
              href="#features"
              onClick={closeMenu}
              className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            >
              {links.forBusiness}
            </Link>
            <Link
              href="#pricing"
              onClick={closeMenu}
              className="rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            >
              {links.pricing}
            </Link>
          </nav>

          <div className="h-px w-full bg-border/60 my-1" />

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="size-4" />
              <span>{isEn ? 'Language' : 'Wika'}</span>
            </div>

            <LanguageSwitcher currentLang={lang} />
          </div>

          <Link
            href={`/${lang}/login` as Route}
            onClick={closeMenu}
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-base font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <QrCode className="size-4" />
            <span>{links.signIn}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default MobileNav;
