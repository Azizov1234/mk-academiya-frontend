'use client';

import { useCallback } from 'react';
import { getCurrentProfile } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useProfile(enabled = true) {
  const request = useCallback(() => getCurrentProfile(), []);

  return useApiRequest({
    enabled,
    initialData: null,
    request,
    requestKey: 'profile:me',
  });
}
