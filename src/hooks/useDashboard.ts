'use client';

import { useCallback } from 'react';
import { useApiRequest } from '@/hooks/useApiRequest';
import { getDashboardStats } from '@/lib/backend-api';

export function useDashboard(enabled = true) {
  const request = useCallback(() => getDashboardStats(), []);

  return useApiRequest({
    enabled,
    initialData: null,
    request,
    requestKey: 'dashboard:stats',
  });
}
