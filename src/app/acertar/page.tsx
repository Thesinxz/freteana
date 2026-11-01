"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";
import { cn, formatCurrency } from "@/lib/utils";
import { BankIcon } from "@/components/BrandLogos";

const BANKS = ["Caixa Econômica", "Nubank", "Dinheiro", "Outro"];

export default function AcertarPage() {
  const { balance, payments, addPayment, cancelRecord, loading } = useLedger();
  const router = useRouter();

  const [paymentAmountStr, setPaymentAmountStr] = useState("");
  const [selectedBank, setSelectedBank] = useState("Caixa Econômica");
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const activePayments = useMemo(
    () =>
      payments
        .filter((p) => !p.canceled)
        .sort((a, b) => b.createdAt - a.createdAt),
    [payments]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6]">
        <span className="animate-spin h-10 w-10 border-4 border-[#D1FAE5] border-t-[#059669] rounded-full" />
      </div>
    );
  }

  const getDisplayAmount = () => {
    if (paymentAmountStr === "") {
      if (balance <= 0) return "";
      return formatCurrency(balance / 100).replace("R$", "").trim();
    }
    const num = parseInt(paymentAmountStr, 10);
    if (isNaN(num)) return "";
    return formatCurrency(num / 100).replace("R$", "").trim();
  };

  const paymentNum =
    paymentAmountStr === ""
      ? Math.max(0, balance)
      : parseInt(paymentAmountStr, 10) || 0;

  const isPaymentValid =
    paymentNum > 0 && (balance <= 0 || paymentNum <= balance);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentValid) {
      toast.error("Informe um valor válido para registrar o pagamento.");
      return;
    }

    setIsSettling(true);
    let customDateMs = Date.now();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (selectedDateStr && selectedDateStr !== todayStr) {
      const parsed = parseISO(selectedDateStr);
      parsed.setHours(12, 0, 0, 0);
      customDateMs = parsed.getTime();
    }

    const success = await addPayment(
      paymentNum,
      note.trim() || "Acerto de conta corrente",
      selectedBank,
      customDateMs
    );

    if (success) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.12);
        }
      } catch {
        // Ignore audio errors
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#10B981", "#34D399", "#A7F3D0"],
      });

      setPaymentAmountStr("");
      setNote("");
      setIsSettling(false);

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } else {
      setIsSettling(false);
    }
  };

  return (
    <AppShell
      title="Receber Pagamento"
      subtitle="Registre pagamentos parciais ou totais na caderneta"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Recebimento */}
        <section className="lg:col-span-6 clean-card p-5 sm:p-6 space-y-5">
          <div className="emerald-hero-card p-5 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#047857]">
              Saldo Total em Aberto
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#064E3B] mt-1">
              {formatCurrency(balance / 100)}
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="rounded-2xl bg-[#F4F8F6] border border-[#DCE8E2] p-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#526D60] mb-2">
                <span>Valor pago agora</span>
                {balance > 0 && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmountStr(String(balance))}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#DCE8E2] text-[#047857] hover:border-[#10B981]"
                    >
                      Total
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmountStr(String(Math.round(balance / 2)))
                      }
                      className="px-2 py-0.5 rounded-md bg-white border border-[#DCE8E2] text-[#526D60] hover:border-[#10B981]"
                    >
                      50%
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-[#059669]">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={getDisplayAmount()}
                  onChange={(e) =>
                    setPaymentAmountStr(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0,00"
                  className="w-full bg-white border border-[#C6F0DC] rounded-xl py-3.5 pl-12 pr-4 text-3xl font-extrabold text-right text-[#064E3B] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {balance > 0 && paymentNum > balance && (
                <p className="text-xs font-bold text-rose-600 mt-2">
                  O valor informado ultrapassa o saldo pendente atual!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#526D60] mb-2">
                Conta de Recebimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map((bank) => {
                  const active = selectedBank === bank;
                  return (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={cn(
                        "px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition-all",
                        active
                          ? "bg-[#ECFDF5] border-[#10B981] text-[#047857]"
                          : "bg-white border-[#DCE8E2] text-[#526D60] hover:bg-[#F4F8F6]"
                      )}
                    >
                      <BankIcon bank={bank} className="w-7 h-7" />
                      <span className="truncate">{bank}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                  Data do Recebimento
                </label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: PIX referente à quinzena"
                  className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSettling || !isPaymentValid}
              className="w-full h-13 bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSettling ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    Confirmar Pagamento ({formatCurrency(paymentNum / 100)})
                  </span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Últimos Pagamentos Recebidos */}
        <section className="lg:col-span-6 clean-card p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-[#EEF5F1]">
            <h2 className="text-base font-extrabold text-[#0F291E]">
              Pagamentos Recebidos
            </h2>
            <p className="text-xs text-[#648274]">
              Histórico de baixas registradas
            </p>
          </div>

          {activePayments.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#648274]">
              Nenhum pagamento registrado ainda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePayments.slice(0, 15).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BankIcon bank={p.bank} className="w-10 h-10" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#14532D] truncate">
                        {p.bank || "Pagamento"}
                      </div>
                      <div className="text-xs text-[#166534]/80 truncate">
                        {format(new Date(p.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                        {p.note ? ` • ${p.note}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-[#15803D]">
                      {formatCurrency(p.amount / 100)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Deseja remover este pagamento de ${formatCurrency(p.amount / 100)}?`
                          )
                        ) {
                          void cancelRecord("payment", p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#648274] hover:text-rose-600 hover:bg-white/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
