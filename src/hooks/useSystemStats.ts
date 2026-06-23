'use client';

import { useCallback } from 'react';
import { getSystemHealth, getSystemStats } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useSystemStats(enabled = true) {
  const request = useCallback(async () => {
    const [health, stats] = await Promise.all([getSystemHealth(), getSystemStats()]);

    return {
      health,
      stats,
    };
  }, []);

  return useApiRequest({
    enabled,
    initialData: {
      health: null as any,
      stats: null as any,
    },
    request,
    requestKey: 'system:stats',
  });
}

export function useSystemHealth(enabled = true) {
  const request = useCallback(() => getSystemHealth(), []);

  return useApiRequest({
    enabled,
    initialData: null,
    request,
    requestKey: 'system:health',
  });
}
