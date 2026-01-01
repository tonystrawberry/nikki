import 'server-only';

// Re-export everything from config for convenience in server components
export {
  locales,
  type Locale,
  defaultLocale,
  localeNames,
  localeFlags,
  hasLocale,
  type Dictionary,
} from './i18n-config';

import type { Locale, Dictionary } from './i18n-config';

// Dynamic imports for dictionaries - only loads the needed locale (server-only)
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default as Dictionary),
  en: () => import('@/dictionaries/en.json').then((module) => module.default as Dictionary),
  ja: () => import('@/dictionaries/ja.json').then((module) => module.default as Dictionary),
};

// Get dictionary for a specific locale (server-only)
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
