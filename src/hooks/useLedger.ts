"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  doc,
  updateDoc,
  orderBy,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FreightRecord, PaymentRecord, Transporter, ExpenseRecord } from "@/types";
import { toast } from "sonner";

export function useLedger() {
  const [freights, setFreights] = useState<FreightRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedFlags, setLoadedFlags] = useState({ freights: false, payments: false, transporters: false, expenses: false });

  useEffect(() => {
    // Listen to Transporters
    const transportersQuery = query(collection(db, "transportadoras"), orderBy("name", "asc"));
    const unsubTransporters = onSnapshot(transportersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transporter));
      setTransporters(data);
      setLoadedFlags(prev => ({ ...prev, transporters: true }));
    });

    // Listen to Freights
    const freightsQuery = query(collection(db, "fretes"), orderBy("createdAt", "desc"));
    const unsubFreights = onSnapshot(freightsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreightRecord));
      setFreights(data);
      setLoadedFlags(prev => ({ ...prev, freights: true }));
    });

    // Listen to Payments
    const paymentsQuery = query(collection(db, "pagamentos"), orderBy("createdAt", "desc"));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
      setPayments(data);
      setLoadedFlags(prev => ({ ...prev, payments: true }));
    });

    // Listen to Expenses
    const expensesQuery = query(collection(db, "despesas"), orderBy("createdAt", "desc"));
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseRecord));
      setExpenses(data);
      setLoadedFlags(prev => ({ ...prev, expenses: true }));
    });

    return () => {
      unsubTransporters();
      unsubFreights();
      unsubPayments();
      unsubExpenses();
    };
  }, []);

  useEffect(() => {
    if (Object.values(loadedFlags).every(v => v)) {
      setLoading(false);
    }
  }, [loadedFlags]);


  const totalFreights = freights.filter(f => !f.canceled).reduce((acc, f) => acc + f.amount, 0);
  const totalPayments = payments.filter(p => !p.canceled).reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.filter(e => !e.canceled).reduce((acc, e) => acc + e.amount, 0);
  
  const balance = totalFreights - totalPayments; // Saldo a receber das transportadoras
  const netProfit = totalFreights - totalExpenses; // Lucro real (Fretes - Despesas)

  const addFreight = async (transportId: string, amount: number, customDateMs?: number) => {
    try {
      await addDoc(collection(db, "fretes"), {
        transportId,
        amount,
        createdAt: customDateMs || Date.now(),
        canceled: false
      });
      toast.success("Frete adicionado com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar frete.");
      throw error;
    }
  };

  const addPayment = async (amount: number, note?: string) => {
    try {
      await addDoc(collection(db, "pagamentos"), {
        amount,
        createdAt: Date.now(),
        note: note || "",
        canceled: false
      });
      toast.success("Pagamento registrado!");
    } catch (error) {
      toast.error("Erro ao registrar pagamento.");
    }
  };

  const addExpense = async (category: string, amount: number, note?: string) => {
    try {
      await addDoc(collection(db, "despesas"), {
        category,
        amount,
        note: note || "",
        createdAt: Date.now(),
        canceled: false
      });
      toast.success("Despesa registrada!");
    } catch (error) {
      toast.error("Erro ao registrar despesa.");
    }
  };

  const manageTransporter = async (transporter: Partial<Transporter> & { id?: string }) => {
    try {
      if (transporter.id) {
        await setDoc(doc(db, "transportadoras", transporter.id), transporter, { merge: true });
        toast.success("Transportadora atualizada!");
      } else {
        const newRef = doc(collection(db, "transportadoras"));
        await setDoc(newRef, { ...transporter, active: true });
        toast.success("Transportadora adicionada!");
      }
    } catch (error) {
      toast.error("Erro ao salvar transportadora.");
    }
  };

  const cancelRecord = async (type: 'freight' | 'payment' | 'expense', id: string) => {
    try {
      const map = { freight: 'fretes', payment: 'pagamentos', expense: 'despesas' };
      const collectionName = map[type];
      await updateDoc(doc(db, collectionName, id), { canceled: true });
      toast.success("Cancelado!");
    } catch (error) {
      toast.error("Erro ao cancelar.");
    }
  };

  return { 
    freights, 
    payments, 
    transporters, 
    expenses,
    balance, 
    netProfit,
    loading, 
    addFreight, 
    addPayment, 
    addExpense,
    manageTransporter,
    cancelRecord 
  };
}

