import { NextRequest, NextResponse } from "next/server";
import {
  broadcastPushNotification,
  getOrCreateVapidKeys,
  isValidPushSubscription,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { publicKey } = await getOrCreateVapidKeys();
    return NextResponse.json({ publicKey });
  } catch (error: unknown) {
    console.error("Failed to retrieve VAPID public key:", error);
    return NextResponse.json(
      { error: "Falha ao carregar chave de notificações." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "subscribe") {
      if (!isValidPushSubscription(body.subscription)) {
        return NextResponse.json(
          { error: "Inscrição Push inválida." },
          { status: 400 }
        );
      }

      const id = await savePushSubscription({
        subscription: body.subscription,
        deviceId: body.deviceId,
        deviceName: body.deviceName,
        platform: body.platform,
        userAgent: body.userAgent,
      });

      return NextResponse.json({ success: true, id });
    }

    if (action === "unsubscribe") {
      if (typeof body.endpoint === "string" && body.endpoint.length > 0) {
        await removePushSubscription(body.endpoint);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "test") {
      const senderLabel =
        typeof body.deviceName === "string" && body.deviceName.trim()
          ? ` (disparado por ${body.deviceName.trim()})`
          : "";
      const stats = await broadcastPushNotification({
        title: "Alertas Ativos • Controle de Frete 🔔",
        body: `Perfeito! Os avisos de fretes, baixas e estornos estão conectados em tempo real${senderLabel}.`,
        url: "/",
        tag: `controle-frete-test-${Date.now()}`,
      });
      return NextResponse.json({ success: true, ...stats });
    }

    if (action === "broadcast") {
      const title =
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : "Nova Movimentação • Controle de Frete";
      const message =
        typeof body.body === "string" && body.body.trim()
          ? body.body.trim()
          : "Um novo lançamento foi salvo na caderneta.";

      const stats = await broadcastPushNotification({
        title,
        body: message,
        url: typeof body.url === "string" ? body.url : "/",
        tag: typeof body.tag === "string" ? body.tag : undefined,
        senderDeviceId:
          typeof body.senderDeviceId === "string"
            ? body.senderDeviceId
            : undefined,
        excludeSender: Boolean(body.excludeSender),
      });

      return NextResponse.json({ success: true, ...stats });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Push API route error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar notificação." },
      { status: 500 }
    );
  }
}
