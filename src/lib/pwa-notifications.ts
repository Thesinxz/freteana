// PWA Notification helper for iOS 16.4+, iOS 17+, iOS 18+ and modern platforms

import { getMessaging, getToken, isSupported as isMessagingSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase/config';

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

export function isSecureOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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

export function isNotificationSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export async function getNotificationPermissionState() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    // Must be called synchronously from a user gesture event
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // FCM Push Token subscription using VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BOzu_h_uvtMQoYZIplMPwGn-3-bAWOBK_yFXBViCo-FiIFZtHjXLG7MQ2tzMq7kSXHcLupifK8h4_J-Y_h23agI";
        if (vapidKey && (await isMessagingSupported())) {
          try {
            const messaging = getMessaging(app);
            const token = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: registration
            });
            if (token) {
              console.log('FCM Web Push Device Token:', token);
              localStorage.setItem('fcm-push-token', token);
            }
          } catch (fcmErr) {
            console.warn('FCM VAPID token registration warning:', fcmErr);
          }
        }

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
  if (!isNotificationSupported()) {
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
      // Fallback to standard browser Notification API if allowed
      try {
        if (typeof Notification !== 'undefined') {
          new Notification(title, {
            body,
            icon: '/icon-192.png',
          });
          return true;
        }
      } catch (e) {
        console.error('Fallback notification failed too:', e);
      }
    }
  }
  return false;
}
