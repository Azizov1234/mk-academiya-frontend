'use client';

import { useCallback } from 'react';
import { listPublishedLeadQuestions, type PublicLeadQuestion } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function usePublishedLeadQuestions(enabled = true) {
  const request = useCallback(() => listPublishedLeadQuestions(), []);

  return useApiRequest({
    enabled,
    initialData: [] as PublicLeadQuestion[],
    request,
    requestKey: 'leads:published-questions',
  });
}
