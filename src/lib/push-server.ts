import crypto from "crypto";
import webpush, { PushSubscription as WebPushSubscription } from "web-push";
import { PushNotificationPayload } from "@/types";

interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
  subject: string;
}

let cachedVapidKeys: VapidKeyPair | null = null;

function getFirestoreRestBase(): string {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fretebela";
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function getApiKeyParam(): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return apiKey ? `key=${encodeURIComponent(apiKey)}` : "";
}

function buildRestUrl(path: string, extraQuery?: string): string {
  const base = `${getFirestoreRestBase()}/${path}`;
  const params = [getApiKeyParam(), extraQuery].filter(Boolean).join("&");
  return params ? `${base}?${params}` : base;
}

export function subscriptionEndpointToId(endpoint: string): string {
  return crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

export function isValidPushSubscription(
  sub: unknown
): sub is WebPushSubscription {
  if (!sub || typeof sub !== "object") return false;
  const candidate = sub as Record<string, unknown>;
  if (
    typeof candidate.endpoint !== "string" ||
    !candidate.endpoint.startsWith("https://")
  ) {
    return false;
  }
  const keys = candidate.keys as Record<string, unknown> | undefined;
  return Boolean(
    keys &&
      typeof keys.p256dh === "string" &&
      keys.p256dh.length > 0 &&
      typeof keys.auth === "string" &&
      keys.auth.length > 0
  );
}

export async function getOrCreateVapidKeys(): Promise<VapidKeyPair> {
  if (cachedVapidKeys) {
    return cachedVapidKeys;
  }

  const subject =
    process.env.VAPID_SUBJECT || "mailto:contato@lojinhadocelular.com";

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    cachedVapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY.trim(),
      privateKey: process.env.VAPID_PRIVATE_KEY.trim(),
      subject,
    };
    return cachedVapidKeys;
  }

  const getRes = await fetch(buildRestUrl("push_config/vapid"), {
    cache: "no-store",
  });

  if (getRes.ok) {
    const docJson = (await getRes.json()) as {
      fields?: {
        publicKey?: { stringValue?: string };
        privateKey?: { stringValue?: string };
      };
    };
    const pub = docJson.fields?.publicKey?.stringValue;
    const priv = docJson.fields?.privateKey?.stringValue;
    if (pub && priv && pub.length > 20 && priv.length > 20) {
      cachedVapidKeys = { publicKey: pub, privateKey: priv, subject };
      return cachedVapidKeys;
    }
  } else if (getRes.status !== 404) {
    const errText = await getRes.text().catch(() => "");
    throw new Error(
      `Firestore VAPID lookup failed (${getRes.status}): ${errText}`
    );
  }

  const generated = webpush.generateVAPIDKeys();
  const saveRes = await fetch(buildRestUrl("push_config/vapid"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        publicKey: { stringValue: generated.publicKey },
        privateKey: { stringValue: generated.privateKey },
        createdAt: { integerValue: String(Date.now()) },
      },
    }),
  });

  if (!saveRes.ok) {
    const errText = await saveRes.text().catch(() => "");
    throw new Error(
      `Failed to persist VAPID keys (${saveRes.status}): ${errText}`
    );
  }

  cachedVapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject,
  };
  return cachedVapidKeys;
}

export async function savePushSubscription(params: {
  subscription: WebPushSubscription;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  userAgent?: string;
}): Promise<string> {
  const id = subscriptionEndpointToId(params.subscription.endpoint);
  const res = await fetch(buildRestUrl(`push_subscriptions/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        endpoint: { stringValue: params.subscription.endpoint },
        p256dh: { stringValue: params.subscription.keys.p256dh },
        auth: { stringValue: params.subscription.keys.auth },
        deviceId: { stringValue: params.deviceId || "" },
        deviceName: { stringValue: params.deviceName || "" },
        platform: { stringValue: params.platform || "web" },
        userAgent: { stringValue: params.userAgent || "" },
        updatedAt: { integerValue: String(Date.now()) },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Failed to save push subscription (${res.status}): ${errText}`);
  }

  return id;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const id = subscriptionEndpointToId(endpoint);
  await fetch(buildRestUrl(`push_subscriptions/${id}`), {
    method: "DELETE",
  });
}

async function deleteSubscriptionByDocId(id: string): Promise<void> {
  await fetch(buildRestUrl(`push_subscriptions/${id}`), {
    method: "DELETE",
  }).catch(() => {});
}

interface FirestoreSubDocument {
  name: string;
  fields?: {
    endpoint?: { stringValue?: string };
    p256dh?: { stringValue?: string };
    auth?: { stringValue?: string };
    deviceId?: { stringValue?: string };
    deviceName?: { stringValue?: string };
    keys?: {
      mapValue?: {
        fields?: {
          p256dh?: { stringValue?: string };
          auth?: { stringValue?: string };
        };
      };
    };
  };
}

export async function broadcastPushNotification(
  payload: PushNotificationPayload
): Promise<{
  sent: number;
  failed: number;
  cleaned: number;
  skippedSender: number;
  total: number;
}> {
  const vapid = await getOrCreateVapidKeys();
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const listRes = await fetch(
    buildRestUrl("push_subscriptions", "pageSize=200"),
    { cache: "no-store" }
  );

  if (!listRes.ok) {
    if (listRes.status === 404) {
      return { sent: 0, failed: 0, cleaned: 0, skippedSender: 0, total: 0 };
    }
    const errText = await listRes.text().catch(() => "");
    throw new Error(
      `Failed to list push subscriptions (${listRes.status}): ${errText}`
    );
  }

  const listJson = (await listRes.json()) as {
    documents?: FirestoreSubDocument[];
  };
  const docs = listJson.documents || [];
  if (docs.length === 0) {
    return { sent: 0, failed: 0, cleaned: 0, skippedSender: 0, total: 0 };
  }

  const messageString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    tag: payload.tag || `freteana-${Date.now()}`,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    renotify: false,
    timestamp: Date.now(),
  });

  let sent = 0;
  let failed = 0;
  let cleaned = 0;
  let skippedSender = 0;

  await Promise.all(
    docs.map(async (docItem) => {
      const docId = docItem.name.split("/").pop() || "";
      const subDeviceId = docItem.fields?.deviceId?.stringValue || "";

      if (
        payload.excludeSender &&
        payload.senderDeviceId &&
        subDeviceId &&
        subDeviceId === payload.senderDeviceId
      ) {
        skippedSender++;
        return;
      }

      const endpoint = docItem.fields?.endpoint?.stringValue || "";
      const p256dh =
        docItem.fields?.p256dh?.stringValue ||
        docItem.fields?.keys?.mapValue?.fields?.p256dh?.stringValue ||
        "";
      const auth =
        docItem.fields?.auth?.stringValue ||
        docItem.fields?.keys?.mapValue?.fields?.auth?.stringValue ||
        "";

      const sub = { endpoint, keys: { p256dh, auth } };

      if (!isValidPushSubscription(sub)) {
        if (docId) await deleteSubscriptionByDocId(docId);
        cleaned++;
        return;
      }

      try {
        await webpush.sendNotification(sub, messageString, {
          TTL: 86400,
          urgency: "high",
        });
        sent++;
      } catch (err: unknown) {
        failed++;
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;

        if (
          statusCode === 404 ||
          statusCode === 410 ||
          statusCode === 401 ||
          statusCode === 403
        ) {
          if (docId) await deleteSubscriptionByDocId(docId);
          cleaned++;
        } else {
          console.warn("Web Push delivery warning:", statusCode);
        }
      }
    })
  );

  return { sent, failed, cleaned, skippedSender, total: docs.length };
}
