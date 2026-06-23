'use client';

import { useEffect, useState } from 'react';
import {
  getCurrentNetworkStatus,
  subscribeNetworkStatus,
  type NetworkStatusSnapshot,
} from '@/lib/offline/network';

const INITIAL_STATUS: NetworkStatusSnapshot = {
  isOnline: true,
  connectionType: 'unknown',
};

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatusSnapshot>(INITIAL_STATUS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCurrent = async () => {
      const current = await getCurrentNetworkStatus();
      if (active) {
        setStatus(current);
        setReady(true);
      }
    };

    void loadCurrent();

    const unsubscribe = subscribeNetworkStatus((next) => {
      if (active) {
        setStatus(next);
        setReady(true);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { ...status, ready };
}

