'use client';

import { useCallback } from 'react';
import { listTests, type TestListQuery } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useTests(query: TestListQuery = {}, enabled = true) {
  const request = useCallback(() => listTests(query), [query]);
  const requestKey = [
    query.search || '',
    query.cefrLevel || '',
    query.type || '',
    query.courseId ?? '',
    query.isPublished === '' ? '' : String(query.isPublished ?? ''),
    query.isActive === '' ? '' : String(query.isActive ?? ''),
    query.page || 1,
    query.limit || 20,
  ].join('|');

  return useApiRequest({
    enabled,
    debounceMs: 250,
    initialData: { items: [], meta: null } as Awaited<ReturnType<typeof listTests>>,
    request,
    requestKey,
  });
}
