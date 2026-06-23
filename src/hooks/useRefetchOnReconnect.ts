'use client';

import { useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function useRefetchOnReconnect(refetch: () => Promise<void> | void) {
  const { isOnline, ready } = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      void refetch();
    }
  }, [isOnline, ready, refetch]);
}

