import Link from 'next/link';
import type { Route } from 'next';

export interface FooterBarProps {
  lang: string;
}

/**
 * Marketing footer. Server Component.
 *
 * The brief calls for a single row: wordmark left, three ghost links
 * right. The wordmark uses a serif weight contrast (Raleway 300 vs.
 * the navbar's 800) — the same family, different weight, which is
 * the "single well-chosen family with committed weight/size contrast"
 * pattern the brand register endorses.
 */
export function FooterBar({ lang }: FooterBarProps) {
  const isEn = lang === 'en';

  return (
    <footer
      className="
        border-t border-white/[0.06] bg-[#0a1f1a]/40
        backdrop-blur-sm
      "
    >
      <div
        className="
          mx-auto flex w-full max-w-6xl flex-col items-center
          justify-between gap-3 px-6 py-6 sm:flex-row sm:gap-0
          sm:px-10
        "
      >
        <Link
          href={`/${lang}` as Route}
          aria-label="Takda home"
          className="group inline-flex items-center gap-2"
        >
          <span
            className="
              font-[family-name:var(--font-display)] text-base
              font-light tracking-tight text-[#e8f5ef]/55
              transition-colors group-hover:text-[#e8f5ef]
            "
          >
            Takda
          </span>
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full bg-[#1D9E75]/70 transition-transform group-hover:scale-125"
          />
        </Link>

        <nav
          aria-label={isEn ? 'Footer' : 'Footer navigation'}
          className="flex items-center gap-1.5 text-xs font-medium text-[#e8f5ef]/45"
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
      className="
        rounded px-2 py-1 transition-colors
        hover:text-[#e8f5ef] focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#1D9E75]/60
      "
    >
      {children}
    </Link>
  );
}

function Dot() {
  return <span aria-hidden="true" className="text-[#e8f5ef]/25">·</span>;
}

export default FooterBar;
