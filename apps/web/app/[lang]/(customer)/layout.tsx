import type { Route } from 'next';
import Link from 'next/link';

export default async function CustomerLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const isEn = lang === 'en';
  const homePath = `/${lang}` as Route;
  const altLang = (isEn ? '/tl' : '/en') as Route;

  return (
    <div className="relative isolate flex min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300 font-sans">
      {/* 40px teal grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(26,140,117,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(26,140,117,0.05)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,#000_50%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(168,221,212,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,221,212,0.05)_1px,transparent_1px)]"
      />

      {/* Single teal glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 z-0 size-80 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.18)_0%,rgba(29,158,117,0.04)_45%,transparent_72%)] blur-3xl"
      />

      {/* Hairline top border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-border/40"
      />

      {/* Minimal top bar */}
      <div className="relative z-10 flex w-full flex-col">
        <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-xs">
          <div className="mx-auto flex h-12 max-w-sm items-center justify-between px-4">
            <Link
              href={homePath}
              aria-label="Takda home"
              className="group inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1"
            >
              <span className="font-(family-name:--font-display)] text-[15px] font-extrabold tracking-tight text-foreground">
                Takda
              </span>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
            </Link>
            <Link
              href={altLang}
              aria-label={isEn ? 'Switch to Tagalog' : 'Lumipat sa English'}
              className="rounded-md px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isEn ? 'Tagalog' : 'English'}
            </Link>
          </div>
        </header>

        {/* Content column */}
        <main className="mx-auto w-full max-w-sm flex-1 px-4 pb-16 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
