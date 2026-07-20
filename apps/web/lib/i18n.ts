export const LOCALES = ['tl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tl';

const dictionaries = {
  en: () => import('../app/[lang]/dictionaries/en.json').then((mod) => mod.default),
  tl: () => import('../app/[lang]/dictionaries/tl.json').then((mod) => mod.default),
};

export async function getDictionary(lang: Locale) {
  return dictionaries[lang] ? dictionaries[lang]() : dictionaries[DEFAULT_LOCALE]();
}
