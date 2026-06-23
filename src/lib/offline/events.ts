import { APP_API_NOTICE_EVENT, type ApiNoticePayload } from '@/lib/offline/constants';

export function emitApiNotice(payload: ApiNoticePayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ApiNoticePayload>(APP_API_NOTICE_EVENT, { detail: payload }));
}

export function subscribeApiNotice(listener: (payload: ApiNoticePayload) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ApiNoticePayload>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(APP_API_NOTICE_EVENT, handler);
  return () => window.removeEventListener(APP_API_NOTICE_EVENT, handler);
}

