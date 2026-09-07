/** Parse FCM payload from Firebase (web) into display fields. */
export interface FcmDisplayPayload {
  title: string;
  body: string;
  data: Record<string, string>;
  url: string;
}

export function parseFcmPayload(
  payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }
): FcmDisplayPayload {
  const data = (payload.data || {}) as Record<string, string>;
  const notification = payload.notification || {};

  const title =
    notification.title ||
    data.title ||
    (data.type === 'chat_request' ? 'New chat request' : undefined) ||
    (data.type === 'call_request' ? 'New call request' : undefined) ||
    'Ventally';

  const body = notification.body || data.body || data.message || '';

  return {
    title,
    body,
    data,
    url: getNotificationUrl(data),
  };
}

export function getNotificationUrl(data: Record<string, string>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (!data?.type) return `${origin}/`;

  const type = String(data.type);

  if (type === 'chat_request' || type === 'call_request') {
    return `${origin}/listener/requests`;
  }

  if (type === 'message' && data.conversationId) {
    return `${origin}/listener/chat`;
  }

  if (data.conversationId) {
    return `${origin}/venter/chat`;
  }

  return `${origin}/`;
}

export function showWebPushNotification(
  registration: ServiceWorkerRegistration,
  payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }
): Promise<void> {
  const { title, body, data, url } = parseFcmPayload(payload);

  return registration.showNotification(title, {
    body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: data.type ? `ventally-${data.type}` : 'ventally-notification',
    requireInteraction: data.type === 'chat_request' || data.type === 'call_request',
    data: { ...data, url, link: url },
  });
}
