import type { Route } from 'next';
import Link from 'next/link';

/**
 * Atmosphere layer for the customer surface.
 *
 * The customer faces a different problem than the owner: they have just
 * scanned a QR code at a storefront, often on a low-end Android over LTE,
 * and need four steps with zero confusion. The scene is therefore
 * deliberately quieter than the marketing homepage: no editorial left
 * panel, no full nav. A single teal glow anchored top-left and a 40px
 * teal grid at very low alpha provide spatial identity without the
 * page reading as "graph paper" or "loading screen".
 *
 * Content scrolls vertically. The inner column is `max-w-sm` so the
 * action targets sit comfortably under the thumb on a 360×640 viewport
 * — this is a phone-first surface, not a responsive desktop layout
 * scaled down.
 */
export default async function CustomerLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const isEn = lang === 'en';
  const homePath = `/${lang}` as Route;
  const altLang = (isEn ? '/tl' : '/en') as Route;

  return (
    <div className="relative isolate flex min-h-screen w-full overflow-hidden bg-[#0d1a15] text-[#e8f5ef] font-sans">
      {/* 40px teal grid — finer than the homepage's 64px. A finer grid
          reads as "atmosphere" rather than "blueprint" at phone width,
          and matches the more functional register of a transactional
          surface. Mask keeps the edges from feeling like graph paper. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(168,221,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,221,212,0.05)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,#000_50%,transparent_100%)]"
      />

      {/* Single teal glow — top-left, smaller (320px) and lower opacity
          than the homepage hero. Just enough to break the flatness of
          the dark surface without distracting from the form below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 z-0 size-80 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.18)_0%,rgba(29,158,117,0.04)_45%,transparent_72%)] blur-3xl"
      />

      {/* Hairline top border — structural bookend, mirrors the auth
          layout so the two dark surfaces feel like one system. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/6"
      />

      {/* Minimal top bar. Customers don't need a marketing nav; they
          need a single anchor so a confused user can recover to home,
          plus a language switcher for the two-locale audience. The bar
          is sticky-ish (static) so it doesn't fight the scroll on
          cheap phones. */}
      <div className="relative z-10 flex w-full flex-col">
        <header className="w-full">
          <div className="mx-auto flex h-12 max-w-sm items-center justify-between px-4">
            <Link
              href={homePath}
              aria-label="Takda home"
              className="group inline-flex items-center gap-2"
            >
              <span className="font-[family-name:var(--font-display)] text-[15px] font-extrabold tracking-tight text-[#e8f5ef]">
                Takda
              </span>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[#1D9E75]"
              />
            </Link>
            <Link
              href={altLang}
              aria-label={isEn ? 'Switch to Tagalog' : 'Lumipat sa English'}
              className="rounded-md px-2 py-1 text-[11px] font-medium tracking-wide text-[#e8f5ef]/55 transition-colors hover:bg-white/[0.05] hover:text-[#e8f5ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75]/60"
            >
              {isEn ? 'Tagalog' : 'English'}
            </Link>
          </div>
        </header>

        {/* Content column — phone-first width. The vertical padding is
            tight at the top (the bar sets the rhythm) and generous at
            the bottom so the form has air to breathe after the
            confirmation. `safe-bottom` would belong here for notched
            devices, but the URL is the address; the page is short. */}
        <main className="mx-auto w-full max-w-sm flex-1 px-4 pb-16 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}
