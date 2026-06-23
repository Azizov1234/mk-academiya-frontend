import { Capacitor } from '@capacitor/core';

const DEFAULT_API_ORIGIN = 'http://api.mk-academia.uz';
const DEFAULT_API_URL = normalizeConfiguredApiUrl(DEFAULT_API_ORIGIN);
const FRONTEND_PROXY_PATH = '/api';

function normalizeApiPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');

  if (!normalizedPath || normalizedPath === '/') {
    return '/api';
  }

  if (normalizedPath === '/api/proxy') {
    return '/api';
  }

  return normalizedPath;
}

function normalizeConfiguredApiUrl(url: string) {
  const trimmedUrl = url.trim().replace(/^['"]|['"]$/g, '');
  const parsedUrl = new URL(trimmedUrl);

  parsedUrl.pathname = normalizeApiPath(parsedUrl.pathname);
  parsedUrl.hash = '';
  parsedUrl.search = '';

  return parsedUrl.toString().replace(/\/+$/, '');
}

function tryNormalizeApiUrl(url?: string | null) {
  if (!url?.trim()) return null;

  try {
    return normalizeConfiguredApiUrl(url);
  } catch {
    return null;
  }
}

function normalizeRelativeApiUrl(url?: string | null) {
  const trimmedUrl = url?.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmedUrl?.startsWith('/')) return null;

  try {
    const parsedUrl = new URL(trimmedUrl, 'http://localhost');
    return normalizeApiPath(parsedUrl.pathname);
  } catch {
    return FRONTEND_PROXY_PATH;
  }
}

function isLoopbackUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function isInsecureHttpUrl(url: string) {
  try {
    return new URL(url).protocol === 'http:';
  } catch {
    return false;
  }
}

function isSameOriginUrl(url: string) {
  if (typeof window === 'undefined') return false;

  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

function isNativeRuntime() {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
}

function isLocalWebRuntime() {
  if (typeof window === 'undefined') return false;

  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function shouldUseBrowserProxy(url: string) {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_CAPACITOR_EXPORT === 'true' || process.env.CAPACITOR_EXPORT === 'true') {
    return false;
  }
  if (isLoopbackUrl(url)) return false;
  if (isLocalWebRuntime()) return true;
  if (window.location.protocol !== 'https:') return false;
  return isInsecureHttpUrl(url);
}

export function getDirectApiBaseUrl() {
  const configuredServerApiUrl = process.env.NEXT_SERVER_API_URL?.trim();
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const configuredNativeApiUrl = process.env.NEXT_PUBLIC_NATIVE_API_URL?.trim();
  const capacitorExport = process.env.CAPACITOR_EXPORT === 'true';

  if (isNativeRuntime()) {
    const nativeApiUrl = tryNormalizeApiUrl(configuredNativeApiUrl);
    if (nativeApiUrl) return nativeApiUrl;

    const apiUrl = tryNormalizeApiUrl(configuredApiUrl);
    if (apiUrl && !isLoopbackUrl(apiUrl)) {
      return apiUrl;
    }

    return DEFAULT_API_URL;
  }

  if (typeof window !== 'undefined') {
    const apiUrl = tryNormalizeApiUrl(configuredApiUrl);

    if (apiUrl && (!isLoopbackUrl(apiUrl) || isLocalWebRuntime())) {
      return apiUrl;
    }

    const nativeApiUrl = tryNormalizeApiUrl(configuredNativeApiUrl);
    if (nativeApiUrl) return nativeApiUrl;

    return DEFAULT_API_URL;
  }

  const serverApiUrl = tryNormalizeApiUrl(configuredServerApiUrl);
  if (serverApiUrl) {
    return serverApiUrl;
  }

  const apiUrl = tryNormalizeApiUrl(configuredApiUrl);
  const nativeApiUrl = tryNormalizeApiUrl(configuredNativeApiUrl);

  if (nativeApiUrl && (!apiUrl || (capacitorExport && isLoopbackUrl(apiUrl)))) {
    return nativeApiUrl;
  }

  if (apiUrl && (!capacitorExport || !isLoopbackUrl(apiUrl))) {
    return apiUrl;
  }

  return DEFAULT_API_URL;
}

export function getApiBaseUrl() {
  const capacitorExport =
    process.env.NEXT_PUBLIC_CAPACITOR_EXPORT === 'true' ||
    process.env.CAPACITOR_EXPORT === 'true';

  if (typeof window !== 'undefined' && !isNativeRuntime() && !capacitorExport) {
    const relativeApiUrl = normalizeRelativeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    if (relativeApiUrl) return relativeApiUrl;
  }

  const directApiUrl = getDirectApiBaseUrl();

  if (isSameOriginUrl(directApiUrl)) {
    return normalizeRelativeApiUrl(new URL(directApiUrl).pathname) ?? FRONTEND_PROXY_PATH;
  }

  if (shouldUseBrowserProxy(directApiUrl)) {
    return FRONTEND_PROXY_PATH;
  }

  return directApiUrl;
}

export function getBackendProxyBaseUrl(frontendOrigin?: string) {
  const serverApiUrl = tryNormalizeApiUrl(process.env.NEXT_SERVER_API_URL);
  if (serverApiUrl) {
    return serverApiUrl;
  }

  const directApiUrl = getDirectApiBaseUrl();

  if (frontendOrigin) {
    try {
      if (new URL(directApiUrl).origin === frontendOrigin) {
        return tryNormalizeApiUrl(process.env.NEXT_PUBLIC_NATIVE_API_URL) ?? DEFAULT_API_URL;
      }
    } catch {
      return DEFAULT_API_URL;
    }
  }

  return directApiUrl;
}

export { DEFAULT_API_ORIGIN, DEFAULT_API_URL, FRONTEND_PROXY_PATH };
