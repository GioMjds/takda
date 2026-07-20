/**
 * Booking segment layout.
 *
 * The dark atmosphere, the minimal top bar, and the `max-w-sm` content
 * column are owned by the parent `(customer)/layout.tsx` — the
 * customer surface is one scene, and per-route layers that change
 * the chrome would fragment it. This segment layer exists only to
 * scope future booking-specific concerns (e.g. a per-business
 * prefetch boundary) without leaking them into the rest of the
 * customer surface.
 */
export default async function BusinessLayout({
  children,
}: LayoutProps<'/[lang]/b/[businessSlug]'>) {
  return <>{children}</>;
}
