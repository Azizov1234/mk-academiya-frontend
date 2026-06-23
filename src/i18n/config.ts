export const locales = ['uz', 'ru', 'en'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';
export const localeCookieName = 'NEXT_LOCALE';
export const defaultTimeZone = 'Asia/Tashkent';

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
