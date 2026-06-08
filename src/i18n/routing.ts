import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'pt', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always prefix so PT/ES/EN URLs are explicit and shareable (/pt, /es, /en).
  localePrefix: 'always',
});
