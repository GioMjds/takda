import Link from 'next/link';
import type { Route } from 'next';

export interface FooterBarProps {
  lang: string;
}

export function FooterBar({ lang }: FooterBarProps) {
  const isEn = lang === 'en';

  return (
    <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm transition-colors">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row sm:gap-0 sm:px-10">
        <Link
          href={`/${lang}` as Route}
          aria-label="Takda home"
          className="group inline-flex items-center gap-2"
        >
          <span className="font-[family-name:var(--font-display)] text-base font-light tracking-tight text-muted-foreground transition-colors group-hover:text-foreground">
            Takda
          </span>
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full bg-primary transition-transform group-hover:scale-125"
          />
        </Link>

        <nav
          aria-label={isEn ? 'Footer' : 'Footer navigation'}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <FooterLink href="#privacy">{isEn ? 'Privacy' : 'Privacy'}</FooterLink>
          <Dot />
          <FooterLink href="#terms">{isEn ? 'Terms' : 'Terms'}</FooterLink>
          <Dot />
          <FooterLink href="#contact">{isEn ? 'Contact' : 'Contact'}</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href as Route}
      className="rounded px-2 py-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </Link>
  );
}

function Dot() {
  return <span aria-hidden="true" className="text-muted-foreground/40">·</span>;
}

export default FooterBar;
