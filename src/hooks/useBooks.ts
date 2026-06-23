'use client';

import { useCallback } from 'react';
import { listBooks } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useBooks(enabled = true) {
  const request = useCallback(() => listBooks(), []);

  return useApiRequest({
    enabled,
    initialData: [] as any[],
    request,
    requestKey: 'books:list',
  });
}
