import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const AUTH_CHANGE_EVENT = 'mk-auth-change';

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getStoredAuthSnapshot() {
  if (!hasLocalStorage()) {
    return {
      token: null,
      role: null,
      canResolveSynchronously: false,
    };
  }

  return {
    token: getLocalValue(TOKEN_KEY),
    role: getLocalValue(ROLE_KEY),
    canResolveSynchronously: true,
  };
}

function getLocalValue(key: string): string | null {
  if (!hasLocalStorage()) return null;
  return localStorage.getItem(key);
}

function setLocalValue(key: string, value: string) {
  if (!hasLocalStorage()) return;
  localStorage.setItem(key, value);
}

function removeLocalValue(key: string) {
  if (!hasLocalStorage()) return;
  localStorage.removeItem(key);
}

function emitAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

async function getPreferenceValue(key: string): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  } catch {
    return null;
  }
}

async function setPreferenceValue(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value });
  } catch {
    // Ignore plugin errors and keep localStorage copy.
  }
}

async function removePreferenceValue(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch {
    // Ignore plugin errors and keep cleanup flow moving.
  }
}

export async function getStoredToken(): Promise<string | null> {
  const localToken = getLocalValue(TOKEN_KEY);
  if (localToken) return localToken;

  const preferenceToken = await getPreferenceValue(TOKEN_KEY);
  if (preferenceToken) {
    setLocalValue(TOKEN_KEY, preferenceToken);
  }

  return preferenceToken;
}

export async function getStoredRole(): Promise<string | null> {
  const localRole = getLocalValue(ROLE_KEY);
  if (localRole) return localRole;

  const preferenceRole = await getPreferenceValue(ROLE_KEY);
  if (preferenceRole) {
    setLocalValue(ROLE_KEY, preferenceRole);
  }

  return preferenceRole;
}

export async function setStoredAuth(token: string, role?: string | null): Promise<void> {
  setLocalValue(TOKEN_KEY, token);
  await setPreferenceValue(TOKEN_KEY, token);

  if (role) {
    setLocalValue(ROLE_KEY, role);
    await setPreferenceValue(ROLE_KEY, role);
    emitAuthChange();
    return;
  }

  removeLocalValue(ROLE_KEY);
  await removePreferenceValue(ROLE_KEY);
  emitAuthChange();
}

export async function setStoredRole(role: string): Promise<void> {
  setLocalValue(ROLE_KEY, role);
  await setPreferenceValue(ROLE_KEY, role);
  emitAuthChange();
}

export async function clearStoredAuth(): Promise<void> {
  removeLocalValue(TOKEN_KEY);
  removeLocalValue(ROLE_KEY);
  await removePreferenceValue(TOKEN_KEY);
  await removePreferenceValue(ROLE_KEY);
  emitAuthChange();
}

export function subscribeAuthChange(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => callback();

  window.addEventListener(AUTH_CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
