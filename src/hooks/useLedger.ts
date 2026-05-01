"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  doc,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FreightRecord, PaymentRecord } from "@/types";
import { toast } from "sonner";

export function useLedger() {
  const [freights, setFreights] = useState<FreightRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Freights
    const freightsQuery = query(collection(db, "fretes"), orderBy("createdAt", "desc"));
    const unsubFreights = onSnapshot(freightsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FreightRecord));
      setFreights(data);
      checkLoading(true, false);
    }, (err) => {
      console.error(err);
      toast.error("Erro ao carregar fretes");
    });

    // Listen to Payments
    const paymentsQuery = query(collection(db, "pagamentos"), orderBy("createdAt", "desc"));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
      setPayments(data);
      checkLoading(false, true);
    }, (err) => {
      console.error(err);
      toast.error("Erro ao carregar pagamentos");
    });

    let fLoaded = false;
    let pLoaded = false;
    
    function checkLoading(fDone: boolean, pDone: boolean) {
      if (fDone) fLoaded = true;
      if (pDone) pLoaded = true;
      if (fLoaded && pLoaded) setLoading(false);
    }

    return () => {
      unsubFreights();
      unsubPayments();
    };
  }, []);

  const totalFreights = freights.filter(f => !f.canceled).reduce((acc, f) => acc + f.amount, 0);
  const totalPayments = payments.filter(p => !p.canceled).reduce((acc, p) => acc + p.amount, 0);
  const balance = totalFreights - totalPayments; // Positive means debt to Ana

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
      console.error("Error adding freight:", error);
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
      return true;
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Erro ao registrar pagamento.");
      return false;
    }
  };

  const cancelRecord = async (type: 'freight' | 'payment', id: string) => {
    try {
      const collectionName = type === 'freight' ? 'fretes' : 'pagamentos';
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, { canceled: true });
      toast.success("Registro cancelado com sucesso!");
    } catch (error) {
      console.error("Error canceling record:", error);
      toast.error("Erro ao cancelar o registro.");
    }
  };

  return { freights, payments, balance, loading, addFreight, addPayment, cancelRecord };
}
