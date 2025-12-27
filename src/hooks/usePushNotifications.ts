import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { ref, set, serverTimestamp } from 'firebase/database';
import app, { realtimeDb } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VAPID_KEY = 'BBDP_czFf4h09bgLieTEniI1scI6cplpjiOHIpkowb4AOfoq6jnBFTYVJ3BKBqXMng9mRo08OdcnaYLvjQQkznQ';

interface UsePushNotificationsReturn {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Check if messaging is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isSupported();
      if (!supported) {
        setPermission('unsupported');
        console.log('Push notifications not supported in this browser');
      } else if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    checkSupport();
  }, []);

  // Save token to Realtime Database
  const saveTokenToDatabase = useCallback(async (fcmToken: string) => {
    if (!user) return;
    
    try {
      const tokenRef = ref(realtimeDb, `tokens/${user.uid}`);
      await set(tokenRef, {
        token: fcmToken,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      });
      console.log('FCM token saved to database');
    } catch (error) {
      console.error('Error saving token to database:', error);
    }
  }, [user]);

  // Setup foreground message handler
  useEffect(() => {
    const setupForegroundHandler = async () => {
      const supported = await isSupported();
      if (!supported) return;

      try {
        const messaging = getMessaging(app);
        
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          
          const title = payload.notification?.title || 'New Notification';
          const body = payload.notification?.body || '';
          
          // Show toast for foreground notifications
          toast(title, {
            description: body,
            duration: 5000,
          });

          // Also show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/favicon.ico',
            });
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up foreground handler:', error);
      }
    };

    setupForegroundHandler();
  }, []);

  // Request permission and get token
  const requestPermission = useCallback(async () => {
    const supported = await isSupported();
    if (!supported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    setIsLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Request notification permission
      const notificationPermission = await Notification.requestPermission();
      setPermission(notificationPermission);

      if (notificationPermission !== 'granted') {
        toast.error('Notification permission denied');
        setIsLoading(false);
        return;
      }

      // Get FCM token
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        setToken(fcmToken);
        await saveTokenToDatabase(fcmToken);
        toast.success('Notifications enabled successfully!');
      } else {
        toast.error('Failed to get notification token');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  }, [saveTokenToDatabase]);

  // Auto-request token if already granted and user is logged in
  useEffect(() => {
    const autoGetToken = async () => {
      if (permission === 'granted' && user && !token) {
        const supported = await isSupported();
        if (!supported) return;

        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          const messaging = getMessaging(app);
          const fcmToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (fcmToken) {
            setToken(fcmToken);
            await saveTokenToDatabase(fcmToken);
          }
        } catch (error) {
          console.error('Error auto-getting token:', error);
        }
      }
    };

    autoGetToken();
  }, [permission, user, token, saveTokenToDatabase]);

  return {
    permission,
    token,
    isLoading,
    requestPermission,
  };
}
