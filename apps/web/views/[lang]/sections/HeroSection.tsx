'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { motion, useReducedMotion } from 'motion/react';
import { QrCode, Play, MapPin, Clock } from 'lucide-react';

export interface HeroSectionProps {
  lang: string;
}

export function HeroSection({ lang }: HeroSectionProps) {
  const isEn = lang === 'en';
  const reduceMotion = useReducedMotion();

  const stagger = reduceMotion ? 0 : 0.08;
  const baseDelay = 0.05;

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
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-20 pb-16 text-center sm:px-8 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-24"
    >
      {/* Eyebrow pill */}
      <motion.div {...fadeUp(0 * stagger)}>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary dark:text-[#5DCAA5]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_rgba(29,158,117,0.55)]"
          />
          {isEn
            ? 'Queue management for Filipino businesses'
            : 'Queue management para sa mga negosyo'}
        </span>
      </motion.div>

      {/* H1 */}
      <motion.h1
        id="hero-title"
        {...fadeUp(1 * stagger)}
        className="mt-7 max-w-4xl font-[family-name:var(--font-display)] font-extrabold text-[clamp(2.5rem,5.6vw,4.25rem)] leading-[1.06] tracking-[-0.025em] text-foreground text-balance"
      >
        {isEn ? (
          <>
            Your counter, your{' '}
            <em className="not-italic text-primary dark:text-[#5DCAA5] [font-style:italic] [font-weight:800]">
              queue, your rules.
            </em>
          </>
        ) : (
          <>
            Sa inyong counter,{' '}
            <em className="not-italic text-primary dark:text-[#5DCAA5] [font-style:italic] [font-weight:800]">
              inyong pila, inyong takda.
            </em>
          </>
        )}
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        {...fadeUp(2 * stagger)}
        className="mt-6 max-w-md text-base font-light leading-relaxed text-muted-foreground"
      >
        {isEn
          ? 'A queue and booking system for walk-in shops, salons, and LGU offices. Customers scan, you serve — no more paper lists, no more guessing who is next.'
          : 'Queue at booking system para sa walk-in na shop, salon, at LGU offices. Customer mag-scan, kayo nagsilbi — walang papel, walang hulaan kung sino ang susunod.'}
      </motion.p>

      {/* Action row */}
      <motion.div
        {...fadeUp(3 * stagger)}
        className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3"
      >
        <Link
          href={`/${lang}/onboarding` as Route}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <QrCode className="size-4" aria-hidden="true" />
          <span>{isEn ? 'Get your free QR code' : 'Kunin ang iyong QR code'}</span>
        </Link>
        <Link
          href="#how-it-works"
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/60 px-5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Play
            className="size-3.5 fill-primary text-primary transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
          <span>{isEn ? 'See how it works' : 'Tingnan kung paano'}</span>
        </Link>
      </motion.div>

      {/* Social proof strip */}
      <motion.div {...fadeUp(4 * stagger)} className="mt-10 flex items-center gap-3">
        <div className="flex -space-x-2" aria-hidden="true">
          <Avatar initials="JR" fill="var(--color-primary)" ring="var(--color-background)" text="#ffffff" />
          <Avatar initials="MA" fill="oklch(0.7 0.12 171.6)" ring="var(--color-background)" text="#0d4f43" />
          <Avatar initials="PD" fill="oklch(0.85 0.08 175.4)" ring="var(--color-background)" text="#0d4f43" />
          <Avatar initials="SL" fill="oklch(0.35 0.08 170.3)" ring="var(--color-background)" text="#ffffff" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {isEn
            ? '200+ Filipino businesses already using Takda'
            : '200+ negosyo na ang gumagamit ng Takda'}
        </p>
      </motion.div>

      {/* Decorative micro-floats */}
      <motion.div
        {...fadeUp(5 * stagger)}
        className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-[11px] font-medium text-foreground">
            {isEn ? 'Open today · 8 slots left' : 'Bukás · 8 slots natitira'}
          </span>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(5.5 * stagger)}
        className="pointer-events-none absolute left-6 top-32 hidden lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-xs backdrop-blur-md">
          <Clock className="size-3 text-primary" aria-hidden="true" />
          <span className="font-mono text-[11px] text-foreground">09:42</span>
          <span className="text-[11px] text-muted-foreground">
            {isEn ? 'next slot' : 'sunod na slot'}
          </span>
        </div>
      </motion.div>

      <motion.div
        {...fadeUp(6 * stagger)}
        className="pointer-events-none absolute right-12 bottom-6 hidden lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 px-3 py-2 shadow-xs backdrop-blur-md">
          <MapPin className="size-3 text-primary" aria-hidden="true" />
          <span className="text-[11px] text-foreground">
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
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold tracking-wide"
      style={{ backgroundColor: fill, borderColor: ring, color: text }}
    >
      {initials}
    </span>
  );
}

export default HeroSection;
