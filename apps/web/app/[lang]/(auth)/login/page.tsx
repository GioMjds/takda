import type { Metadata } from 'next';
import { LoginView } from '@/views/[lang]/login/_index';
import { getDictionary } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/login'>): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: `${dict.login.title}`,
    description: dict.login.subtitle,
  };
}

export default async function LoginPage({
  params,
}: PageProps<'/[lang]/login'>) {
  const { lang } = await params;
  return <LoginView lang={lang} />;
}
