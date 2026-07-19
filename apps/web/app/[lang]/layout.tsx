import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { Google_Sans, Raleway } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import Providers from '../providers';
import { notFound } from 'next/navigation';

const googleSans = Google_Sans({
  variable: '--font-google-sans',
  subsets: ['latin'],
});

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d4f43',
};

const locales = ['en', 'tl'];
type Locale = (typeof locales)[number];

const hasLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: {
      default: lang === 'tl' ? 'Takda - Pila at Appointment' : 'Takda - Queue & Appointments',
      template: '%s | Takda',
    },
    description: lang === 'tl'
      ? 'Sistema para sa mas madaling pila at appointment booking.'
      : 'Queue and appointment booking platform for walk-in businesses.',
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  // Add more JSON-LD fields as more as possible
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${googleSans.variable} ${raleway.variable} antialiased font-sans bg-[#f7fafa] text-[#0d4f43]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
