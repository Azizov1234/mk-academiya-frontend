'use client';

import { useCallback } from 'react';
import { listUsers, type UserListQuery } from '@/lib/backend-api';
import { useApiRequest } from '@/hooks/useApiRequest';

export function useUsers(
  role: string | null,
  query: UserListQuery,
  enabled = true,
  strategy: 'scoped' | 'role-specific' = 'role-specific',
) {
  const requestKey = [
    role || '',
    strategy,
    query.page || 1,
    query.limit || 20,
    query.fullName || '',
    query.GroupName || '',
    query.user || '',
    query.isActive === undefined ? '' : String(query.isActive),
  ].join('|');
  const request = useCallback(
    () =>
      listUsers(
        role,
        {
          page: query.page || 1,
          limit: query.limit || 20,
          fullName: query.fullName,
          GroupName: query.GroupName,
          user: query.user,
          isActive: query.isActive,
        },
        strategy,
      ),
    [query.GroupName, query.fullName, query.isActive, query.limit, query.page, query.user, role, strategy],
  );

  return useApiRequest({
    enabled,
    debounceMs: 350,
    initialData: [] as any[],
    request,
    requestKey,
  });
}
