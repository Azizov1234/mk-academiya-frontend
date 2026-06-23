'use client';

import { useCallback } from 'react';
import { listTasks } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useTasks(enabled = true) {
  const request = useCallback(() => listTasks(), []);

  return useApiRequest({
    enabled,
    initialData: [] as any[],
    request,
    requestKey: 'tasks:list',
  });
}
