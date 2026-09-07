/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('/fcm-notification-utils.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDn0F3nAFjEgJPHgf11nshfUB6CNlZS744',
  authDomain: 'ventally.firebaseapp.com',
  projectId: 'ventally',
  storageBucket: 'ventally.firebasestorage.app',
  messagingSenderId: '881570925381',
  appId: '1:881570925381:web:ef0e83c98432d40706cc2c',
  measurementId: 'G-3VKVBRLZR9',
});

const messaging = firebase.messaging();

function showPushNotification(payload) {
  const { title, body, data } = parseFcmPayload(payload);
  const origin = self.location.origin;
  const url = getNotificationUrl(data, origin);

  const options = {
    body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    tag: data.type ? `ventally-${data.type}` : 'ventally-notification',
    requireInteraction: data.type === 'chat_request' || data.type === 'call_request',
    data: { ...data, url, link: url },
  };

  return self.registration.showNotification(title, options);
}

messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message:', payload);
  return showPushNotification(payload);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || data.link || self.location.origin + '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'FCM_NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
