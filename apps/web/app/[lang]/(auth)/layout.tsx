import Link from 'next/link';
import type { Route } from 'next';

export default async function AuthLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-background text-foreground transition-colors duration-300 font-sans antialiased">
      {/* Luminous teal radial glow — centered background atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-150 w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.15)_0%,rgba(29,158,117,0.03)_50%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(29,158,117,0.18)_0%,rgba(29,158,117,0.04)_50%,transparent_70%)] blur-3xl"
      />

      {/* Structural bookend lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-border/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-border/40"
      />

      {/* Centered, balanced two-column canvas */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Left panel — Brand identity */}
          <aside
            className="flex flex-col justify-between py-4 lg:col-span-6 lg:py-8 xl:col-span-7"
            aria-label={
              isEn ? 'Brand overview' : 'Pangkalahatang-ideya ng brand'
            }
          >
            {/* Wordmark */}
            <Link
              href={`/${lang}` as Route}
              aria-label="Takda home"
              className="group inline-flex w-fit items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1"
            >
              <span className="font-(family-name:--font-display) text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Takda
              </span>
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-primary transition-transform group-hover:scale-125"
              />
            </Link>

            {/* Editorial block */}
            <div className="mt-8 max-w-lg lg:mt-12">
              <h1 className="font-(family-name:--font-display) text-3xl font-medium leading-[1.18] tracking-[-0.02em] text-foreground text-balance sm:text-4xl lg:text-[2.65rem]">
                {isEn ? (
                  <>
                    Manage your queue,{' '}
                    <em className="font-(family-name:--font-display) italic font-semibold text-primary dark:text-[#5DCAA5] not-italic-fallback">
                      serve more
                    </em>{' '}
                    customers.
                  </>
                ) : (
                  <>
                    Pamahalaan ang iyong pila,{' '}
                    <em className="font-(family-name:--font-display) italic font-semibold text-primary dark:text-[#5DCAA5] not-italic-fallback">
                      magbigay ng serbisyo
                    </em>{' '}
                    sa mas marami.
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-md text-sm font-normal leading-relaxed text-muted-foreground sm:text-[15px]">
                {isEn
                  ? 'The QR-based queue system built for walk-in businesses across the Philippines.'
                  : 'QR-based queue system para sa mga walk-in na negosyo sa buong Pilipinas.'}
              </p>

              {/* Stat highlights row */}
              <dl
                className="mt-8 flex items-end divide-x divide-border/50 sm:mt-10 lg:mt-12"
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
          </aside>

          {/* Right panel — Form Card */}
          <main className="w-full lg:col-span-6 xl:col-span-5">
            <div className="w-full rounded-2xl border border-border/70 bg-card p-6 shadow-xl text-card-foreground sm:p-8 md:p-10 transition-colors">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 first:pl-0 last:pr-0 sm:px-6">
      <dt className="font-(family-name:--font-display) text-2xl font-bold leading-none tracking-[-0.015em] text-foreground sm:text-3xl">
        {value}
      </dt>
      <dd className="text-xs font-normal tracking-wide text-muted-foreground sm:text-[13px]">
        {label}
      </dd>
    </div>
  );
}
