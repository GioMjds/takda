import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div
      className="relative isolate min-h-screen w-full overflow-hidden bg-[#0a1f1a]"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Glows preserved at lower intensity so the page is not a flat
          dark slab while the real content streams in. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 z-0 h-160 w-160 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.18)_0%,rgba(29,158,117,0.05)_45%,transparent_72%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-140 w-140 rounded-full bg-[radial-gradient(circle,rgba(217,158,73,0.12)_0%,rgba(217,158,73,0.04)_45%,transparent_72%)] blur-3xl"
      />

      <div className="relative z-10">
        {/* Nav skeleton */}
        <div className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0a1f1a]/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
            <Skeleton className="h-5 w-20 bg-white/6" />
            <Skeleton className="h-9 w-28 rounded-md bg-white/6" />
          </div>
        </div>

        {/* Hero skeleton — matches the hero's H1 + sub + actions. */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-20 pb-16 text-center sm:px-8 sm:pt-28 sm:pb-20">
          <Skeleton className="h-6 w-56 rounded-full bg-white/6" />
          <Skeleton className="mt-7 h-14 w-3/4 max-w-3xl rounded-xl bg-white/6 sm:h-16" />
          <Skeleton className="mt-4 h-12 w-2/3 max-w-2xl rounded-xl bg-white/5 sm:mt-3" />
          <Skeleton className="mt-7 h-5 w-80 max-w-md rounded bg-white/5" />
          <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:flex-row">
            <Skeleton className="h-12 w-full rounded-xl bg-white/8 sm:w-48" />
            <Skeleton className="h-12 w-full rounded-xl bg-white/5 sm:w-44" />
          </div>
        </section>

        {/* Demo frame skeleton — two columns at lg+, stacked otherwise. */}
        <section className="mx-auto w-full max-w-6xl px-6 sm:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/3">
            <div className="border-b border-white/6 px-4 py-3">
              <Skeleton className="mx-auto h-7 w-full max-w-md rounded-md bg-white/5" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="space-y-5 border-b border-white/6 p-5 sm:p-7 lg:border-b-0 lg:border-r">
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-xl bg-white/6" />
                  <Skeleton className="h-4 w-40 bg-white/5" />
                  <Skeleton className="h-4 w-24 bg-white/5" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded-md bg-white/4" />
                  ))}
                </div>
                <Skeleton className="h-10 rounded-lg bg-white/4" />
                <Skeleton className="h-10 rounded-lg bg-white/4" />
                <Skeleton className="h-10 w-full rounded-lg bg-white/8" />
              </div>
              <div className="space-y-4 p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-white/5" />
                  <Skeleton className="h-4 w-16 bg-white/5" />
                </div>
                <div className="space-y-1 rounded-lg border border-white/6 bg-white/15">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-b border-white/4 px-3 py-2.5 last:border-b-0"
                    >
                      <Skeleton className="h-5 w-5 rounded-full bg-white/5" />
                      <Skeleton className="h-3 flex-1 bg-white/4" />
                      <Skeleton className="h-4 w-16 bg-white/5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features skeleton */}
        <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
          <Skeleton className="h-10 w-2/3 max-w-xl rounded bg-white/6" />
          <Skeleton className="mt-4 h-4 w-1/2 max-w-md bg-white/4" />
          <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/3 p-5">
                <Skeleton className="mb-4 h-8.5 w-8.5 rounded-lg bg-white/6" />
                <Skeleton className="h-3 w-3/4 bg-white/6" />
                <Skeleton className="mt-3 h-2.5 w-full bg-white/4" />
                <Skeleton className="mt-2 h-2.5 w-5/6 bg-white/4" />
              </div>
            ))}
          </div>
        </section>

        {/* Footer skeleton */}
        <div className="border-t border-white/6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
            <Skeleton className="h-4 w-12 bg-white/5" />
            <Skeleton className="h-3 w-32 bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
