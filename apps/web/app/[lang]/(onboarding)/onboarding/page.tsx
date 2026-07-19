import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';

export default async function OnboardingPage({
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
            {dict.onboarding.title}
          </h2>
          <p className="mt-2 text-sm text-[#0d4f43]/80">
            {dict.onboarding.subtitle}
          </p>
        </div>

        <form className="mt-8 space-y-6 text-left">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {dict.onboarding.businessName}
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                required
                placeholder="e.g. Mario's Barbershop"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>

            <div>
              <label
                htmlFor="businessSlug"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {dict.onboarding.businessSlug}
              </label>
              <div className="mt-1 flex rounded-lg border border-[#a8ddd4] overflow-hidden focus-within:ring-2 focus-within:ring-[#1a8c75]">
                <span className="inline-flex items-center px-3 bg-[#e3f5f0] text-xs font-semibold text-[#0d4f43]/80 border-r border-[#a8ddd4]/65">
                  takda.ph/b/
                </span>
                <input
                  id="businessSlug"
                  name="businessSlug"
                  type="text"
                  required
                  placeholder="marios"
                  className="block w-full px-3 py-2.5 bg-white text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-[#0d4f43]"
              >
                {dict.onboarding.phone}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="09XXXXXXXXX"
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-[#a8ddd4] rounded-lg text-sm text-[#0d4f43] placeholder-[#0d4f43]/40 focus:outline-none focus:ring-2 focus:ring-[#1a8c75] transition"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-[#f7fafa] bg-[#1a8c75] hover:bg-[#0d4f43] focus:outline-none focus:ring-2 focus:ring-[#a8ddd4] transition duration-200"
            >
              {dict.onboarding.submit}
            </button>
          </div>
        </form>

        <div className="pt-4 text-xs font-semibold text-[#1a8c75]">
          <Link href={`/${lang}/login` as Route} className="hover:underline">
            {dict.login.noAccount ? "Already have a business registered? Sign In" : "Sign In"}
          </Link>
        </div>
      </div>
    </main>
  );
}
