'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppApiError, getUserFriendlyErrorMessage } from '@/lib/offline/errors';

interface UseApiRequestOptions<T> {
  enabled?: boolean;
  debounceMs?: number;
  initialData: T;
  request: () => Promise<T>;
  requestKey?: string | number | boolean | null;
  staleTimeMs?: number;
}

type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const requestCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function normalizeCacheKey(requestKey: UseApiRequestOptions<unknown>['requestKey']) {
  if (requestKey === null || requestKey === undefined || requestKey === false) {
    return null;
  }

  return String(requestKey);
}

function normalizeRequestError(error: unknown) {
  if (error instanceof AppApiError) {
    return error.message;
  }

  return getUserFriendlyErrorMessage(error, "Server bilan ishlashda noma'lum xatolik yuz berdi");
}

export function useApiRequest<T>({
  enabled = true,
  debounceMs = 0,
  initialData,
  request,
  requestKey = null,
  staleTimeMs = 30_000,
}: UseApiRequestOptions<T>) {
  const cacheKey = normalizeCacheKey(requestKey);
  const initialDataRef = useRef(initialData);
  const cachedEntry = cacheKey ? (requestCache.get(cacheKey) as CacheEntry<T> | undefined) : undefined;
  const [data, setData] = useState<T>(cachedEntry?.data ?? initialData);
  const [loading, setLoading] = useState(enabled && !cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(request);

  requestRef.current = request;

  const execute = useCallback(async (options?: { background?: boolean; force?: boolean }) => {
    const cacheExists = Boolean(cacheKey && requestCache.has(cacheKey));
    const shouldKeepCurrentData = options?.background || cacheExists;
    const cached = cacheKey ? requestCache.get(cacheKey) : undefined;
    const cacheFresh =
      Boolean(cached) &&
      staleTimeMs > 0 &&
      Date.now() - (cached?.updatedAt || 0) < staleTimeMs;

    if (cacheFresh && !options?.force) {
      setLoading(false);
      return;
    }

    if (!shouldKeepCurrentData) {
      setLoading(true);
    }
    setError(null);

    try {
      let response: T;

      if (cacheKey) {
        const existingRequest = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
        const requestPromise =
          existingRequest ??
          requestRef.current().finally(() => {
            inFlightRequests.delete(cacheKey);
          });

        if (!existingRequest) {
          inFlightRequests.set(cacheKey, requestPromise);
        }

        response = await requestPromise;
      } else {
        response = await requestRef.current();
      }

      setData(response);
      if (cacheKey) {
        requestCache.set(cacheKey, {
          data: response,
          updatedAt: Date.now(),
        });
      }
    } catch (requestError) {
      setError(normalizeRequestError(requestError));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, staleTimeMs]);

  useEffect(() => {
    const nextCachedEntry = cacheKey
      ? (requestCache.get(cacheKey) as CacheEntry<T> | undefined)
      : undefined;

    setData(nextCachedEntry?.data ?? initialDataRef.current);
    setLoading(enabled && !nextCachedEntry);
    setError(null);
  }, [cacheKey, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const hasCachedData = Boolean(cacheKey && requestCache.has(cacheKey));

    if (debounceMs > 0) {
      const timer = window.setTimeout(() => {
        void execute({ background: hasCachedData });
      }, debounceMs);

      return () => window.clearTimeout(timer);
    }

    void execute({ background: hasCachedData });
  }, [cacheKey, debounceMs, enabled, execute]);

  return {
    data,
    loading,
    error,
    refetch: () => execute({ force: true }),
  };
}
