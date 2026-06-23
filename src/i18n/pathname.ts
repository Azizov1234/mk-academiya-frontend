import { isAppLocale } from './config';

export function stripLocaleFromPathname(pathname: string): string {
  if (!pathname) return '/';

  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  if (!isAppLocale(maybeLocale)) {
    return pathname || '/';
  }

  const stripped = `/${segments.slice(2).join('/')}`.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  return isAppLocale(maybeLocale) ? maybeLocale : null;
}
