import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
          {dict.dashboard.tabs.analytics}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {lang === 'en'
            ? 'Monitor peak hours, weekly bookings growth, and no-show trends.'
            : 'Subaybayan ang pinaka-abalang oras, lingguhang pagtaas ng booking, at trend ng mga hindi sumisipot.'}
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Bookings Chart Mock */}
        <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
              {lang === 'en' ? 'Weekly Bookings' : 'Lingguhang Booking'}
            </span>
            <div className="text-2xl font-extrabold text-[#0d4f43] mt-1">
              128
            </div>
            <span className="text-xs font-semibold text-[#1a8c75] bg-[#e3f5f0] px-2 py-0.5 rounded mt-1 inline-block">
              +15% {lang === 'en' ? 'vs last week' : 'kumpara sa nakaraang linggo'}
            </span>
          </div>

          {/* Sparkline SVG Mock */}
          <div className="h-16 w-full pt-4">
            <svg className="w-full h-full text-[#1a8c75]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,25 Q15,18 30,22 T60,8 T90,5 T100,2"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0,25 Q15,18 30,22 T60,8 T90,5 T100,2 L100,30 L0,30 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>
        </div>

        {/* Peak Hours Chart Mock */}
        <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
              {lang === 'en' ? 'Peak Operational Time' : 'Pinaka-Abalang Oras'}
            </span>
            <div className="text-2xl font-extrabold text-[#0d4f43] mt-1">
              09:00 AM - 11:30 AM
            </div>
            <span className="text-xs text-[#0d4f43]/70 mt-1 block">
              {lang === 'en' ? 'Highest foot traffic days: Sat, Sun' : 'Pinaka-maraming tao: Sab, Lin'}
            </span>
          </div>

          {/* Bar SVG Mock */}
          <div className="h-16 w-full flex items-end justify-between pt-4 px-1 gap-1">
            {[40, 60, 50, 90, 80, 45, 30].map((val, i) => (
              <div
                key={i}
                style={{ height: `${val}%` }}
                className={`w-full rounded-t-sm ${
                  val > 75 ? 'bg-[#1a8c75]' : 'bg-[#a8ddd4]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* No Show Rate Mock */}
        <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
              {lang === 'en' ? 'No-Show Rate' : 'Rate ng mga Hindi Sumipot'}
            </span>
            <div className="text-2xl font-extrabold text-red-600 mt-1">
              4.2%
            </div>
            <span className="text-xs font-semibold text-[#1a8c75] bg-[#e3f5f0] px-2 py-0.5 rounded mt-1 inline-block">
              -1.5% {lang === 'en' ? 'vs last week' : 'kumpara sa nakaraang linggo'}
            </span>
          </div>

          <div className="text-xs text-[#0d4f43]/75 font-medium leading-relaxed">
            {lang === 'en'
              ? 'SMS reminders have successfully minimized missed appointments by 24% since implementation.'
              : 'Nakatulong ang SMS reminders na bawasan ang mga nakaligtaang appointment ng 24%.'}
          </div>
        </div>
      </div>
    </div>
  );
}
