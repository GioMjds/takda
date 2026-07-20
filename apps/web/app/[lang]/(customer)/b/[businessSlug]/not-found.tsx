import Link from 'next/link';
import type { Route } from 'next';

/**
 * 404 for the customer booking route.
 *
 * The customer just scanned a QR code that no longer resolves. The
 * mistake is almost always on the operator's side (re-printed sticker,
 * renamed business) rather than the customer's, so the page stays
 * calm rather than alarming. The 404 is a faint teal serif rather
 * than a vibrant accent — it's information, not a button.
 */
export default async function BusinessNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center pt-6 text-center">
      {/* Large serif 404 — set in the display family at extreme size
          but in a faint teal so it sits behind the headline rather
          than shouting. letter-spacing tightened to the floor for a
          confident, designed feel rather than a stock-image one. */}
      <span
        aria-hidden="true"
        className="font-[family-name:var(--font-display)] text-[120px] font-semibold leading-none tracking-[-0.04em] text-[#1D9E75]/20 sm:text-[160px]"
      >
        404
      </span>

      <h1 className="-mt-3 font-[family-name:var(--font-display)] text-[22px] font-medium tracking-[-0.02em] text-[#e8f5ef] sm:text-2xl">
        This business wasn&apos;t found.
      </h1>

      <p className="mt-3 max-w-[280px] text-[13px] font-light leading-relaxed text-[#e8f5ef]/55">
        The QR code or link may be outdated. Try scanning again at the
        storefront.
      </p>

      <Link
        href={'/' as Route}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-5 text-[13px] font-semibold text-[#e8f5ef]/85 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1a15]"
      >
        Back to home
      </Link>
    </div>
  );
}
