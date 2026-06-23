'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { OFFLINE_BANNER_MESSAGE } from '@/lib/offline/constants';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineStatusBanner() {
  const { isOnline, ready } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const previousOnline = useRef<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (previousOnline.current === null) {
      previousOnline.current = isOnline;
      return;
    }

    if (previousOnline.current === false && isOnline) {
      setShowReconnected(true);
      const timer = window.setTimeout(() => setShowReconnected(false), 3000);
      previousOnline.current = isOnline;
      return () => window.clearTimeout(timer);
    }

    previousOnline.current = isOnline;
    return undefined;
  }, [isOnline, ready]);

  if (!ready) return null;

  if (!isOnline) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
        <div className="flex items-center gap-2">
          <WifiOff size={16} />
          <p className="text-xs font-bold uppercase tracking-wider">{OFFLINE_BANNER_MESSAGE}</p>
        </div>
        <p className="mt-1 text-xs font-medium text-amber-800/90">O&apos;zgartirish yuborish uchun internetga ulaning.</p>
      </div>
    );
  }

  if (!showReconnected) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm">
      <div className="flex items-center gap-2">
        <Wifi size={16} />
        <p className="text-xs font-bold uppercase tracking-wider">Internet qaytdi</p>
      </div>
      <p className="mt-1 text-xs font-medium text-emerald-800/90">Ma&apos;lumotlar qayta yangilanmoqda.</p>
    </div>
  );
}

