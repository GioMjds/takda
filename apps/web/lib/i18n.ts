export const LOCALES = ['tl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tl';

export async function getDictionary(lang: Locale) {
  return (await import(`@/dictionaries/${lang}.json`)).default;
}
