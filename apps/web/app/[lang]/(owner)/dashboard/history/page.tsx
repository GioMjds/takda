import { getPrimaryBusiness } from '@/lib/owner-session';
import { QueueHistoryView } from '@/views/[lang]/dashboard';

export default async function HistoryPage({
  params,
}: PageProps<'/[lang]/dashboard/history'>) {
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
            ? 'Finish onboarding to start taking bookings and see history here.'
            : 'Tapusin ang onboarding upang makatanggap ng booking at makita ang kasaysayan dito.'}
        </p>
      </div>
    );
  }

  return (
    <QueueHistoryView businessId={business.id} lang={lang} />
  );
}
