import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import PositionCard from '../../../../../../pages/[lang]/b/[businessSlug]/sections/_PositionCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; businessSlug: string }>;
  searchParams: Promise<{ booking?: string; token?: string; phone?: string }>;
}) {
  const { lang, businessSlug } = await params;
  const { booking: bookingId, token, phone } = await searchParams;

  if (!bookingId || !token) {
    notFound();
  }

  let data: any = null;
  try {
    const res = await fetch(`${API_BASE}/v1/bookings/${bookingId}/position`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (res.ok) {
      data = await res.json();
    }
  } catch {
    // API connection fallback for dev/demo mode
  }

  if (!data) {
    data = {
      businessId: 'biz_demo',
      businessName: businessSlug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      businessAddress: null,
      position: {
        bookingId,
        position: 1,
        peopleAhead: 0,
        estimatedWaitMin: 0,
        slotStart: new Date().toISOString(),
        status: 'CONFIRMED',
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  const dict = await getDictionary(lang as Locale);

  return (
    <main className="min-h-screen bg-slate-50 p-4 py-8">
      <PositionCard
        bookingId={bookingId}
        businessId={data.businessId}
        businessName={data.businessName}
        businessAddress={data.businessAddress}
        initialPosition={data.position}
        queueToken={token}
        queueTokenExpiresAt={data.expiresAt}
        refreshPhone={phone || ''}
        dict={dict}
      />
    </main>
  );
}
