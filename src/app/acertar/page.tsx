"use client";

import { useLedger } from "@/hooks/useLedger";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AcertarPage() {
  const { balance, addPayment, loading } = useLedger();
  const router = useRouter();
  const [isSettling, setIsSettling] = useState(false);
  
  // They can pay partial or full amount.
  const [paymentAmountStr, setPaymentAmountStr] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full" />
      </div>
    );
  }

  // Auto-fill full balance if empty for convenience, but they can edit.
  const getDisplayAmount = () => {
    if (paymentAmountStr === "") return formatCurrency(balance / 100).replace('R$', '').trim();
    const num = parseInt(paymentAmountStr, 10);
    if (isNaN(num)) return "";
    return formatCurrency(num / 100).replace('R$', '').trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    setPaymentAmountStr(value);
  };

  const getPaymentNum = () => {
    if (!paymentAmountStr) return balance;
    return parseInt(paymentAmountStr, 10);
  };

  const paymentNum = getPaymentNum();
  const isPaymentValid = paymentNum > 0 && paymentNum <= balance;

  const handleConfirm = async () => {
    if (!isPaymentValid) {
      toast.error("Valor inválido");
      return;
    }

    setIsSettling(true);
    const success = await addPayment(paymentNum, "Acerto de conta corrente");
    
    if (success) {
      // Play a simple beep sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        // Ignore audio errors
      }

      // Fire confetti
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      toast.success("Pagamento registrado com sucesso!");
      
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } else {
      setIsSettling(false);
    }
  };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-safe pb-safe">
      <header className="p-6 flex items-center mb-2 relative z-10">
        <button 
          onClick={() => router.back()}
          className="p-3 -ml-2 rounded-full bg-white/50 backdrop-blur-md hover:bg-white/80 active:bg-white shadow-sm transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-2xl font-black ml-4 text-slate-800 tracking-tight">Receber Pagamento</h1>
      </header>

      <main className="flex-1 px-4 flex flex-col relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          
          <div className="text-center mb-8 relative z-10">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Saldo Total a Receber</span>
            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tighter">{formatCurrency(balance / 100)}</p>
          </div>

          <div className="bg-slate-50/80 backdrop-blur-sm rounded-[1.5rem] p-8 flex flex-col items-center border border-slate-200/60 shadow-inner relative z-10">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Valor Pago Agora</span>
            
            <div className="relative w-full max-w-[240px]">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-3xl">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={getDisplayAmount()}
                onChange={handleInputChange}
                className="w-full bg-transparent py-2 pl-14 pr-2 text-5xl font-black text-emerald-600 focus:outline-none border-b-2 border-emerald-200 focus:border-emerald-500 transition-all text-center placeholder-emerald-200"
                placeholder="0,00"
              />
            </div>
            {!isPaymentValid && paymentNum > 0 && (
              <p className="text-rose-500 text-sm mt-6 font-bold bg-rose-50 px-4 py-2 rounded-full">
                Valor excede a dívida!
              </p>
            )}
          </div>
        </motion.div>

        <div className="mt-auto pb-6 space-y-4">
          <p className="text-center text-slate-500 text-sm mb-6 font-medium">
            Será abatido <strong className="text-slate-700">{formatCurrency(paymentNum / 100)}</strong> do saldo total.
          </p>
          <button
            onClick={handleConfirm}
            disabled={isSettling || !isPaymentValid}
            className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[1.25rem] font-bold text-xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 border border-emerald-400/50"
          >
            {isSettling ? (
              <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 mr-3" />
                Confirmar Pagamento
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            disabled={isSettling}
            className="w-full h-16 bg-white text-slate-700 rounded-[1.25rem] font-bold text-lg shadow-sm border border-slate-200 active:scale-[0.98] hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </main>
    </div>
  );
}
