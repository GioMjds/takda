import Link from 'next/link';
import type { Route } from 'next';

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <div className="relative isolate flex min-h-screen w-full overflow-hidden bg-[#0a1f1a] text-[#e8f5ef] font-sans">
      {/* Luminous teal radial glow — anchored to the left edge, vertically
          centered. Gives the left panel a natural anchor point without
          over-decorating or bleeding onto the right panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/2 z-0 h-190 -translate-y-1/2 w-[760px] rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.22)_0%,rgba(29,158,117,0.06)_45%,transparent_72%)] blur-3xl"
      />

      {/* Hairline top + bottom borders — structural subtle bookends. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-white/6"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-white/6"
      />

      {/* Left panel — visible from lg+ (1024px+). Below that breakpoint
          we still show the wordmark at the top of the right panel via a
          small rendered-within-stack, so mobile users keep the brand
          anchor. The left panel's identity content (headline, stats)
          is hidden on small screens; the right panel's wordmark carries
          the brand there. */}
      <aside
        className="relative z-10 hidden flex-1 flex-col justify-between p-12 lg:flex lg:p-14 xl:p-16"
        aria-label={isEn ? 'Brand' : 'Brand'}
      >
        {/* Wordmark — top-left. Single word, weighty, in mint-white.
            Same family as the marketing surface, so the system reads
            as one. */}
        <Link
          href={`/${lang}` as Route}
          aria-label="Takda home"
          className="group inline-flex w-fit items-center gap-2.5"
        >
          <span className="font-(family-name:--font-display) text-2xl font-extrabold tracking-tight text-[#e8f5ef] transition-colors group-hover:text-white">
            Takda
          </span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#1D9E75] transition-transform group-hover:scale-125"
          />
        </Link>

        {/* Headline + sub + stats — the editorial block. The headline
            uses one beat of italic teal (the `<em>`) to carry the
            emotional weight; rest is roman. Per the brand register,
            italic on a single beat is voice; italic on every line is
            the AI tell. */}
        <div className="max-w-md">
          <h1 className="font-(family-name:--font-display) text-[clamp(1.875rem,2.6vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#e8f5ef] text-balance">
            {isEn ? (
              <>
                Manage your queue,{' '}
                <em className="font-(family-name:--font-display) italic font-medium text-[#5DCAA5]">
                  serve more
                </em>{' '}
                customers.
              </>
            ) : (
              <>
                Pamahalaan ang iyong pila,{' '}
                <em className="font-(family-name:--font-display) italic font-medium text-[#5DCAA5]">
                  magbigay ng serbisyo
                </em>{' '}
                sa mas marami.
              </>
            )}
          </h1>

          <p className="mt-5 max-w-sm text-[13px] font-light leading-relaxed text-[#e8f5ef]/55">
            {isEn
              ? 'The QR-based queue system built for walk-in businesses across the Philippines.'
              : 'QR-based queue system para sa mga walk-in na negosyo sa buong Pilipinas.'}
          </p>

          {/* Stats — three values, side by side. The number is set in
              the display family (semibold) to anchor the eye; the
              label is a thin 11px sans below it. Divider is a vertical
              hairline, not a side-stripe on a card. */}
          <dl
            className="mt-12 flex items-end divide-x divide-white/8"
            aria-label={isEn ? 'Highlights' : 'Mga highlight'}
          >
            <Stat value="200+" label={isEn ? 'businesses' : 'negosyo'} />
            <Stat
              value="14k+"
              label={isEn ? 'bookings served' : 'na-serve na booking'}
            />
            <Stat
              value="0"
              label={isEn ? 'app installs needed' : 'app install'}
            />
          </dl>
        </div>

        {/* Component label watermark — for developer orientation only.
            Pointer-events-none + low contrast so it never competes with
            the content. */}
        <span
          aria-hidden="true"
          className="font-mono text-[10px] font-light tracking-wider text-[#e8f5ef]/20"
        >
          {/* (auth)/layout.tsx */}
        </span>
      </aside>

      {/* Right panel — fixed 420px on desktop; full-width on mobile.
          The form lives here. The 1px white/[0.07] border on the left
          edge is the seam, not a colored accent stripe. */}
      <main className="relative z-10 flex w-full flex-col border-l border-white/[0.07] bg-[#0a1f1a]/60 backdrop-blur-sm lg:w-105 lg:min-w-105">
        {/* Mobile-only wordmark — only visible below the lg breakpoint.
            On desktop the left panel already carries the wordmark, so
            we hide this to avoid duplication. */}
        <div className="flex items-center px-8 pt-10 lg:hidden">
          <Link
            href={`/${lang}` as Route}
            aria-label="Takda home"
            className="group inline-flex items-center gap-2"
          >
            <span className="font-(family-name:--font-display) text-xl font-extrabold tracking-tight text-[#e8f5ef] transition-colors group-hover:text-white">
              Takda
            </span>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#1D9E75]"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-8 py-12 sm:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Stat — a single number + label pair for the highlights row.
 * The number uses the display family at semibold to anchor the eye;
 * the label is thin 11px sans below. Sized small on purpose — this is
 * a stat row, not a hero-metric template.
 */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-2 pr-6 first:pl-0 last:pr-0">
      <dt className="font-(family-name:--font-display) text-[1.75rem] font-semibold leading-none tracking-[-0.015em] text-[#e8f5ef]">
        {value}
      </dt>
      <dd className="text-[11px] font-light tracking-wide text-[#e8f5ef]/50">
        {label}
      </dd>
    </div>
  );
}
