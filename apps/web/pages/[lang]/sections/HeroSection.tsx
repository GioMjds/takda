'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { motion, useReducedMotion } from 'motion/react';
import { QrCode, Play, MapPin, Clock } from 'lucide-react';

export interface HeroSectionProps {
  lang: string;
}

/**
 * Hero section — Client Component because it owns the entrance reveal.
 *
 * Structure (per the brief, in reveal order):
 *   1. eyebrow pill
 *   2. H1 (with italic emphasis on the emotional beat)
 *   3. subheadline
 *   4. action row (primary CTA + ghost secondary)
 *   5. social proof strip
 *
 * Each reveal is staggered by 80ms. `prefers-reduced-motion: reduce`
 * collapses the stagger to an instant crossfade so the section is
 * still legible to users who suppress motion.
 *
 * Design notes:
 * - The H1 uses an italic `<em>` only on the second half ("queue, your
 *   rules."), keeping the first half a confident roman setting. Italic
 *   on its own is the editorial-magazine tell; one beat of italic in an
 *   otherwise roman H1 reads as voice.
 * - Two micro-floats (the "Open today" + "5 min ago" tags) sit in the
 *   right margin. They are decorative — the floating tags give the hero
 *   depth without committing to illustration. Hidden on small screens.
 * - The CTAs sit on a single row at md+; on mobile they stack to keep
 *   the touch targets above 48px.
 */
export function HeroSection({ lang }: HeroSectionProps) {
  const isEn = lang === 'en';
  const reduceMotion = useReducedMotion();

  // Stagger math. Reduced-motion collapses to a 0ms stagger so the
  // section appears as a single crossfade.
  const stagger = reduceMotion ? 0 : 0.08;
  const baseDelay = 0.05;

  // Helpers for motion variants. Wrapping in `if (reduceMotion)` at the
  // top of each variant would be more explicit, but a single `duration: 0`
  // switch is enough to neutralize the reveal without losing the JSX.
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.55,
      delay: baseDelay + delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative mx-auto flex w-full max-w-6xl flex-col items-center
        px-6 pt-20 pb-16 text-center sm:px-8 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-24
      "
    >
      {/* Eyebrow pill — small, on-brand, low contrast so it doesn't
          compete with the H1. The 5px teal dot anchors the brand. */}
      <motion.div {...fadeUp(0 * stagger)}>
        <span
          className="
            inline-flex items-center gap-2 rounded-full
            border border-[#1D9E75]/30 bg-[#1D9E75]/[0.12]
            px-3 py-1 text-[11px] font-semibold uppercase
            tracking-[0.14em] text-[#5DCAA5]
          "
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] shadow-[0_0_10px_2px_rgba(29,158,117,0.55)]"
          />
          {isEn
            ? 'Queue management for Filipino businesses'
            : 'Queue management para sa mga negosyo'}
        </span>
      </motion.div>

      {/* H1 — fluid clamp() so it scales smoothly from phone to
          ultra-wide without manually breakpointing the headline.
          Single h1 per page, balance-wrapped. */}
      <motion.h1
        id="hero-title"
        {...fadeUp(1 * stagger)}
        className="
          mt-7 max-w-4xl
          font-[family-name:var(--font-display)] font-extrabold
          text-[clamp(2.5rem,5.6vw,4.25rem)]
          leading-[1.06] tracking-[-0.025em] text-[#e8f5ef]
          text-balance
        "
      >
        {isEn ? (
          <>
            Your counter, your{' '}
            <em
              className="
                not-italic text-[#5DCAA5]
                [font-style:italic] [font-weight:800]
              "
            >
              queue, your rules.
            </em>
          </>
        ) : (
          <>
            Sa inyong counter,{' '}
            <em
              className="
                not-italic text-[#5DCAA5]
                [font-style:italic] [font-weight:800]
              "
            >
              inyong pila, inyong takda.
            </em>
          </>
        )}
      </motion.h1>

      {/* Subheadline — body copy at 16px, weight 300. Max-w-md keeps the
          measure short so the eye doesn't drift across an ocean of
          muted type. */}
      <motion.p
        {...fadeUp(2 * stagger)}
        className="
          mt-6 max-w-md text-base font-light leading-relaxed
          text-[#e8f5ef]/55
        "
      >
        {isEn
          ? 'A queue and booking system for walk-in shops, salons, and LGU offices. Customers scan, you serve — no more paper lists, no more guessing who is next.'
          : 'Queue at booking system para sa walk-in na shop, salon, at LGU offices. Customer mag-scan, kayo nagsilbi — walang papel, walang hulaan kung sino ang susunod.'}
      </motion.p>

      {/* Action row — primary CTA first (the brief's single conversion
          goal), ghost secondary for the curious-but-not-yet buyer. */}
      <motion.div
        {...fadeUp(3 * stagger)}
        className="
          mt-10 flex w-full max-w-md flex-col items-stretch
          gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3
        "
      >
        <Link
          href={`/${lang}/onboarding` as Route}
          className="
            group inline-flex h-12 items-center justify-center gap-2
            rounded-xl bg-[#1D9E75] px-5 text-sm font-semibold
            text-white shadow-[0_10px_30px_-10px_rgba(29,158,117,0.6)]
            transition-all
            hover:bg-[#5DCAA5] hover:text-[#0a1f1a] hover:shadow-[0_14px_36px_-10px_rgba(93,202,165,0.55)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#5DCAA5] focus-visible:ring-offset-2
            focus-visible:ring-offset-[#0a1f1a]
          "
        >
          <QrCode className="size-4" aria-hidden="true" />
          <span>{isEn ? 'Get your free QR code' : 'Kunin ang iyong QR code'}</span>
        </Link>
        <Link
          href="#how-it-works"
          className="
            group inline-flex h-12 items-center justify-center gap-2
            rounded-xl border border-white/10 bg-white/[0.04] px-5
            text-sm font-semibold text-[#e8f5ef]/85
            backdrop-blur-sm transition-all
            hover:border-white/20 hover:bg-white/[0.08] hover:text-white
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-white/40 focus-visible:ring-offset-2
            focus-visible:ring-offset-[#0a1f1a]
          "
        >
          <Play
            className="size-3.5 fill-[#5DCAA5] text-[#5DCAA5] transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
          <span>{isEn ? 'See how it works' : 'Tingnan kung paano'}</span>
        </Link>
      </motion.div>

      {/* Social proof strip — stacked avatar circles + faint count. The
          avatars are flat, low-saturation tints of the brand palette
          (no random photo placeholders). The "200+" figure is a
          commitment; we keep it modest so it doesn't read as
          hero-metric SaaS template. */}
      <motion.div
        {...fadeUp(4 * stagger)}
        className="mt-10 flex items-center gap-3"
      >
        <div className="flex -space-x-2" aria-hidden="true">
          <Avatar initials="JR" fill="#1D9E75" ring="#0a1f1a" />
          <Avatar initials="MA" fill="#5DCAA5" ring="#0a1f1a" />
          <Avatar initials="PD" fill="#A8DDD4" ring="#0a1f1a" text="#0d4f43" />
          <Avatar initials="SL" fill="#0D4F43" ring="#0a1f1a" />
        </div>
        <p className="text-xs font-medium text-[#e8f5ef]/45">
          {isEn
            ? '200+ Filipino businesses already using Takda'
            : '200+ negosyo na ang gumagamit ng Takda'}
        </p>
      </motion.div>

      {/* Decorative micro-floats — visible on lg+ only. They sit in the
          right margin to add a sense of "things happening" without
          committing to full illustration. Both are aria-hidden so they
          do not contribute to the page's accessible name set. */}
      <motion.div
        {...fadeUp(5 * stagger)}
        className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block"
        aria-hidden="true"
      >
        <div
          className="
            flex items-center gap-2 rounded-lg border border-white/10
            bg-white/[0.04] px-3 py-2 backdrop-blur-md
          "
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D9E75] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5DCAA5]" />
          </span>
          <span className="text-[11px] font-medium text-[#e8f5ef]/75">
            {isEn ? 'Open today · 8 slots left' : 'Bukás · 8 slots natitira'}
          </span>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(5.5 * stagger)}
        className="pointer-events-none absolute left-6 top-32 hidden lg:block"
        aria-hidden="true"
      >
        <div
          className="
            flex items-center gap-2 rounded-lg border border-white/10
            bg-white/[0.04] px-3 py-2 backdrop-blur-md
          "
        >
          <Clock className="size-3 text-[#5DCAA5]" aria-hidden="true" />
          <span className="font-mono text-[11px] text-[#e8f5ef]/75">
            09:42
          </span>
          <span className="text-[11px] text-[#e8f5ef]/55">
            {isEn ? 'next slot' : 'sunod na slot'}
          </span>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(6 * stagger)}
        className="pointer-events-none absolute right-12 bottom-6 hidden lg:block"
        aria-hidden="true"
      >
        <div
          className="
            flex items-center gap-2 rounded-lg border border-white/10
            bg-white/[0.04] px-3 py-2 backdrop-blur-md
          "
        >
          <MapPin className="size-3 text-[#5DCAA5]" aria-hidden="true" />
          <span className="text-[11px] text-[#e8f5ef]/75">
            {isEn ? 'Pilar Public Market' : 'Pilar Public Market'}
          </span>
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Decorative avatar for the social proof strip. The component is local
 * to this file because it is purely a visual primitive and not part of
 * the wider design system.
 */
function Avatar({
  initials,
  fill,
  ring,
  text = '#e8f5ef',
}: {
  initials: string;
  fill: string;
  ring: string;
  text?: string;
}) {
  return (
    <span
      className="
        flex h-9 w-9 items-center justify-center rounded-full
        border-2 text-[10px] font-bold tracking-wide
      "
      style={{ backgroundColor: fill, borderColor: ring, color: text }}
    >
      {initials}
    </span>
  );
}

export default HeroSection;
