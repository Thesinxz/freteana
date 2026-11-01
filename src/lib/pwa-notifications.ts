import { PushNotificationPayload } from "@/types";

const DEVICE_ID_STORAGE_KEY = "freteana-device-id";
const DEVICE_NAME_STORAGE_KEY = "controle-frete-device-name";
const MUTE_OWN_PUSH_STORAGE_KEY = "controle-frete-mute-self";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (!existing) {
    existing =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, existing);
  }
  return existing;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(DEVICE_NAME_STORAGE_KEY) || "").trim();
}

export function setDeviceName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(DEVICE_NAME_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(DEVICE_NAME_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent("freteana:device-prefs-changed"));
  if (canUseNotifications() && Notification.permission === "granted") {
    void syncPushSubscription();
  }
}

export function getMuteOwnPush(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_OWN_PUSH_STORAGE_KEY) === "true";
}

export function setMuteOwnPush(mute: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_OWN_PUSH_STORAGE_KEY, mute ? "true" : "false");
  window.dispatchEvent(new CustomEvent("freteana:device-prefs-changed"));
}

export async function clearAppUnreadBadge(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const nav = navigator as Navigator & {
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "CLEAR_BADGE" });
    }
  } catch {
    // Ignore badge API errors on unsupported platforms
  }
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function getIOSVersion(): number {
  if (!isIOS()) return 0;
  const match = /CPU.*OS ([0-9_]{1,5})/i.exec(navigator.userAgent);
  if (!match) return 0;
  return parseFloat(match[1].replace(/_/g, "."));
}

export function canUseNotifications(): boolean {
  if (typeof window === "undefined") return false;

  if (isIOS()) {
    if (!isStandalone()) return false;
    const version = getIOSVersion();
    if (version > 0 && version < 16.4) return false;
  }

  return "Notification" in window && "serviceWorker" in navigator;
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function getNotificationPermissionState(): Promise<string> {
  if (!canUseNotifications()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Ensures the browser has a valid W3C PushSubscription synced to Firestore via /api/push.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!canUseNotifications() || Notification.permission !== "granted") {
    return false;
  }

  if (typeof window === "undefined" || !("PushManager" in window)) {
    return false;
  }

  try {
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    const keyResponse = await fetch("/api/push", { cache: "no-store" });
    if (!keyResponse.ok) return false;
    const { publicKey } = (await keyResponse.json()) as { publicKey?: string };
    if (!publicKey) return false;

    const expectedServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (subscription && subscription.options?.applicationServerKey) {
      const currentKey = new Uint8Array(
        subscription.options.applicationServerKey
      );
      if (!uint8ArraysEqual(currentKey, expectedServerKey)) {
        await subscription.unsubscribe().catch(() => {});
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: expectedServerKey,
      });
    }

    const serialized = JSON.parse(JSON.stringify(subscription));
    const subRes = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe",
        subscription: serialized,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        platform: isIOS() ? "iOS-PWA" : "Web/Android",
        userAgent: navigator.userAgent,
      }),
    });

    if (subRes.ok) {
      window.dispatchEvent(new CustomEvent("freteana:push-synced"));
      return true;
    }
  } catch (err) {
    console.warn("Push subscription sync warning:", err);
  }
  return false;
}

export async function requestNotificationPermission(): Promise<string> {
  if (!canUseNotifications()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const synced = await syncPushSubscription();

      if (synced) {
        await sendTestPushNotification();
      } else {
        await sendLocalNotification(
          "Notificações Ativas! 🔔",
          "Você receberá avisos sempre que um frete ou pagamento for lançado.",
          "/",
          `freteana-welcome-${Date.now()}`
        );
      }
    }

    window.dispatchEvent(new CustomEvent("freteana:permission-changed"));
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "default";
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  url: string = "/",
  tag?: string
): Promise<boolean> {
  if (!canUseNotifications() || Notification.permission !== "granted") {
    return false;
  }

  const notifTag = tag || `freteana-local-${Date.now()}`;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url },
        tag: notifTag,
      });
      return true;
    }
  } catch (error) {
    console.warn("Service Worker local notification fallback:", error);
    try {
      new Notification(title, { body, icon: "/icon-192.png", tag: notifTag });
      return true;
    } catch {
      // Ignore fallback error
    }
  }

  return false;
}

/**
 * Broadcasts a real server-dispatched Web Push notification to all subscribed devices.
 * Respects `getMuteOwnPush()` when the user chooses not to receive Push on the sender device.
 */
export async function notifyAllDevices(
  payload: PushNotificationPayload
): Promise<void> {
  const tag = payload.tag || `freteana-${Date.now()}`;
  const excludeSender = payload.excludeSender ?? getMuteOwnPush();

  try {
    if (canUseNotifications() && Notification.permission === "granted") {
      await syncPushSubscription().catch(() => {});
    }

    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "broadcast",
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        tag,
        senderDeviceId: getDeviceId(),
        excludeSender,
      }),
    });

    if (res.ok) {
      const stats = (await res.json()) as {
        sent?: number;
        skippedSender?: number;
      };
      if ((stats.sent ?? 0) > 0 || (excludeSender && (stats.skippedSender ?? 0) > 0)) {
        return;
      }
    }
  } catch (err) {
    console.warn("Push broadcast fallback to local notification:", err);
  }

  if (!excludeSender) {
    await sendLocalNotification(
      payload.title,
      payload.body,
      payload.url || "/",
      tag
    );
  }
}

export async function sendTestPushNotification(): Promise<boolean> {
  if (canUseNotifications() && Notification.permission === "granted") {
    await syncPushSubscription().catch(() => {});
  }

  try {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test",
        deviceName: getDeviceName(),
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { sent?: number };
      if ((data.sent ?? 0) > 0) return true;
    }
  } catch {
    // Fallback below
  }

  return sendLocalNotification(
    "Alertas Ativos • Controle de Frete 🔔",
    "Notificação local funcionando neste aparelho!",
    "/"
  );
}
