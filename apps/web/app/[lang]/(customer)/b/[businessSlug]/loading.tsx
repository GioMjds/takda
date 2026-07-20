import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for the booking page.
 *
 * Skeletons are styled to match the real surface dimensions so the
 * page doesn't shift when content streams in. We mirror the dark
 * customer atmosphere (single teal glow + grid) at a lower intensity
 * so the loading state is not a flat dark slab, but we don't
 * over-promise detail — the eye should land on the slot grid shape
 * since that's the interactive core.
 */
export default function BookingLoading() {
  return (
    <div
      className="relative isolate min-h-full w-full"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Faint teal glow so the loading surface has the same
          atmospheric anchor as the rendered page. Lower opacity than
          the layout's resting glow so the page reads as "in flight". */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 z-0 size-80 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.10)_0%,rgba(29,158,117,0.02)_45%,transparent_72%)] blur-3xl"
      />

      <div className="relative z-10 space-y-7">
        {/* Business header skeleton — logo + name + status pill. */}
        <header className="flex flex-col items-center pt-3 text-center">
          <Skeleton className="size-14 rounded-xl bg-white/[0.06]" />
          <Skeleton className="mt-4 h-6 w-44 rounded-md bg-white/[0.07]" />
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-full bg-white/[0.05]" />
            <Skeleton className="h-4 w-24 rounded-full bg-white/[0.05]" />
          </div>
        </header>

        {/* Service selector skeleton — only shown when the business has
            multiple services, but we always reserve its space to keep
            the page shift-free. */}
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-28 bg-white/[0.05]" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-28 shrink-0 rounded-full bg-white/[0.05]"
              />
            ))}
          </div>
        </div>

        {/* Slot grid + form card skeleton — the heavy work area. */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-40 bg-white/[0.05]" />
            <Skeleton className="h-3 w-12 bg-white/[0.05]" />
          </div>
          <div className="grid grid-cols-3 gap-[5px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-14 rounded-md bg-white/[0.04]"
              />
            ))}
          </div>
        </section>

        {/* Form skeleton — name + phone + CTA. Same dark surface as
            the loaded page so there's no color shift on hydration. */}
        <section className="space-y-3 pt-2">
          <Skeleton className="h-3 w-24 bg-white/[0.05]" />
          <Skeleton className="h-11 w-full rounded-md bg-white/[0.05]" />
          <Skeleton className="h-3 w-28 bg-white/[0.05]" />
          <Skeleton className="h-11 w-full rounded-md bg-white/[0.05]" />
          <Skeleton className="mt-2 h-12 w-full rounded-lg bg-[#1D9E75]/30" />
        </section>
      </div>
    </div>
  );
}
