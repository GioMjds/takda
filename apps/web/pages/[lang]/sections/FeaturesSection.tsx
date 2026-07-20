import { QrCode, MessageSquare, LayoutList } from 'lucide-react';

export interface FeaturesSectionProps {
  lang: string;
}

export function FeaturesSection({ lang }: FeaturesSectionProps) {
  const isEn = lang === 'en';

  const features = [
    {
      icon: QrCode,
      title: isEn ? 'QR code on your counter' : 'QR code sa inyong counter',
      body: isEn
        ? 'Print the QR, stick it to the counter. Customers scan, book, and you see them in the queue — no app install, no paper lists.'
        : 'I-print ang QR, idikit sa counter. Customer mag-scan, mag-book, at makikita mo sila sa pila — walang app, walang papel.',
    },
    {
      icon: MessageSquare,
      title: isEn ? 'SMS reminders, auto-sent' : 'SMS reminders, awtomatiko',
      body: isEn
        ? 'Customers get a text 30 minutes before their slot. No-shows drop, walk-ins fill the gap, and your day stays on track.'
        : 'Customer makakatanggap ng text 30 minuto bago ang slot. Mga no-show ay bababa, walk-in ang pumupuno, at hindi magulo ang araw.',
    },
    {
      icon: LayoutList,
      title: isEn
        ? 'Live queue behind the counter'
        : 'Live na pila sa likod ng counter',
      body: isEn
        ? 'One screen, in order. Mark arrivals, add walk-ins, and reshuffle without losing your place. Everything updates the moment it happens.'
        : 'Isang screen, naka-ayos. I-mark ang dating, magdagdag ng walk-in, at mag-reshuffle nang hindi nawawala. Lahat updated agad.',
    },
  ] as const;

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mb-12 max-w-2xl sm:mb-14">
        <h2
          id="features-title"
          className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.4vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-foreground text-balance"
        >
          {isEn ? (
            <>
              Built for the way{' '}
              <span className="text-primary dark:text-[#5DCAA5]">your counter</span> actually
              runs.
            </>
          ) : (
            <>
              Ginawa para sa paraan ng pagtakda{' '}
              <span className="text-primary dark:text-[#5DCAA5]">ng inyong counter</span>.
            </>
          )}
        </h2>
        <p className="mt-4 max-w-md text-sm font-light text-muted-foreground">
          {isEn
            ? 'No new device to learn. No spreadsheet to babysit. Just the queue, finally in one place.'
            : 'Walang bagong device na dapat matutunan. Walang spreadsheet na bantayan. Ang pila, sa wakas, nasa iisang lugar.'}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="group rounded-xl border border-border/60 bg-card/80 p-5 shadow-2xs transition-all hover:border-primary/40 hover:bg-card hover:shadow-xs"
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary dark:text-[#5DCAA5] transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
              >
                <feature.icon className="size-4" />
              </span>
            </div>

            <h3 className="pb-2.5 text-[13px] font-semibold text-foreground border-b border-border/50">
              {feature.title}
            </h3>
            <p className="mt-2.5 text-[12px] font-normal leading-relaxed text-muted-foreground">
              {feature.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FeaturesSection;
