// PWA Notification helper for iOS 16.4+ / iOS 17+ and modern platforms

export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  return null;
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
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
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification('Notificações Ativas! 🔔', {
          body: 'Você receberá avisos quando novas anotações forem criadas na sua caderneta.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
          data: { url: '/' }
        } as any);
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
      if (registration) {
        registration.showNotification(title, {
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
      // Fallback to standard browser Notification API
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
        });
        return true;
      } catch (e) {
        console.error('Fallback notification failed too:', e);
      }
    }
  }
  return false;
}
