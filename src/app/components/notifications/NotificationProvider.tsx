'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  removeNotification,
  type AppNotification,
} from '@/lib/backend-api';
import {
  getDeviceNotificationPermission,
  initializeDeviceNotifications,
  requestDeviceNotificationPermission,
  sendDeviceNotification,
  type DeviceNotificationPermission,
} from '@/lib/device-notifications';
import { localizePath } from '@/i18n/localizedPath';
import { stripLocaleFromPathname } from '@/i18n/pathname';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

type NotificationContextValue = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  permission: DeviceNotificationPermission;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  requestPermission: () => Promise<void>;
  openNotification: (notification: AppNotification) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const PUBLIC_PATHS = new Set(['/', '/login', '/landing', '/public-exam', '/public-rating']);
const NOTIFICATION_POLL_MS = 180_000;
const DELIVERED_NOTIFICATIONS_STORAGE_KEY_PREFIX =
  'mk-academy:device-notifications:delivered:v1:';
const PERMISSION_PROMPT_STORAGE_KEY_PREFIX =
  'mk-academy:device-notifications:permission-prompt:v1:';
const PERMISSION_PROMPT_SNOOZE_MS = 24 * 60 * 60 * 1000;

function getDeliveredNotificationsStorageKey(token: string | null) {
  const scope = token ? token.slice(-16) : 'guest';
  return `${DELIVERED_NOTIFICATIONS_STORAGE_KEY_PREFIX}${scope}`;
}

function getPermissionPromptStorageKey(token: string | null) {
  const scope = token ? token.slice(-16) : 'guest';
  return `${PERMISSION_PROMPT_STORAGE_KEY_PREFIX}${scope}`;
}

function loadDeliveredNotificationIds(storageKey: string): Set<number> {
  if (typeof window === 'undefined') {
    return new Set<number>();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set<number>();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<number>();

    return new Set(
      parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    );
  } catch {
    return new Set<number>();
  }
}

function persistDeliveredNotificationIds(storageKey: string, ids: Set<number>) {
  if (typeof window === 'undefined') {
    return;
  }

  const next = Array.from(ids).slice(-300);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

function loadPermissionPromptDismissed(storageKey: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return false;

    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;

    if (Date.now() - dismissedAt < PERMISSION_PROMPT_SNOOZE_MS) {
      return true;
    }

    window.localStorage.removeItem(storageKey);
    return false;
  } catch {
    return false;
  }
}

function persistPermissionPromptDismissed(storageKey: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, String(Date.now()));
}

function normalizeRoute(route: unknown) {
  if (typeof route !== 'string' || !route.trim()) {
    return null;
  }

  return route.startsWith('/') ? route : `/${route}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Notifications');
  const pathname = usePathname() || '/';
  const normalizedPath = stripLocaleFromPathname(pathname);
  const enabled = !authLoading && Boolean(token) && !PUBLIC_PATHS.has(normalizedPath);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<DeviceNotificationPermission>('prompt');
  const [permissionPromptDismissed, setPermissionPromptDismissed] =
    useState(false);
  const deliveredStorageKey = getDeliveredNotificationsStorageKey(token);
  const permissionPromptStorageKey = getPermissionPromptStorageKey(token);
  const hydratedRef = useRef(false);
  const deliveredIdsRef = useRef<Set<number>>(new Set<number>());
  const itemsRef = useRef<AppNotification[]>([]);

  const syncPermission = useCallback(async () => {
    const currentPermission = await getDeviceNotificationPermission();
    setPermission(currentPermission);
  }, []);

  const applyFeed = useCallback(
    (feed: { items: AppNotification[]; unreadCount: number }) => {
      setItems(feed.items || []);
      setUnreadCount(feed.unreadCount || 0);
    },
    [],
  );

  useEffect(() => {
    deliveredIdsRef.current = loadDeliveredNotificationIds(
      deliveredStorageKey,
    );
    hydratedRef.current = false;
  }, [deliveredStorageKey]);

  useEffect(() => {
    setPermissionPromptDismissed(
      loadPermissionPromptDismissed(permissionPromptStorageKey),
    );
  }, [permissionPromptStorageKey]);

  const rememberDeliveredNotification = useCallback(
    (id: number) => {
      deliveredIdsRef.current.add(id);
      persistDeliveredNotificationIds(
        deliveredStorageKey,
        deliveredIdsRef.current,
      );
    },
    [deliveredStorageKey],
  );

  const dismissPermissionPrompt = useCallback(() => {
    setPermissionPromptDismissed(true);
    persistPermissionPromptDismissed(permissionPromptStorageKey);
  }, [permissionPromptStorageKey]);

  const emitRuntimeNotifications = useCallback(
    async (nextItems: AppNotification[], options?: { showToast?: boolean }) => {
      const freshItems = nextItems.filter(
        (item) => !item.isRead && !deliveredIdsRef.current.has(item.id),
      );

      for (const item of freshItems) {
        rememberDeliveredNotification(item.id);

        const rawRoute = normalizeRoute(item.data?.route);
        const route = rawRoute ? localizePath(locale, rawRoute) : null;

        if (options?.showToast) {
          toast(item.title, {
            description: item.body,
            action: route
              ? {
                  label: t('open'),
                  onClick: () => {
                    router.push(route);
                  },
                }
              : undefined,
          });
        }

        void sendDeviceNotification({
          id: item.id,
          title: item.title,
          body: item.body,
          route: rawRoute ?? undefined,
        });
      }
    },
    [locale, rememberDeliveredNotification, router, t],
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      hydratedRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const feed = await getMyNotifications();
      const nextItems = feed?.items || [];
      applyFeed({
        items: nextItems,
        unreadCount: feed?.unreadCount || 0,
      });

      await emitRuntimeNotifications(nextItems, {
        showToast: hydratedRef.current,
      });
      hydratedRef.current = true;
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : t('fetchError'),
      );
    } finally {
      setLoading(false);
    }
  }, [applyFeed, emitRuntimeNotifications, enabled, t]);

  const markAsReadHandler = useCallback(async (id: number) => {
    await markNotificationAsRead(id);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const markAllHandler = useCallback(async () => {
    const feed = await markAllNotificationsAsRead();
    applyFeed(feed);
  }, [applyFeed]);

  const removeHandler = useCallback(
    async (id: number) => {
      await removeNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setUnreadCount((current) => {
        const removed = items.find((item) => item.id === id);
        return removed && !removed.isRead ? Math.max(0, current - 1) : current;
      });
    },
    [items],
  );

  const requestPermissionHandler = useCallback(async () => {
    const nextPermission = await requestDeviceNotificationPermission();
    setPermission(nextPermission);
    dismissPermissionPrompt();

    if (nextPermission === 'granted') {
      await emitRuntimeNotifications(itemsRef.current, { showToast: false });
      toast.success(t('enabledToast'));
      return;
    }

    if (nextPermission === 'denied') {
      toast.error(t('deniedToast'));
    }
  }, [dismissPermissionPrompt, emitRuntimeNotifications, t]);

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        await markAsReadHandler(notification.id);
      }

      const route =
        typeof notification.data?.route === 'string'
          ? localizePath(locale, notification.data.route)
          : null;

      if (route) {
        router.push(route);
      }
    },
    [locale, markAsReadHandler, router],
  );

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    void syncPermission();
  }, [syncPermission]);

  useEffect(() => {
    void initializeDeviceNotifications({
      onOpenNotification: ({ route }) => {
        const normalizedRoute = normalizeRoute(route);
        if (normalizedRoute) {
          router.push(localizePath(locale, normalizedRoute));
          return;
        }

        router.push(localizePath(locale, '/notifications'));
      },
    });
  }, [locale, router]);

  useEffect(() => {
    void refresh();

    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      void refresh();
    }, NOTIFICATION_POLL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      permission,
      refresh,
      markAsRead: markAsReadHandler,
      markAllAsRead: markAllHandler,
      removeItem: removeHandler,
      requestPermission: requestPermissionHandler,
      openNotification,
    }),
    [
      error,
      items,
      loading,
      markAllHandler,
      markAsReadHandler,
      openNotification,
      permission,
      refresh,
      removeHandler,
      requestPermissionHandler,
      unreadCount,
    ],
  );

  const showPermissionPrompt =
    enabled && permission === 'prompt' && !permissionPromptDismissed;

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationPermissionPrompt
        open={showPermissionPrompt}
        title={t('permissionTitle')}
        description={t('permissionDescription')}
        enableLabel={t('enable')}
        laterLabel={t('later')}
        onEnable={() => void requestPermissionHandler()}
        onLater={dismissPermissionPrompt}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
