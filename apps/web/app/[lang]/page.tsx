import {
  NavBar,
  HeroSection,
  DemoFrame,
  FeaturesSection,
  FooterBar,
} from '@/pages/[lang]/_index';

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;

  return (
    <div className="relative isolate min-h-screen w-full overflow-x-clip bg-background text-foreground transition-colors duration-300 font-sans">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(26,140,117,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(26,140,117,0.05)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_80%_60%_at_50%_30%,#000_55%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(168,221,212,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,221,212,0.06)_1px,transparent_1px)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 z-0 h-160 w-160 rounded-full bg-[radial-gradient(circle,rgba(29,158,117,0.2)_0%,rgba(29,158,117,0.04)_45%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(29,158,117,0.35)_0%,rgba(29,158,117,0.08)_45%,transparent_72%)] blur-3xl"
      />

      {/* Amber radial glow — bottom-right counterweight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-32 z-0 h-140 w-140 rounded-full bg-[radial-gradient(circle,rgba(217,158,73,0.15)_0%,rgba(217,158,73,0.03)_45%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(217,158,73,0.22)_0%,rgba(217,158,73,0.06)_45%,transparent_72%)] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-border/40"
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar lang={lang} />
        <main className="flex-1">
          <HeroSection lang={lang} />
          <DemoFrame lang={lang} />
          <FeaturesSection lang={lang} />
        </main>
        <FooterBar lang={lang} />
      </div>
    </div>
  );
}
