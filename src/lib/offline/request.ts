import type { AxiosRequestConfig } from 'axios';
import api, { type OfflineAwareAxiosResponse } from '@/lib/api';
import { getUserFriendlyErrorMessage, normalizeApiError, type AppApiError } from '@/lib/offline/errors';

type MutationMethod = 'post' | 'put' | 'patch' | 'delete';

export interface OfflineGetResult<T> {
  data: T;
  fromCache: boolean;
  cachedAt?: string;
  rawResponse: OfflineAwareAxiosResponse<unknown>;
}

function unwrapResponseData<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)) {
    const nested = (raw as { data?: unknown }).data;
    if (nested !== undefined) return nested as T;
  }
  return raw as T;
}

export function getApiErrorMessage(error: unknown, fallback?: string): string {
  return getUserFriendlyErrorMessage(error, fallback);
}

export async function offlineGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<OfflineGetResult<T>> {
  try {
    const response = (await api.get(url, config)) as OfflineAwareAxiosResponse<unknown>;
    return {
      data: unwrapResponseData<T>(response.data),
      fromCache: Boolean(response.offline?.fromCache),
      cachedAt: response.offline?.cachedAt,
      rawResponse: response,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function offlineMutation<TResponse, TBody = unknown>(
  method: MutationMethod,
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  try {
    const response = (await api.request({
      ...config,
      method,
      url,
      data: body,
    })) as OfflineAwareAxiosResponse<unknown>;

    return unwrapResponseData<TResponse>(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export type { AppApiError };

