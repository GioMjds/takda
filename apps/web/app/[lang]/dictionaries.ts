import 'server-only';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((mod) => mod.default),
  tl: () => import('./dictionaries/tl.json').then((mod) => mod.default),
};

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = (locale: Locale) => dictionaries[locale]();
