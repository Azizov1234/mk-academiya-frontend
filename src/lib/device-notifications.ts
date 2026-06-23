'use client';

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type DeviceNotificationPermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported';

type DeviceNotificationOpenPayload = {
  id?: number;
  route?: string;
};

const NOTIFICATION_CHANNEL_ID = 'mk-academy-alerts';

let notificationChannelReady = false;
let notificationListenersReady = false;
let openNotificationHandler:
  | ((payload: DeviceNotificationOpenPayload) => void)
  | null = null;

function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function normalizeBrowserPermission(
  permission: NotificationPermission,
): DeviceNotificationPermission {
  if (permission === 'granted') return 'granted';
  if (permission === 'denied') return 'denied';
  return 'prompt';
}

function normalizeRoute(route?: string | null) {
  if (!route) return undefined;
  return route.startsWith('/') ? route : `/${route}`;
}

async function ensureNativeNotificationChannel() {
  if (!isNativePlatform() || notificationChannelReady) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'MK Academy Alerts',
      description: 'MK Academy reminders and updates',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#2563eb',
    });
  } catch {
    // Channel may already exist or the platform may manage defaults itself.
  } finally {
    notificationChannelReady = true;
  }
}

export async function initializeDeviceNotifications(options?: {
  onOpenNotification?: (payload: DeviceNotificationOpenPayload) => void;
}) {
  openNotificationHandler = options?.onOpenNotification ?? null;

  if (!isNativePlatform() || notificationListenersReady) {
    return;
  }

  await ensureNativeNotificationChannel();

  try {
    await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const route = normalizeRoute(
          typeof event.notification.extra?.route === 'string'
            ? event.notification.extra.route
            : undefined,
        );

        openNotificationHandler?.({
          id: event.notification.id,
          route,
        });
      },
    );
    notificationListenersReady = true;
  } catch {
    // If the listener cannot be registered, local notifications can still be shown.
  }
}

export async function getDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  if (isNativePlatform()) {
    try {
      await ensureNativeNotificationChannel();
      const permissions = await LocalNotifications.checkPermissions();
      if (permissions.display === 'granted') return 'granted';
      if (permissions.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return normalizeBrowserPermission(Notification.permission);
}

export async function requestDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  if (isNativePlatform()) {
    try {
      await ensureNativeNotificationChannel();
      const permissions = await LocalNotifications.requestPermissions();
      if (permissions.display === 'granted') return 'granted';
      if (permissions.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  return normalizeBrowserPermission(permission);
}

export async function sendDeviceNotification(input: {
  id: number;
  title: string;
  body: string;
  route?: string;
}) {
  const permission = await getDeviceNotificationPermission();

  if (permission !== 'granted') {
    return false;
  }

  if (isNativePlatform()) {
    await ensureNativeNotificationChannel();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: input.id,
          title: input.title,
          body: input.body,
          largeBody: input.body,
          summaryText: input.title,
          channelId: NOTIFICATION_CHANNEL_ID,
          group: NOTIFICATION_CHANNEL_ID,
          autoCancel: true,
          extra: {
            route: normalizeRoute(input.route),
          },
          schedule: {
            at: new Date(Date.now() + 250),
          },
        },
      ],
    });

    return true;
  }

  const normalizedRoute = normalizeRoute(input.route);

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration?.showNotification) {
          await registration.showNotification(input.title, {
            body: input.body,
            tag: `mk-academy-${input.id}`,
            data: {
              id: input.id,
              route: normalizedRoute,
            },
            icon: '/icon-192.png',
            badge: '/icon-192.png',
          });

          return true;
        }
      } catch {
        // Fall back to the regular Notification API.
      }
    }

    const notification = new Notification(input.title, {
      body: input.body,
      tag: `mk-academy-${input.id}`,
      data: {
        id: input.id,
        route: normalizedRoute,
      },
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      openNotificationHandler?.({
        id: input.id,
        route: normalizedRoute,
      });
    };

    return true;
  }

  return false;
}
