'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

type ScreenSecurityPlugin = {
  enableSecure(): Promise<void>;
  disableSecure(): Promise<void>;
};

const ScreenSecurity = registerPlugin<ScreenSecurityPlugin>('ScreenSecurity');

function isAndroidNativeApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function enableSecureScreen() {
  if (!isAndroidNativeApp()) {
    return false;
  }

  try {
    await ScreenSecurity.enableSecure();
    return true;
  } catch (error) {
    console.warn('Unable to enable Android secure screen mode.', error);
    return false;
  }
}

export async function disableSecureScreen() {
  if (!isAndroidNativeApp()) {
    return false;
  }

  try {
    await ScreenSecurity.disableSecure();
    return true;
  } catch (error) {
    console.warn('Unable to disable Android secure screen mode.', error);
    return false;
  }
}
