import type { Metadata } from 'next';
import { LoginView } from '@/pages/[lang]/login/_index';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

/**
 * Generate metadata dynamically based on the selected locale for SEO compliance.
 */
export async function generateMetadata({ params }: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: `${dict.login.title} | Takda`,
    description: dict.login.subtitle || 'Manage your walk-in queue and appointments.',
  };
}

/**
 * Thin route wrapper Server Component that delegates to the pages/[lang]/login presentation layer.
 */
export default async function LoginPage({ params }: PageProps<'/[lang]/login'>) {
  const { lang } = await params;
  return <LoginView lang={lang} />;
}
