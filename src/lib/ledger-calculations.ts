import { startOfMonth } from "date-fns";
import { FreightRecord, PaymentRecord, Transporter } from "@/types";

export interface UnpaidFreightItem {
  id: string;
  transportId: string;
  transportName: string;
  createdAt: number;
  originalAmount: number;
  remainingAmount: number;
  note?: string;
}

export interface TransporterPendingItem {
  transporter: Transporter;
  pendingAmount: number;
  openCount: number;
  monthTotal: number;
}

export interface PendingSummary {
  unpaidFreights: UnpaidFreightItem[];
  byTransporter: TransporterPendingItem[];
  totalPending: number;
}

/**
 * Calcula os fretes em aberto e o saldo pendente individual por transportadora.
 * 1) Primeiro abate pagamentos vinculados diretamente a uma transportadora (FIFO dentro dela).
 * 2) Qualquer sobra ou pagamento geral (sem transportId) é abatido em ordem cronológica (FIFO global).
 */
export function computePendingSummary(
  freights: FreightRecord[],
  payments: PaymentRecord[],
  transporters: Transporter[]
): PendingSummary {
  const activeFreights = [...freights]
    .filter((f) => !f.canceled && f.amount > 0)
    .sort((a, b) => a.createdAt - b.createdAt);

  const activePayments = [...payments]
    .filter((p) => !p.canceled && p.amount > 0)
    .sort((a, b) => a.createdAt - b.createdAt);

  const buckets = activeFreights.map((f) => {
    const t = transporters.find((item) => item.id === f.transportId);
    return {
      id: f.id,
      transportId: f.transportId,
      transportName: t?.name || "Transportadora",
      createdAt: f.createdAt,
      originalAmount: f.amount,
      remainingAmount: f.amount,
      note: f.note,
    };
  });

  let generalPool = 0;

  // Passo 1: Abater pagamentos direcionados a uma transportadora específica
  for (const payment of activePayments) {
    if (payment.transportId) {
      let toApply = payment.amount;
      for (const bucket of buckets) {
        if (bucket.transportId !== payment.transportId || bucket.remainingAmount <= 0) {
          continue;
        }
        const deduction = Math.min(bucket.remainingAmount, toApply);
        bucket.remainingAmount -= deduction;
        toApply -= deduction;
        if (toApply <= 0) break;
      }
      // Se pagou além do saldo daquela transportadora, abate do saldo geral
      if (toApply > 0) {
        generalPool += toApply;
      }
    } else {
      generalPool += payment.amount;
    }
  }

  // Passo 2: Abater pool geral de pagamentos em ordem cronológica (FIFO)
  if (generalPool > 0) {
    for (const bucket of buckets) {
      if (bucket.remainingAmount <= 0) continue;
      const deduction = Math.min(bucket.remainingAmount, generalPool);
      bucket.remainingAmount -= deduction;
      generalPool -= deduction;
      if (generalPool <= 0) break;
    }
  }

  const unpaidFreights = buckets.filter((b) => b.remainingAmount > 0);
  const monthStart = startOfMonth(new Date()).getTime();

  const activeTransporterList = transporters.filter((t) => t.active);
  const byTransporter: TransporterPendingItem[] = activeTransporterList.map((t) => {
    const openForTransporter = unpaidFreights.filter((u) => u.transportId === t.id);
    const pendingAmount = openForTransporter.reduce(
      (sum, item) => sum + item.remainingAmount,
      0
    );
    const monthTotal = activeFreights
      .filter((f) => f.transportId === t.id && f.createdAt >= monthStart)
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      transporter: t,
      pendingAmount,
      openCount: openForTransporter.length,
      monthTotal,
    };
  });

  const totalPending = unpaidFreights.reduce(
    (sum, item) => sum + item.remainingAmount,
    0
  );

  return {
    unpaidFreights,
    byTransporter,
    totalPending,
  };
}
