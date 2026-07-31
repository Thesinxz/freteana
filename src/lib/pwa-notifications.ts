// PWA Notification helper for iOS 16.4+, iOS 17+, iOS 18+ and modern platforms

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

export function getIOSVersion(): number {
  if (typeof window === 'undefined' || !isIOS()) return 0;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }
  return 16.4; // Default safe assumption for modern iOS
}

export function canUseNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  
  // iOS requirement: PWA must be installed to Home Screen (standalone) & iOS 16.4+
  if (isIOS()) {
    if (!isStandalone()) return false;
    if (getIOSVersion() < 16.4) return false;
  }
  
  return 'Notification' in window && 'serviceWorker' in navigator;
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
  return canUseNotifications();
}

export async function getNotificationPermissionState() {
  if (!canUseNotifications()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) {
    return 'unsupported';
  }

  try {
    // Must be called synchronously from a user gesture event
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // FCM Push Token subscription using VAPID key (Supported on iOS 16.4+ PWA & Web/Android)
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
              try {
                await setDoc(doc(db, 'fcm_tokens', token), {
                  token,
                  updatedAt: Date.now(),
                  platform: isIOS() ? 'iOS' : 'Web/Android',
                  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
                }, { merge: true });
              } catch (dbErr) {
                console.warn('Failed to save FCM token to Firestore:', dbErr);
              }
            }
          } catch (fcmErr) {
            console.warn('FCM VAPID token registration warning:', fcmErr);
          }
        }

        if (registration && registration.showNotification) {
          await registration.showNotification('Notificações Ativas! 🔔', {
            body: 'Você receberá avisos em tempo real sobre fretes e lançamentos.',
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
