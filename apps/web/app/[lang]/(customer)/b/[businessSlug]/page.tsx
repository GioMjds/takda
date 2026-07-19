import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';

// Mock slots for v1 initialization
const MOCK_SLOTS = [
  '08:00 AM',
  '08:15 AM',
  '08:30 AM',
  '08:45 AM',
  '09:00 AM',
  '09:15 AM',
  '09:30 AM',
  '09:45 AM',
  '10:00 AM',
];

export default async function BookingPage({
  params,
}: {
  params: Promise<{ lang: string; businessSlug: string }>;
}) {
  const { lang, businessSlug } = await params;
  const dict = await getDictionary(lang as Locale);

  // Capitalize business slug for mock name display
  const businessName = businessSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#0d4f43]">
          {businessName}
        </h1>
        <p className="text-sm text-[#0d4f43]/80 mt-1">
          {dict.booking.subtitle}
        </p>
      </div>

      {/* Booking Form Card */}
      <div className="bg-white p-6 rounded-[10px] border border-[#a8ddd4]/40 space-y-6">
        <div className="space-y-4 text-left">
          {/* Customer Name */}
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-semibold text-[#0d4f43]"
            >
              {dict.booking.name}
            </label>
            <input
              id="customerName"
              name="name"
              type="text"
              required
              placeholder="e.g. Juan dela Cruz"
              className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label
              htmlFor="customerPhone"
              className="block text-sm font-semibold text-[#0d4f43]"
            >
              {dict.booking.phone}
            </label>
            <input
              id="customerPhone"
              name="phone"
              type="tel"
              required
              placeholder="09XXXXXXXXX"
              className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
            />
          </div>

          {/* Slot Selection grid */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#0d4f43]">
              {lang === 'en' ? 'Available Slots' : 'Mga Bakanteng Oras'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOCK_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="py-3 px-2 border border-[#a8ddd4]/60 hover:border-[#1a8c75] hover:bg-[#e3f5f0]/30 rounded-lg text-xs font-bold text-[#0d4f43] transition text-center min-h-12 flex items-center justify-center"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Booking */}
        <Link
          href={`/${lang}/b/${businessSlug}/confirm` as Route}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200 text-center min-h-12"
        >
          {dict.booking.submit}
        </Link>
      </div>
    </div>
  );
}
