'use client';

import { useCallback } from 'react';
import { getMyTestAttempts, getStudentTestAttempts } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useTestAttempts(studentId: number | null, enabled = true) {
  const request = useCallback(
    () => (studentId ? getStudentTestAttempts(Number(studentId)) : getMyTestAttempts()),
    [studentId],
  );

  return useApiRequest({
    enabled,
    initialData: [] as Awaited<ReturnType<typeof getMyTestAttempts>>,
    request,
    requestKey: studentId ?? 'me',
  });
}
