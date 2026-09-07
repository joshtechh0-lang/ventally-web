import { useCallback, useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '../firebaseConfig';
import apiInstance, { getAccessToken } from '../apiInstance';
import { parseFcmPayload, showWebPushNotification } from '../../utils/fcmPayload';

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BAJN9xfivYMOiCN2uRrX50iS2lOwaa8YoFkeM1wS4nD8CE1O8fxzgunfpcSf1bxC7PDyVAXQxgSoNHOvdlb1Q9U';

const APP_VERSION = '1.0.0';
const FCM_TOKEN_KEY = 'fcmToken';
const DEVICE_ID_KEY = 'deviceId';

let foregroundListenerAttached = false;
let setupPromise: Promise<string | null> | null = null;
let fcmServiceWorkerRegistration: ServiceWorkerRegistration | null = null;
let swMessageListenerAttached = false;

const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'web-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const getWebDeviceInfo = () => {
  const ua = navigator.userAgent;
  let os_version = 'Web';
  let model = 'Browser';

  if (/android/i.test(ua)) {
    os_version = 'Android Web';
    model = 'Android Browser';
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os_version = 'iOS Web';
    model = 'Safari iOS';
  } else if (/Mac OS X/.test(ua)) {
    os_version = 'Mac Web';
    model = 'Safari macOS';
  } else if (/Windows NT/.test(ua)) {
    os_version = 'Windows Web';
    model = 'Windows Browser';
  }

  return {
    model,
    os_version,
    app_version: APP_VERSION,
    device_id: getDeviceId(),
  };
};

export const getFcmServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  if (fcmServiceWorkerRegistration?.active) {
    return fcmServiceWorkerRegistration;
  }

  console.log('[FCM] Registering firebase-messaging-sw.js...');
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  if (registration.installing) {
    await new Promise<void>((resolve) => {
      registration.installing!.addEventListener('statechange', function onStateChange() {
        if (this.state === 'activated') {
          resolve();
        }
      });
    });
  } else if (registration.waiting && !registration.active) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    await new Promise<void>((resolve) => {
      registration.addEventListener('updatefound', () => resolve(), { once: true });
      setTimeout(resolve, 2000);
    });
  }

  fcmServiceWorkerRegistration = registration;
  console.log('[FCM] Service worker ready:', registration.scope);
  return registration;
};

const attachServiceWorkerMessageListener = () => {
  if (swMessageListenerAttached || !('serviceWorker' in navigator)) return;
  swMessageListenerAttached = true;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'FCM_NOTIFICATION_CLICK') return;
    const url = event.data?.data?.url || event.data?.data?.link;
    if (url && typeof window !== 'undefined') {
      const path = url.replace(window.location.origin, '');
      window.location.href = path.startsWith('/') ? path : `/${path}`;
    }
  });
};

const registerTokenWithBackend = async (token: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.warn('[FCM] Skipping backend registration — user not authenticated');
    return;
  }

  const deviceInfo = getWebDeviceInfo();
  const payload = {
    token,
    device_type: 'web' as const,
    device_info: deviceInfo,
  };

  console.log('[FCM] Registering token with API:', payload);
  const res = await apiInstance.post('notifications/register', payload);
  console.log('[FCM] Backend registration response:', res?.data ?? res);
};

export const fetchFcmToken = async (): Promise<string | null> => {
  const messaging = getMessagingInstance();
  if (!messaging) {
    console.warn('[FCM] Messaging unavailable (requires HTTPS or localhost)');
    return null;
  }

  if (!VAPID_KEY) {
    console.error('[FCM] VAPID_KEY missing — set VITE_FIREBASE_VAPID_KEY in .env');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[FCM] Cannot get token — notification permission:', Notification.permission);
    return null;
  }

  const registration = await getFcmServiceWorkerRegistration();

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    console.error('[FCM] No token returned from Firebase');
    return null;
  }

  localStorage.setItem(FCM_TOKEN_KEY, token);
  console.log('[FCM] Firebase token:', token);

  try {
    await registerTokenWithBackend(token);
    console.log('[FCM] Token registered with backend');
  } catch (err) {
    console.error('[FCM] Backend registration failed:', err);
  }

  return token;
};

const setupNotifications = async (): Promise<string | null> => {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      const token = await fetchFcmToken();
      attachForegroundListener();
      return token;
    } finally {
      setupPromise = null;
    }
  })();

  return setupPromise;
};

const displayForegroundNotification = async (
  payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }
) => {
  const parsed = parseFcmPayload(payload);
  console.log('[FCM] Showing foreground notification:', parsed);

  try {
    const registration = await getFcmServiceWorkerRegistration();
    await showWebPushNotification(registration, payload);
    return;
  } catch (err) {
    console.warn('[FCM] SW showNotification failed, trying Notification API:', err);
  }

  if (Notification.permission === 'granted') {
    const n = new Notification(parsed.title, {
      body: parsed.body,
      icon: '/logo-192.png',
      tag: parsed.data.type ? `ventally-${parsed.data.type}` : 'ventally-notification',
      data: { ...parsed.data, url: parsed.url, link: parsed.url },
    });
    n.onclick = () => {
      window.focus();
      window.location.href = parsed.url.replace(window.location.origin, '') || '/';
      n.close();
    };
  }
};

const attachForegroundListener = () => {
  const messaging = getMessagingInstance();
  if (!messaging || foregroundListenerAttached) return;

  foregroundListenerAttached = true;
  attachServiceWorkerMessageListener();

  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    void displayForegroundNotification(payload);
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Not supported in this browser');
    return false;
  }

  let permission = Notification.permission;

  if (permission === 'default') {
    permission = await Notification.requestPermission();
    console.log('[Notifications] Permission result:', permission);
  }

  if (permission === 'granted') {
    await setupNotifications();
    return true;
  }

  console.warn('[Notifications] Permission denied or blocked:', permission);
  return false;
};

export const useWebNotifications = (options?: { autoRequest?: boolean }) => {
  const autoRequest = options?.autoRequest ?? true;
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [fcmToken, setFcmToken] = useState<string | null>(() => localStorage.getItem(FCM_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);

  const refreshPermissionState = useCallback(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      refreshPermissionState();
      if (granted) {
        const token = localStorage.getItem(FCM_TOKEN_KEY);
        setFcmToken(token);
      }
      return granted;
    } finally {
      setIsLoading(false);
    }
  }, [refreshPermissionState]);

  useEffect(() => {
    const init = async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('[Notifications] Browser does not support push notifications');
        return;
      }

      if (!getMessagingInstance()) {
        console.warn('[Notifications] Firebase messaging unavailable (use HTTPS or localhost)');
        return;
      }

      refreshPermissionState();
      const current = Notification.permission;

      if (current === 'granted') {
        const token = await setupNotifications();
        if (token) setFcmToken(token);
        return;
      }

      if (current === 'default' && autoRequest) {
        console.log('[Notifications] Requesting permission...');
        await requestPermission();
      }
    };

    init();
  }, [autoRequest, requestPermission, refreshPermissionState]);

  return {
    permission,
    fcmToken,
    isLoading,
    requestPermission,
    refreshToken: async () => {
      const token = await setupNotifications();
      if (token) setFcmToken(token);
      return token;
    },
  };
};

export default useWebNotifications;
