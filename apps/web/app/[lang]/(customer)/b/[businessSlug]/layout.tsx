import Link from 'next/link';
import type { Route } from 'next';

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string; businessSlug: string }>;
}) {
  const { lang, businessSlug } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7fafa]">
      {/* Minimal Header */}
      <header className="border-b border-[#a8ddd4]/30 bg-white">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            href={`/${lang}/b/${businessSlug}` as Route}
            className="flex items-center gap-2"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a8c75] text-[#f7fafa] font-bold text-sm">
              T
            </span>
            <span className="font-bold text-lg text-[#0d4f43] tracking-tight">
              Takda
            </span>
          </Link>
          <div className="text-xs font-semibold text-[#1a8c75]">
            <Link
              href={`/${lang === 'en' ? 'tl' : 'en'}/b/${businessSlug}` as Route}
              className="hover:underline"
            >
              {lang === 'en' ? 'Tagalog' : 'English'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area (Max width suited for mobile) */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
