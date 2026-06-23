'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { offlineGet, type AppApiError } from '@/lib/offline/request';
import { normalizeApiError } from '@/lib/offline/errors';
import { useRefetchOnReconnect } from '@/hooks/useRefetchOnReconnect';

interface UseOfflineQueryOptions<T> {
  url: string;
  config?: AxiosRequestConfig;
  enabled?: boolean;
  initialData?: T;
}

interface UseOfflineQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: AppApiError | null;
  fromCache: boolean;
  cachedAt?: string;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

function isEmptyData(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function useOfflineQuery<T>(options: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const { url, config, enabled = true, initialData } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<AppApiError | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | undefined>(undefined);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await offlineGet<T>(url, config);
      setData(result.data);
      setFromCache(result.fromCache);
      setCachedAt(result.cachedAt);
    } catch (fetchError) {
      setError(normalizeApiError(fetchError));
    } finally {
      setLoading(false);
    }
  }, [config, enabled, url]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useRefetchOnReconnect(refetch);

  const isEmpty = useMemo(() => !loading && !error && isEmptyData(data), [data, error, loading]);

  return {
    data,
    loading,
    error,
    fromCache,
    cachedAt,
    isEmpty,
    refetch,
  };
}

