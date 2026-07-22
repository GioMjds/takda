import Link from 'next/link';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { Route } from 'next';
import { LogoutButton } from '@/components/shared/LogoutButton';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  // Define navigation items with Route types
  interface NavItem {
    name: string;
    href: Route;
    icon: React.ReactNode;
  }

  const navigationItems: NavItem[] = [
    {
      name: dict.dashboard.tabs.queue,
      href: `/${lang}/dashboard` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      name: dict.dashboard.tabs.slots,
      href: `/${lang}/dashboard/slots` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      name: dict.dashboard.tabs.history ?? 'History',
      href: `/${lang}/dashboard/history` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8m9 1v4l3 2"
          />
        </svg>
      ),
    },
    {
      name: dict.dashboard.tabs.qr,
      href: `/${lang}/dashboard/qr` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M4 8h.01M4 16h4v4M4 4h4v4H4V4zm12 0h4v4h-4V4z"
          />
        </svg>
      ),
    },
    {
      name: dict.dashboard.tabs.analytics,
      href: `/${lang}/dashboard/analytics` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
      ),
    },
    {
      name: dict.dashboard.tabs.settings,
      href: `/${lang}/dashboard/settings` as Route,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border/60 p-6 space-y-8 text-card-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            T
          </span>
          <span className="font-extrabold text-xl text-foreground tracking-tight">
            Takda
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="text-inherit">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer/Logout in sidebar */}
        <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs font-semibold text-muted-foreground">
          <span>Takda Owner</span>
          <LogoutButton lang={lang} className="text-primary hover:underline text-xs font-semibold" />
        </div>
      </aside>

      {/* Main Content shell */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header for mobile */}
        <header className="md:hidden flex items-center justify-between bg-card px-4 py-3 border-b border-border/60 text-card-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              T
            </span>
            <span className="font-bold text-base text-foreground tracking-tight">
              Takda
            </span>
          </div>
          <LogoutButton lang={lang} className="text-xs font-semibold text-primary hover:underline" />
        </header>

        {/* Dynamic page contents */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>

        {/* Bottom Nav bar for mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 flex justify-around py-2 z-50 text-card-foreground">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 text-center py-1 text-muted-foreground hover:text-primary active:text-primary transition-colors"
            >
              <span>{item.icon}</span>
              <span className="text-[10px] font-semibold mt-0.5">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
