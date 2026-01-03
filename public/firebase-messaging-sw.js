// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBK1VZTkg9Zflhcs8KpBLBMqn2phNK6YTA",
  authDomain: "tech-esports.firebaseapp.com",
  databaseURL: "https://tech-esports-default-rtdb.firebaseio.com",
  projectId: "tech-esports",
  storageBucket: "tech-esports.firebasestorage.app",
  messagingSenderId: "645283066219",
  appId: "1:645283066219:web:aab2cf1f4b92032b435c2e",
  measurementId: "G-PC0GGGY9DY"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Default icon - will be overridden by the notification payload if provided
const DEFAULT_ICON = 'https://i.postimg.cc/Y9CH9XBQ/IMG-20251112-091800-841.jpg';
const DEFAULT_BADGE = 'https://i.postimg.cc/Y9CH9XBQ/IMG-20251112-091800-841.jpg';

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'TS HUB';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.data?.icon || DEFAULT_ICON,
    badge: payload.data?.badge || DEFAULT_BADGE,
    vibrate: [200, 100, 200],
    tag: 'ts-hub-notification',
    renotify: true,
    requireInteraction: false,
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});