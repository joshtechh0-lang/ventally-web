/* Shared FCM payload helpers (loaded by firebase-messaging-sw.js via importScripts). */

function parseFcmPayload(payload) {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title =
    notification.title ||
    data.title ||
    (data.type === 'chat_request' ? 'New chat request' : null) ||
    (data.type === 'call_request' ? 'New call request' : null) ||
    'Ventally';

  const body =
    notification.body ||
    data.body ||
    data.message ||
    '';

  return { title, body, data };
}

function getNotificationUrl(data, origin) {
  if (!data || !data.type) return origin + '/';

  const type = String(data.type);

  if (type === 'chat_request' || type === 'call_request') {
    return origin + '/listener/requests';
  }

  if (type === 'message' && data.conversationId) {
    return origin + '/listener/chat';
  }

  if (data.conversationId) {
    return origin + '/venter/chat';
  }

  return origin + '/';
}
