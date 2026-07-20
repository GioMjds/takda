import Link from 'next/link';
import type { Route } from 'next';
import { QrCode } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { MobileNav } from './MobileNav';

export interface NavBarProps {
  lang: string;
}

export function NavBar({ lang }: NavBarProps) {
  const isEn = lang === 'en';

  const links = {
    how: isEn ? 'How it works' : 'Paano gumagana',
    forBusiness: isEn ? 'For businesses' : 'Para sa negosyo',
    pricing: isEn ? 'Pricing' : 'Presyo',
    signIn: isEn ? 'Sign in' : 'Mag-sign in',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-colors">
      <nav
        aria-label={isEn ? 'Primary' : 'Pangunahing navigation'}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8"
      >
        {/* Wordmark */}
        <Link
          href={`/${lang}` as Route}
          className="group inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5"
          aria-label="Takda home"
        >
          <span className="font-(family-name:--font-display) text-xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
            Takda
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-125"
          />
        </Link>

        {/* Ghost links — Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="#how-it-works"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {links.how}
          </Link>
          <Link
            href="#features"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {links.forBusiness}
          </Link>
          <Link
            href="#pricing"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {links.pricing}
          </Link>
        </div>

        {/* Right cluster: Language Switcher + Theme Toggle + Sign In CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher currentLang={lang} />
          <ThemeToggle />

          <Link
            href={`/${lang}/login` as Route}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <QrCode className="size-3.5" aria-hidden="true" />
            <span>{links.signIn}</span>
          </Link>
        </div>

        {/* Mobile Navigation */}
        <MobileNav lang={lang} links={links} />
      </nav>
    </header>
  );
}

export default NavBar;
