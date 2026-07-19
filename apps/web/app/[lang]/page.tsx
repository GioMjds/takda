import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#f7fafa]">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-[#a8ddd4]/30">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a8c75]/10 text-[#1a8c75] font-bold text-2xl tracking-wider">
            T
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0d4f43]">
            Takda
          </h1>
          <p className="text-sm text-[#0d4f43]/70 font-medium">
            {lang === 'en'
              ? 'Queue & Appointment booking made simple.'
              : 'Mas madaling pila at appointment booking para sa lahat.'}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href={`/${lang}/login` as Route}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a8c75] transition duration-200"
          >
            {dict.login.title}
          </Link>
          <Link
            href={`/${lang}/onboarding` as Route}
            className="w-full flex items-center justify-center px-4 py-3 border border-[#1a8c75]/30 text-sm font-semibold rounded-xl text-[#1a8c75] bg-[#1a8c75]/5 hover:bg-[#1a8c75]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a8c75] transition duration-200"
          >
            {dict.onboarding.title}
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-center gap-4 text-xs font-semibold text-[#1a8c75]">
          <Link
            href={(lang === 'en' ? '/tl' : '/en') as Route}
            className="hover:underline"
          >
            {lang === 'en' ? 'Mag-Tagalog' : 'Switch to English'}
          </Link>
        </div>
      </div>
    </main>
  );
}
