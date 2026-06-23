import axios, { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { buildGetCacheKey, getCachedGetResponse, normalizeHeaders, setCachedGetResponse } from '@/lib/offline/cache';
import { OFFLINE_BANNER_MESSAGE, OFFLINE_MUTATION_MESSAGE } from '@/lib/offline/constants';
import { AppApiError, normalizeApiError } from '@/lib/offline/errors';
import { emitApiNotice } from '@/lib/offline/events';
import { isNetworkOnline } from '@/lib/offline/network';
import { clearStoredAuth, getStoredToken } from '@/lib/auth-storage';
import { stripLocaleFromPathname } from '@/i18n/pathname';
import { isMockApiEnabled, mockApiAdapter } from '@/mocks/mock-api';
import { getApiBaseUrl } from '@/lib/api-url';

interface OfflineRequestMeta {
  cacheKey?: string;
}

type ApiRequestConfig = InternalAxiosRequestConfig & {
  offlineMeta?: OfflineRequestMeta;
};

export interface OfflineResponseMeta {
  fromCache: boolean;
  cachedAt?: string;
}

export type OfflineAwareAxiosResponse<T = unknown> = AxiosResponse<T> & {
  offline?: OfflineResponseMeta;
};

function setAuthorizationHeader(
  config: ApiRequestConfig,
  token: string,
) {
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function getCacheScope(token: string | null): string {
  if (!token) return 'public';
  return `token:${token.slice(-12)}`;
}

function resolveRequestUrl(config: ApiRequestConfig): string {
  const rawUrl = config.url || '';
  if (/^https?:\/\//.test(rawUrl)) return rawUrl;

  const base = config.baseURL || getApiBaseUrl();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
  return `${normalizedBase}${normalizedPath}`;
}

function isGetRequest(config: ApiRequestConfig): boolean {
  return (config.method || 'get').toUpperCase() === 'GET';
}

function isMutationRequest(config: ApiRequestConfig): boolean {
  const method = (config.method || 'get').toUpperCase();
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  adapter: isMockApiEnabled() ? mockApiAdapter : undefined,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (incomingConfig) => {
  const config = incomingConfig as ApiRequestConfig;
  const token = await getStoredToken();
  const rawUrl = config.url || '';

  if (!/^https?:\/\//.test(rawUrl)) {
    config.baseURL = getApiBaseUrl();
  }

  if (token) {
    setAuthorizationHeader(config, token);
  }

  const isOnline = await isNetworkOnline();

  if (isGetRequest(config)) {
    config.offlineMeta = {
      cacheKey: buildGetCacheKey({
        url: resolveRequestUrl(config),
        params: config.params,
        scope: getCacheScope(token),
      }),
    };
  }

  if (!isOnline && isMutationRequest(config)) {
    emitApiNotice({ type: 'error', message: OFFLINE_MUTATION_MESSAGE });

    const error = new AppApiError({
      code: 'OFFLINE_MUTATION',
      message: OFFLINE_MUTATION_MESSAGE,
    });
    (error as { config?: ApiRequestConfig }).config = config;
    return Promise.reject(error);
  }

  if (!isOnline && isGetRequest(config)) {
    const error = new AppApiError({
      code: 'OFFLINE',
      message: "Internet mavjud emas, cache tekshirilmoqda",
    });
    (error as { config?: ApiRequestConfig }).config = config;
    return Promise.reject(error);
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    const typedResponse = response as OfflineAwareAxiosResponse<unknown>;
    const config = response.config as ApiRequestConfig;

    if (isGetRequest(config) && config.offlineMeta?.cacheKey) {
      try {
        await setCachedGetResponse(config.offlineMeta.cacheKey, {
          data: response.data,
          status: response.status,
          statusText: response.statusText || 'OK',
          headers: normalizeHeaders(response.headers),
        });
      } catch {
        // Cache write errors should not break successful network responses
      }
    }

    typedResponse.offline = { fromCache: false };
    return typedResponse;
  },
  async (error: unknown) => {
    const fallbackConfig =
      (axios.isAxiosError(error) ? error.config : null) || (error as { config?: ApiRequestConfig })?.config;
    const config = (fallbackConfig || {}) as ApiRequestConfig;

    if (isGetRequest(config) && config.offlineMeta?.cacheKey) {
      try {
        const cached = await getCachedGetResponse(config.offlineMeta.cacheKey);
        if (cached) {
          emitApiNotice({ type: 'info', message: OFFLINE_BANNER_MESSAGE });

          const cachedResponse: OfflineAwareAxiosResponse<unknown> = {
            data: cached.data,
            status: cached.status || 200,
            statusText: cached.statusText || 'OK (CACHE)',
            headers: cached.headers,
            config,
            request: axios.isAxiosError(error) ? error.request : undefined,
            offline: {
              fromCache: true,
              cachedAt: cached.cachedAt,
            },
          };

          return cachedResponse;
        }
      } catch (cacheError) {
        return Promise.reject(
          new AppApiError({
            code: 'CACHE_PARSE',
            message: "Cache ma'lumotini o'qishda xatolik yuz berdi",
            cause: cacheError,
          }),
        );
      }
    }

    if (error instanceof AppApiError && error.code === 'OFFLINE') {
      return Promise.reject(
        new AppApiError({
          code: 'OFFLINE_NO_CACHE',
          message: "Internet mavjud emas va cache ma'lumot topilmadi",
          cause: error,
        }),
      );
    }

    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = stripLocaleFromPathname(window.location.pathname);
      if (
        currentPath !== '/login' &&
        currentPath !== '/public-exam' &&
        currentPath !== '/public-rating'
      ) {
        await clearStoredAuth();
        window.location.href = '/';
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

export default api;
