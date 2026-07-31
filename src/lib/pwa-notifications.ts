import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase/config';

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
    (navigator as any).standalone === true;
}

export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS() && isSafari;
}

function getIOSVersion(): number {
  if (!isIOS()) return 0;
  const match = /CPU.*OS ([0-9_]{1,5})/i.exec(navigator.userAgent);
  if (!match) return 0;
  return parseFloat(match[1].replace(/_/g, '.'));
}

export function canUseNotifications(): boolean {
  if (typeof window === 'undefined') return false;

  if (isIOS()) {
    // iOS: só funciona se estiver instalado (standalone) e iOS 16.4+
    if (!isStandalone()) return false;
    const version = getIOSVersion();
    if (version > 0 && version < 16.4) return false;
  }

  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function getNotificationPermissionState(): Promise<string> {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) {
    return 'unsupported';
  }

  try {
    // iOS exige chamada síncrona a partir de user gesture
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      // SÓ tenta FCM se NÃO for iOS (FCM não funciona em iOS PWA)
      if (!isIOS()) {
        try {
          const supported = await isMessagingSupported();
          if (supported) {
            const messaging = getMessaging(app);
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
            if (vapidKey) {
              const registration = await navigator.serviceWorker.ready;
              const token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
              });
              if (token) {
                console.log('FCM Web Push Device Token:', token);
                localStorage.setItem('fcm-push-token', token);
                try {
                  await setDoc(doc(db, 'fcm_tokens', token), {
                    token,
                    updatedAt: Date.now(),
                    platform: 'Web/Android',
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
                  }, { merge: true });
                } catch (dbErr) {
                  console.warn('Failed to save FCM token to Firestore:', dbErr);
                }
              }
            }
          }
        } catch (fcmErr) {
          console.warn('FCM VAPID token registration warning:', fcmErr);
        }
      }

      // Test notification local
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification('Notificações Ativas! 🔔', {
            body: 'Você receberá avisos quando novas anotações forem criadas na sua caderneta.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100],
            data: { url: '/' }
          } as any);
        }
      } catch (err) {
        console.warn('Failed to trigger test notification on permission grant:', err);
      }
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'default';
  }
}

export async function sendLocalNotification(title: string, body: string, url: string = '/') {
  if (!canUseNotifications()) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
          data: { url },
          tag: 'freteana-notif-' + Date.now(),
          renotify: true
        } as any);
        return true;
      }
    } catch (error) {
      console.error('Failed to send notification via Service Worker:', error);
      try {
        if (typeof Notification !== 'undefined') {
          new Notification(title, { body, icon: '/icon-192.png' });
          return true;
        }
      } catch (e) {
        console.error('Fallback notification failed too:', e);
      }
    }
  }
  return false;
}
