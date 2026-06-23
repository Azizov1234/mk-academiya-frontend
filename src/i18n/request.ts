import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, defaultTimeZone, isAppLocale, localeCookieName } from './config';

const isCapacitorExport = process.env.CAPACITOR_EXPORT === 'true';

export default getRequestConfig(async () => {
  if (isCapacitorExport) {
    return {
      locale: defaultLocale,
      messages: (await import(`../messages/${defaultLocale}.json`)).default,
      timeZone: defaultTimeZone,
      now: new Date(),
    };
  }

  const { cookies, headers } = await import('next/headers');
  const headerStore = await headers();
  const cookieStore = await cookies();

  const headerLocale = headerStore.get('x-locale');
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  let locale = defaultLocale;
  if (isAppLocale(headerLocale ?? '')) {
    locale = headerLocale as typeof defaultLocale;
  } else if (isAppLocale(cookieLocale ?? '')) {
    locale = cookieLocale as typeof defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: defaultTimeZone,
  };
});
