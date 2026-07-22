import { getPrimaryBusiness } from '@/lib/owner-session';
import { getOwnerQueue, getOwnerServices } from '@/lib/owner-queue';
import { LiveQueueView } from '@/views/[lang]/dashboard';
import type { WalkInService } from '@/views/[lang]/dashboard';
import type { LiveQueue } from '@takda/shared';

/// Owner live-queue dashboard (#12). Server Component: resolves the owner's
/// primary business and SSR-fetches the initial queue + services so the first
/// paint is populated, then hands off to the client `LiveQueueView` which polls
/// over REST (the WS gateway only auths customer tokens, not owner JWTs).
export default async function DashboardPage({
  params,
}: PageProps<'/[lang]/dashboard'>) {
  const { lang } = await params;

  const business = await getPrimaryBusiness();

  if (!business) {
    return (
      <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <h1 className="text-2xl font-bold text-[#0d4f43]">
          {lang === 'en' ? 'No business yet' : 'Wala pang negosyo'}
        </h1>
        <p className="mt-2 text-sm text-[#0d4f43]/80">
          {lang === 'en'
            ? 'Finish onboarding to configure your business and start taking bookings.'
            : 'Tapusin ang onboarding upang i-set up ang iyong negosyo at makatanggap ng booking.'}
        </p>
      </div>
    );
  }

  const [initialQueue, initialServices] = await Promise.all([
    getOwnerQueue(business.id) as Promise<LiveQueue | null>,
    getOwnerServices(business.id) as Promise<WalkInService[]>,
  ]);

  return (
    <LiveQueueView
      businessId={business.id}
      businessName={business.name}
      lang={lang}
      initialQueue={initialQueue}
      initialServices={initialServices}
    />
  );
}
