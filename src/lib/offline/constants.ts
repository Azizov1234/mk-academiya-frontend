export const OFFLINE_MUTATION_MESSAGE = 'Internetga ulaning';
export const OFFLINE_BANNER_MESSAGE = "Offline rejim: cached ma'lumot ko'rsatilmoqda";

export const APP_API_NOTICE_EVENT = 'mk-academy:api-notice';

export type ApiNoticeType = 'info' | 'error' | 'success';

export interface ApiNoticePayload {
  type: ApiNoticeType;
  message: string;
}

