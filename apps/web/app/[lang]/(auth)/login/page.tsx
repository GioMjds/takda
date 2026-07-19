import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-[#f7fafa]">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-8 rounded-[10px] border border-[#a8ddd4]/40">
        <div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#1a8c75]/10 text-[#1a8c75] font-bold text-xl mb-4">
            T
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0d4f43]">
            {dict.login.title}
          </h2>
          <p className="mt-2 text-sm text-[#0d4f43]/80">
            {dict.login.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6 text-left">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {dict.login.phone}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="09XXXXXXXXX"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/50 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {dict.login.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200"
            >
              {dict.login.submit}
            </button>
          </div>
        </form>

        <div className="pt-4 text-xs font-semibold text-[#1a8c75]">
          <Link href={`/${lang}/onboarding` as Route} className="hover:underline">
            {dict.login.register}
          </Link>
        </div>
      </div>
    </main>
  );
}
