import { Network, type ConnectionStatus } from '@capacitor/network';

export interface NetworkStatusSnapshot {
  isOnline: boolean;
  connectionType: ConnectionStatus['connectionType'];
}

type NetworkListener = (status: NetworkStatusSnapshot, previous: NetworkStatusSnapshot | null) => void;

let initialized = false;
let latestStatus: NetworkStatusSnapshot = {
  isOnline: true,
  connectionType: 'unknown',
};
const listeners = new Set<NetworkListener>();

function getBrowserStatus(): NetworkStatusSnapshot {
  if (typeof navigator === 'undefined') {
    return { isOnline: true, connectionType: 'unknown' };
  }

  return {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
  };
}

function notifyAll(nextStatus: NetworkStatusSnapshot) {
  const previous = latestStatus;
  latestStatus = nextStatus;
  listeners.forEach((listener) => listener(nextStatus, previous));
}

async function bootstrapNetworkWatcher(): Promise<void> {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  try {
    const current = await Network.getStatus();
    notifyAll({ isOnline: current.connected, connectionType: current.connectionType });

    await Network.addListener('networkStatusChange', (status) => {
      notifyAll({ isOnline: status.connected, connectionType: status.connectionType });
    });
  } catch {
    const updateFromBrowser = () => notifyAll(getBrowserStatus());
    window.addEventListener('online', updateFromBrowser);
    window.addEventListener('offline', updateFromBrowser);
    updateFromBrowser();
  }
}

export async function getCurrentNetworkStatus(): Promise<NetworkStatusSnapshot> {
  await bootstrapNetworkWatcher();

  try {
    const current = await Network.getStatus();
    const mapped = { isOnline: current.connected, connectionType: current.connectionType };
    latestStatus = mapped;
    return mapped;
  } catch {
    const fallback = getBrowserStatus();
    latestStatus = fallback;
    return fallback;
  }
}

export async function isNetworkOnline(): Promise<boolean> {
  const status = await getCurrentNetworkStatus();
  return status.isOnline;
}

export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  listeners.add(listener);
  void bootstrapNetworkWatcher();
  listener(latestStatus, null);

  return () => {
    listeners.delete(listener);
  };
}

