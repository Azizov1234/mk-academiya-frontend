import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isAppLocale, localeCookieName } from './src/i18n/config';
import { getLocaleFromPathname, stripLocaleFromPathname } from './src/i18n/pathname';

const PUBLIC_FILE_REGEX = /\.[^/]+$/;

function isBypassPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/manifest.webmanifest') ||
    PUBLIC_FILE_REGEX.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const localeFromPath = getLocaleFromPathname(pathname);

  if (localeFromPath) {
    const internalPathname = stripLocaleFromPathname(pathname);
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPathname;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', localeFromPath);

    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });

    response.cookies.set(localeCookieName, localeFromPath, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  }

  const response = NextResponse.next();
  const cookieLocale = request.cookies.get(localeCookieName)?.value;

  if (!isAppLocale(cookieLocale || '')) {
    response.cookies.set(localeCookieName, defaultLocale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
