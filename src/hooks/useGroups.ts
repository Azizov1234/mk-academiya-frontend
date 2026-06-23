'use client';

import { useCallback } from 'react';
import { useApiRequest } from '@/hooks/useApiRequest';
import { listGroups } from '@/lib/backend-api';

export function useGroups(searchTerm: string, enabled = true) {
  const request = useCallback(() => listGroups(searchTerm), [searchTerm]);

  return useApiRequest({
    enabled,
    debounceMs: 350,
    initialData: [] as any[],
    request,
    requestKey: searchTerm,
  });
}
