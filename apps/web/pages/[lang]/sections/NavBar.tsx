import Link from 'next/link';
import type { Route } from 'next';
import { Menu, QrCode } from 'lucide-react';

export interface NavBarProps {
  lang: string;
}

/**
 * Sticky top navigation for the marketing surface.
 *
 * Server Component — the nav does not need interactivity in v1. On
 * small screens the ghost links collapse behind a single "Menu" button
 * (no dropdown yet; the spec defers a real mobile menu to a later pass).
 *
 * Visual choices:
 * - `backdrop-blur` over the dark atmosphere lets the radial glows bleed
 *   through faintly, which keeps the bar from feeling like a heavy
 *   opaque slab.
 * - The primary CTA ("Sign in") uses the brighter teal `#1D9E75` to read
 *   as a brand moment against the dark surface.
 */
export function NavBar({ lang }: NavBarProps) {
  const isEn = lang === 'en';

  // Localized ghost link labels. The brief copies them verbatim in
  // English; we keep the EN values as the canonical source and add a
  // Tagalog fallback for the Filipino-locale homepage.
  const links = {
    how: isEn ? 'How it works' : 'Paano gumagana',
    forBusiness: isEn ? 'For businesses' : 'Para sa negosyo',
    pricing: isEn ? 'Pricing' : 'Presyo',
  };

  return (
    <header
      className="
        sticky top-0 z-40 w-full
        border-b border-white/[0.07]
        bg-[#0a1f1a]/70 backdrop-blur-md
      "
    >
      <nav
        aria-label={isEn ? 'Primary' : 'Pangunahing navigation'}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8"
      >
        {/* Wordmark — single word, weighty, in mint-white. No badge, no
            tagline. The "Clean Canopy" identity is carried by the
            atmosphere layer, not the logo lockup. */}
        <Link
          href={`/${lang}` as Route}
          className="group inline-flex items-center gap-2"
          aria-label="Takda home"
        >
          <span
            className="
              font-[family-name:var(--font-display)] text-xl
              font-extrabold tracking-tight text-[#e8f5ef]
              transition-colors group-hover:text-white
            "
          >
            Takda
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] transition-transform group-hover:scale-125"
          />
        </Link>

        {/* Ghost links — hidden on small screens, replaced by a single
            Menu button to keep the bar from getting crowded. */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href={`#how-it-works` as Route}
            className="
              rounded-md px-3 py-2 text-sm font-medium
              text-[#e8f5ef]/70 transition-colors
              hover:bg-white/[0.05] hover:text-[#e8f5ef]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#1D9E75]/60
            "
          >
            {links.how}
          </Link>
          <Link
            href={`#features` as Route}
            className="
              rounded-md px-3 py-2 text-sm font-medium
              text-[#e8f5ef]/70 transition-colors
              hover:bg-white/[0.05] hover:text-[#e8f5ef]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#1D9E75]/60
            "
          >
            {links.forBusiness}
          </Link>
          <Link
            href={`#pricing` as Route}
            className="
              rounded-md px-3 py-2 text-sm font-medium
              text-[#e8f5ef]/70 transition-colors
              hover:bg-white/[0.05] hover:text-[#e8f5ef]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#1D9E75]/60
            "
          >
            {links.pricing}
          </Link>
        </div>

        {/* Right cluster: mobile menu placeholder + primary Sign in. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="
              inline-flex h-9 items-center gap-1.5 rounded-md
              px-2.5 text-sm font-medium text-[#e8f5ef]/70
              hover:bg-white/[0.05] hover:text-[#e8f5ef]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#1D9E75]/60 md:hidden
            "
            aria-label={isEn ? 'Open menu' : 'Buksan ang menu'}
            // Intentionally a no-op for v1; mobile menu ships later.
          >
            <Menu className="size-4" aria-hidden="true" />
            <span>{isEn ? 'Menu' : 'Menu'}</span>
          </button>

          <Link
            href={`/${lang}/login` as Route}
            className="
              inline-flex h-9 items-center gap-1.5 rounded-md
              bg-[#1D9E75] px-3.5 text-sm font-semibold text-white
              shadow-[0_4px_18px_-6px_rgba(29,158,117,0.7)]
              transition-all
              hover:bg-[#5DCAA5] hover:text-[#0a1f1a]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#5DCAA5] focus-visible:ring-offset-2
              focus-visible:ring-offset-[#0a1f1a]
            "
          >
            <QrCode className="size-3.5" aria-hidden="true" />
            <span>{isEn ? 'Sign in' : 'Mag-sign in'}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
