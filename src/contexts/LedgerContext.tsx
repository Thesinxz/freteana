"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  ExpenseRecord,
  FreightRecord,
  PaymentRecord,
  PickupRecord,
  Transporter,
} from "@/types";
import { toast } from "sonner";
import {
  getDeviceId,
  notifyAllDevices,
  sendLocalNotification,
} from "@/lib/pwa-notifications";
import { formatCurrency } from "@/lib/utils";

export interface FreightBatchEntry {
  transportId: string;
  amount: number;
}

interface LedgerContextValue {
  freights: FreightRecord[];
  payments: PaymentRecord[];
  transporters: Transporter[];
  expenses: ExpenseRecord[];
  pickups: PickupRecord[];
  totalFreights: number;
  totalPayments: number;
  totalExpenses: number;
  balance: number;
  netProfit: number;
  loading: boolean;
  addFreight: (
    transportId: string,
    amount: number,
    customDateMs?: number
  ) => Promise<void>;
  addFreightsBatch: (
    entries: FreightBatchEntry[],
    customDateMs?: number
  ) => Promise<number>;
  addPayment: (
    amount: number,
    note?: string,
    bank?: string,
    dateMs?: number
  ) => Promise<boolean>;
  addExpense: (category: string, amount: number, note?: string) => Promise<void>;
  addPickup: (
    transportId: string,
    scheduledAt: number,
    note?: string
  ) => Promise<boolean>;
  togglePickupCompleted: (id: string, completed: boolean) => Promise<void>;
  manageTransporter: (
    transporter: Partial<Transporter> & { id?: string }
  ) => Promise<void>;
  cancelRecord: (
    type: "freight" | "payment" | "expense" | "pickup",
    id: string
  ) => Promise<void>;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [freights, setFreights] = useState<FreightRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [timedOut, setTimedOut] = useState(false);
  const [loadedFlags, setLoadedFlags] = useState({
    freights: false,
    payments: false,
    transporters: false,
    expenses: false,
  });

  const loading = !timedOut && !Object.values(loadedFlags).every(Boolean);

  const transportersRef = useRef<Transporter[]>([]);
  useEffect(() => {
    transportersRef.current = transporters;
  }, [transporters]);

  const mountedAtRef = useRef<number>(0);
  const seenFreightsRef = useRef<Set<string>>(new Set());
  const seenPaymentsRef = useRef<Set<string>>(new Set());
  const seenPickupsRef = useRef<Set<string>>(new Set());
  const initialSnapshotRef = useRef({
    freights: false,
    payments: false,
    pickups: false,
  });

  useEffect(() => {
    if (mountedAtRef.current === 0) {
      mountedAtRef.current = Date.now();
    }
    const myDeviceId = getDeviceId();

    const transportersQuery = query(
      collection(db, "transportadoras"),
      orderBy("name", "asc")
    );
    const unsubTransporters = onSnapshot(
      transportersQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Transporter
        );
        setTransporters(data);
        transportersRef.current = data;
        setLoadedFlags((prev) => ({ ...prev, transporters: true }));
      },
      (err) => {
        console.error("Firebase transporters error:", err);
        setLoadedFlags((prev) => ({ ...prev, transporters: true }));
      }
    );

    const freightsQuery = query(
      collection(db, "fretes"),
      orderBy("createdAt", "desc")
    );
    const unsubFreights = onSnapshot(
      freightsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as FreightRecord
        );
        setFreights(data);
        setLoadedFlags((prev) => ({ ...prev, freights: true }));

        if (!initialSnapshotRef.current.freights) {
          snapshot.docs.forEach((d) => seenFreightsRef.current.add(d.id));
          initialSnapshotRef.current.freights = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const docId = change.doc.id;
          if (seenFreightsRef.current.has(docId)) return;
          seenFreightsRef.current.add(docId);

          if (change.doc.metadata.hasPendingWrites) return;
          const raw = change.doc.data() as FreightRecord & {
            recordedAt?: number;
          };
          if (raw.canceled) return;
          if (raw.deviceId && raw.deviceId === myDeviceId) return;

          const eventTimestamp = raw.recordedAt || raw.createdAt || 0;
          if (eventTimestamp < mountedAtRef.current - 20000) return;

          const t = transportersRef.current.find(
            (item) => item.id === raw.transportId
          );
          const tName = t?.name || "Transportadora";
          const msg = `${tName}: ${formatCurrency(raw.amount / 100)} lançado na caderneta.`;

          toast.success("Novo Frete Lançado! 🚚", { description: msg });

          if (
            typeof document !== "undefined" &&
            document.visibilityState !== "visible"
          ) {
            sendLocalNotification(
              "Novo Frete Lançado! 🚚",
              msg,
              "/",
              `freight-${docId}`
            );
          }
        });
      },
      (err) => {
        console.error("Firebase freights error:", err);
        setLoadedFlags((prev) => ({ ...prev, freights: true }));
      }
    );

    const paymentsQuery = query(
      collection(db, "pagamentos"),
      orderBy("createdAt", "desc")
    );
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as PaymentRecord
        );
        setPayments(data);
        setLoadedFlags((prev) => ({ ...prev, payments: true }));

        if (!initialSnapshotRef.current.payments) {
          snapshot.docs.forEach((d) => seenPaymentsRef.current.add(d.id));
          initialSnapshotRef.current.payments = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const docId = change.doc.id;
          if (seenPaymentsRef.current.has(docId)) return;
          seenPaymentsRef.current.add(docId);

          if (change.doc.metadata.hasPendingWrites) return;
          const raw = change.doc.data() as PaymentRecord & {
            recordedAt?: number;
          };
          if (raw.canceled) return;
          if (raw.deviceId && raw.deviceId === myDeviceId) return;

          const eventTimestamp = raw.recordedAt || raw.createdAt || 0;
          if (eventTimestamp < mountedAtRef.current - 20000) return;

          const msg = `Pagamento de ${formatCurrency(raw.amount / 100)} confirmado${raw.bank ? ` (${raw.bank})` : ""}.`;
          toast.success("Pagamento Pago! 💰", { description: msg });

          if (
            typeof document !== "undefined" &&
            document.visibilityState !== "visible"
          ) {
            sendLocalNotification(
              "Pagamento Pago! 💰",
              msg,
              "/",
              `payment-${docId}`
            );
          }
        });
      },
      (err) => {
        console.error("Firebase payments error:", err);
        setLoadedFlags((prev) => ({ ...prev, payments: true }));
      }
    );

    const expensesQuery = query(
      collection(db, "despesas"),
      orderBy("createdAt", "desc")
    );
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ExpenseRecord
        );
        setExpenses(data);
        setLoadedFlags((prev) => ({ ...prev, expenses: true }));
      },
      (err) => {
        console.error("Firebase expenses error:", err);
        setLoadedFlags((prev) => ({ ...prev, expenses: true }));
      }
    );

    const pickupsQuery = query(
      collection(db, "coletas"),
      orderBy("scheduledAt", "asc")
    );
    const unsubPickups = onSnapshot(
      pickupsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as PickupRecord
        );
        setPickups(data);

        if (!initialSnapshotRef.current.pickups) {
          snapshot.docs.forEach((d) => seenPickupsRef.current.add(d.id));
          initialSnapshotRef.current.pickups = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const docId = change.doc.id;
          if (seenPickupsRef.current.has(docId)) return;
          seenPickupsRef.current.add(docId);

          if (change.doc.metadata.hasPendingWrites) return;
          const raw = change.doc.data() as PickupRecord;
          if (raw.canceled) return;
          if (raw.deviceId && raw.deviceId === myDeviceId) return;
          if ((raw.createdAt || 0) < mountedAtRef.current - 20000) return;

          const t = transportersRef.current.find(
            (item) => item.id === raw.transportId
          );
          const msg = `Coleta agendada para ${t?.name || "Transportadora"}.`;
          toast.success("Nova Coleta Agendada! 📅", { description: msg });
        });
      },
      (err) => {
        console.error("Firebase pickups error:", err);
      }
    );

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      unsubTransporters();
      unsubFreights();
      unsubPayments();
      unsubExpenses();
      unsubPickups();
    };
  }, []);

  const totals = useMemo(() => {
    const totalFreights = freights
      .filter((f) => !f.canceled)
      .reduce((acc, f) => acc + f.amount, 0);
    const totalPayments = payments
      .filter((p) => !p.canceled)
      .reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = expenses
      .filter((e) => !e.canceled)
      .reduce((acc, e) => acc + e.amount, 0);

    return {
      totalFreights,
      totalPayments,
      totalExpenses,
      balance: totalFreights - totalPayments,
      netProfit: totalFreights - totalExpenses,
    };
  }, [freights, payments, expenses]);

  const addFreight = async (
    transportId: string,
    amount: number,
    customDateMs?: number
  ) => {
    await addFreightsBatch([{ transportId, amount }], customDateMs);
  };

  const addFreightsBatch = async (
    entries: FreightBatchEntry[],
    customDateMs?: number
  ): Promise<number> => {
    const validEntries = entries.filter((e) => e.amount > 0);
    if (validEntries.length === 0) return 0;

    try {
      const now = Date.now();
      const targetDate = customDateMs || now;
      const deviceId = getDeviceId();
      const createdIds: string[] = [];

      for (const entry of validEntries) {
        const docRef = await addDoc(collection(db, "fretes"), {
          transportId: entry.transportId,
          amount: entry.amount,
          createdAt: targetDate,
          recordedAt: Date.now(),
          canceled: false,
          deviceId,
        });
        seenFreightsRef.current.add(docRef.id);
        createdIds.push(docRef.id);
      }

      if (validEntries.length === 1) {
        const single = validEntries[0];
        const transport = transporters.find((t) => t.id === single.transportId);
        const name = transport?.name || "Transportadora";
        const message = `${name}: ${formatCurrency(single.amount / 100)} adicionado na caderneta.`;

        toast.success("Novo Frete Lançado! 🚚", { description: message });

        void notifyAllDevices({
          title: "Novo Frete Lançado! 🚚",
          body: message,
          url: "/",
          tag: `freight-${createdIds[0]}`,
        });
      } else {
        const summaryParts = validEntries.map((e) => {
          const t = transporters.find((item) => item.id === e.transportId);
          return `${t?.name || "Frete"}: ${formatCurrency(e.amount / 100)}`;
        });
        const totalBatch = validEntries.reduce((acc, e) => acc + e.amount, 0);
        const message = `${summaryParts.join(" • ")} (Total: ${formatCurrency(totalBatch / 100)})`;

        toast.success(`${validEntries.length} Fretes Lançados! 🚚`, {
          description: message,
        });

        void notifyAllDevices({
          title: `${validEntries.length} Novos Fretes Lançados! 🚚`,
          body: message,
          url: "/",
          tag: `freight-batch-${createdIds[0]}`,
        });
      }

      return validEntries.length;
    } catch (error) {
      toast.error("Erro ao adicionar frete.");
      throw error;
    }
  };

  const addPayment = async (
    amount: number,
    note?: string,
    bank?: string,
    dateMs?: number
  ): Promise<boolean> => {
    try {
      const remainingAfter = Math.max(0, totals.balance - amount);
      const docRef = await addDoc(collection(db, "pagamentos"), {
        amount,
        createdAt: dateMs || Date.now(),
        recordedAt: Date.now(),
        note: note || "",
        bank: bank || "",
        canceled: false,
        deviceId: getDeviceId(),
      });
      seenPaymentsRef.current.add(docRef.id);

      const message = `Pagamento de ${formatCurrency(amount / 100)} pago${bank ? ` via ${bank}` : ""}. Saldo restante: ${formatCurrency(remainingAfter / 100)}.`;

      toast.success("Pagamento Pago! 💰", {
        description: message,
      });

      void notifyAllDevices({
        title: "Pagamento Pago! 💰",
        body: message,
        url: "/",
        tag: `payment-${docRef.id}`,
      });

      return true;
    } catch (error) {
      console.error("Failed to add payment:", error);
      toast.error("Erro ao registrar pagamento.");
      return false;
    }
  };

  const addExpense = async (category: string, amount: number, note?: string) => {
    try {
      const docRef = await addDoc(collection(db, "despesas"), {
        category,
        amount,
        note: note || "",
        createdAt: Date.now(),
        recordedAt: Date.now(),
        canceled: false,
        deviceId: getDeviceId(),
      });

      const message = `Despesa de ${formatCurrency(amount / 100)} em "${category}".`;
      toast.success("Despesa Registrada", { description: message });

      void notifyAllDevices({
        title: "Nova Despesa Registrada",
        body: message,
        url: "/admin",
        tag: `expense-${docRef.id}`,
      });
    } catch {
      toast.error("Erro ao registrar despesa.");
    }
  };

  const addPickup = async (
    transportId: string,
    scheduledAt: number,
    note?: string
  ): Promise<boolean> => {
    try {
      const docRef = await addDoc(collection(db, "coletas"), {
        transportId,
        scheduledAt,
        note: note || "",
        completed: false,
        canceled: false,
        createdAt: Date.now(),
        deviceId: getDeviceId(),
      });
      seenPickupsRef.current.add(docRef.id);

      const transport = transporters.find((t) => t.id === transportId);
      const name = transport?.name || "Transportadora";
      const formattedDate = new Date(scheduledAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const message = `${name} agendada para ${formattedDate}${note ? ` • ${note}` : ""}.`;

      toast.success("Coleta Agendada! 📅", { description: message });

      void notifyAllDevices({
        title: "Nova Coleta Agendada! 📅",
        body: message,
        url: "/agenda",
        tag: `pickup-${docRef.id}`,
      });

      return true;
    } catch {
      toast.error("Erro ao agendar coleta.");
      return false;
    }
  };

  const togglePickupCompleted = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, "coletas", id), { completed });
      toast.success(completed ? "Coleta marcada como concluída!" : "Coleta reaberta.");
    } catch {
      toast.error("Erro ao atualizar coleta.");
    }
  };

  const manageTransporter = async (
    transporter: Partial<Transporter> & { id?: string }
  ) => {
    try {
      if (transporter.id) {
        await setDoc(doc(db, "transportadoras", transporter.id), transporter, {
          merge: true,
        });
        toast.success("Transportadora atualizada!");
      } else {
        const newRef = doc(collection(db, "transportadoras"));
        await setDoc(newRef, {
          icon: "Truck",
          color: "bg-emerald-600",
          ...transporter,
          active: true,
        });
        toast.success("Transportadora adicionada!");
      }
    } catch {
      toast.error("Erro ao salvar transportadora.");
    }
  };

  const cancelRecord = async (
    type: "freight" | "payment" | "expense" | "pickup",
    id: string
  ) => {
    try {
      const map = {
        freight: "fretes",
        payment: "pagamentos",
        expense: "despesas",
        pickup: "coletas",
      } as const;
      await updateDoc(doc(db, map[type], id), { canceled: true });
      toast.success("Registro removido!");
    } catch {
      toast.error("Erro ao remover registro.");
    }
  };

  const value: LedgerContextValue = {
    freights,
    payments,
    transporters,
    expenses,
    pickups: pickups.filter((p) => !p.canceled),
    ...totals,
    loading,
    addFreight,
    addFreightsBatch,
    addPayment,
    addExpense,
    addPickup,
    togglePickupCompleted,
    manageTransporter,
    cancelRecord,
  };

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedgerContext(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) {
    throw new Error("useLedger must be used inside LedgerProvider");
  }
  return ctx;
}
