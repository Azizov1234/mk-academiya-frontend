'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { subscribeApiNotice } from '@/lib/offline/events';
import type { ApiNoticePayload } from '@/lib/offline/constants';

interface NoticeState extends ApiNoticePayload {
  id: number;
}

export function GlobalApiNotice() {
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeApiNotice((payload) => {
      setNotice({
        ...payload,
        id: Date.now(),
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const view = useMemo(() => {
    if (!notice) return null;

    if (notice.type === 'error') {
      return {
        icon: <AlertCircle size={16} />,
        className: 'border-red-200 bg-red-50 text-red-900',
      };
    }

    if (notice.type === 'success') {
      return {
        icon: <CheckCircle2 size={16} />,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    }

    return {
      icon: <Info size={16} />,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
    };
  }, [notice]);

  if (!notice || !view) return null;

  return (
    <div className="pointer-events-none fixed bottom-[calc(var(--app-bottom-nav-height)+1.25rem+var(--app-safe-bottom))] left-1/2 z-[999] w-[92%] max-w-md -translate-x-1/2 lg:bottom-8">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-lg ${view.className}`}>
        {view.icon}
        <span>{notice.message}</span>
      </div>
    </div>
  );
}

