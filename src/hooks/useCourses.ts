'use client';

import { useCallback } from 'react';
import { listCourses, type CefrLevel } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useCourses(
  filters: {
    search?: string;
    level?: CefrLevel | '';
    page?: number;
    limit?: number;
  },
  enabled = true,
) {
  const requestKey = [
    filters.search || '',
    filters.level || '',
    filters.page || 1,
    filters.limit || 20,
  ].join('|');
  const request = useCallback(
    () =>
      listCourses({
        search: filters.search,
        level: filters.level || undefined,
        page: filters.page || 1,
        limit: filters.limit || 20,
      }),
    [filters.level, filters.limit, filters.page, filters.search],
  );

  return useApiRequest({
    enabled,
    debounceMs: 250,
    initialData: { items: [] as any[], meta: null as any },
    request,
    requestKey,
  });
}
