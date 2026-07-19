import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ lang: string; businessSlug: string }>;
}) {
  const { lang, businessSlug } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      {/* Confirmation Card */}
      <div className="bg-white p-8 rounded-[10px] border border-[#a8ddd4]/40 text-center space-y-6 shadow-sm">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a8c75]/10 text-[#1a8c75]">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#0d4f43]">
            {dict.confirm.title}
          </h1>
          <p className="text-sm text-[#0d4f43]/80">
            {dict.confirm.subtitle}
          </p>
        </div>

        {/* Queue Info Block */}
        <div className="bg-[#e3f5f0]/50 p-6 rounded-lg border border-[#a8ddd4]/30 space-y-1">
          <span className="text-xs font-semibold text-[#0d4f43]/70 uppercase tracking-wider">
            {dict.confirm.queuePosition}
          </span>
          <div className="text-4xl font-extrabold text-[#1a8c75] tracking-tight">
            #5
          </div>
        </div>

        {/* SMS Reminder Note */}
        <p className="text-xs font-medium text-[#0d4f43]/70 px-4">
          {dict.confirm.reminder}
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href={`/${lang}/b/${businessSlug}` as Route}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-[#1a8c75]/30 rounded-lg text-sm font-semibold text-[#1a8c75] bg-white hover:bg-[#e3f5f0]/30 focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200 min-h-[48px]"
          >
            {dict.common.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
