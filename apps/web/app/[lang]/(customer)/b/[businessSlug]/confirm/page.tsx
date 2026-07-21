import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import PositionCard from '@/views/[lang]/b/[businessSlug]/sections/_PositionCard';
import {
  getQueuePosition,
  decodeQueueTokenClaims,
} from '@/views/[lang]/b/[businessSlug]/api/_GET';

/// Turns a business slug into a human-readable title for display. The position
/// endpoint doesn't return the business name and there's no public
/// business-detail endpoint yet, so the slug is the best available source.
function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/gu, (l) => l.toUpperCase());
}

/// Next.js hands search params as `string | string[] | undefined`. This page
/// only ever expects single values, so collapse arrays to their first entry.
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmPage({
  params,
  searchParams,
}: PageProps<'/[lang]/b/[businessSlug]/confirm'>) {
  const { lang, businessSlug } = await params;
  const sp = await searchParams;

  const bookingId = firstValue(sp.booking);
  const token = firstValue(sp.token);
  const phone = firstValue(sp.phone) ?? '';

  if (!bookingId || !token) notFound();

  const position = await getQueuePosition(bookingId, token);

  // `businessId` (for the live socket) and the token expiry aren't part of the
  // position payload — read them from the queue token's own claims.
  const claims = decodeQueueTokenClaims(token);
  const businessId = claims?.businessId ?? '';
  const expiresAt = claims ? new Date(claims.exp * 1000).toISOString() : '';

  const dict = await getDictionary(lang as Locale);

  return (
    <main className="min-h-screen bg-slate-50 p-4 py-8">
      <PositionCard
        bookingId={bookingId}
        businessId={businessId}
        businessName={titleFromSlug(businessSlug)}
        businessAddress={null}
        initialPosition={position}
        queueToken={token}
        queueTokenExpiresAt={expiresAt}
        refreshPhone={phone}
        lang={lang}
        dict={dict}
      />
    </main>
  );
}
