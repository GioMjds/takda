import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { Raleway } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-provider';
import Providers from '../providers';
import { notFound } from 'next/navigation';

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
  // Marketing surfaces use the full weight range (200-900). The page
  // does not import this font directly — it reads `var(--font-raleway)`
  // via the marketing layout's display token.
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
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
      default:
        lang === 'tl'
          ? 'Takda - Pila at Appointment'
          : 'Takda - Queue & Appointments',
      template: '%s | Takda',
    },
    description:
      lang === 'tl'
        ? 'Sistema para sa mas madaling pila at appointment booking.'
        : 'Queue and appointment booking platform for walk-in businesses.',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Takda',
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
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
        className={`${raleway.variable} antialiased font-sans font-display bg-[#f7fafa] text-[#0d4f43]`}
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
