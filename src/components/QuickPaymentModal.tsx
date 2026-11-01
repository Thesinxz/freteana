"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { cn, formatCurrency } from "@/lib/utils";
import { BankIcon } from "@/components/BrandLogos";

interface QuickPaymentModalProps {
  open: boolean;
  onClose: () => void;
}

const BANK_OPTIONS = [
  "Caixa Econômica",
  "Nubank",
  "Dinheiro",
  "Outro",
];

export function QuickPaymentModal({ open, onClose }: QuickPaymentModalProps) {
  const { balance, addPayment } = useLedger();
  const [amountStr, setAmountStr] = useState("");
  const [selectedBank, setSelectedBank] = useState("Caixa Econômica");
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAmount =
    amountStr === "" ? Math.max(0, balance) : parseInt(amountStr, 10) || 0;

  const isValid =
    effectiveAmount > 0 && (balance <= 0 || effectiveAmount <= balance);

  const getDisplayValue = () => {
    if (amountStr === "") {
      if (balance <= 0) return "";
      return formatCurrency(balance / 100).replace("R$", "").trim();
    }
    const parsed = parseInt(amountStr, 10);
    if (isNaN(parsed)) return "";
    return formatCurrency(parsed / 100).replace("R$", "").trim();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Informe um valor válido para dar baixa.");
      return;
    }

    setSubmitting(true);
    try {
      let dateMs = Date.now();
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (selectedDateStr && selectedDateStr !== todayStr) {
        const parsed = parseISO(selectedDateStr);
        parsed.setHours(12, 0, 0, 0);
        dateMs = parsed.getTime();
      }

      const ok = await addPayment(
        effectiveAmount,
        note.trim() || "Recebimento de frete",
        selectedBank,
        dateMs
      );

      if (ok) {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.75 },
          colors: ["#10B981", "#34D399", "#A7F3D0"],
        });
        setAmountStr("");
        setNote("");
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F291E]/25 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            className="relative z-10 w-full sm:max-w-md bg-white border border-[#DCE8E2] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
                  Dar Baixa na Caderneta
                </span>
                <h2 className="text-xl font-extrabold text-[#0F291E] mt-2">
                  Confirmar Recebimento
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#648274] hover:bg-[#F4F8F6] hover:text-[#0F291E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirm} className="space-y-4">
              {/* Valor */}
              <div className="rounded-2xl bg-[#F4F8F6] border border-[#DCE8E2] p-4">
                <div className="flex items-center justify-between text-xs text-[#526D60] mb-2">
                  <span className="font-semibold">Valor recebido agora</span>
                  <span>
                    Em aberto:{" "}
                    <strong className="text-[#047857]">
                      {formatCurrency(Math.max(0, balance) / 100)}
                    </strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-extrabold text-[#059669]">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={getDisplayValue()}
                    onChange={(e) =>
                      setAmountStr(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="0,00"
                    className="w-full bg-white border border-[#C6F0DC] rounded-xl py-3 pl-11 pr-4 text-2xl font-extrabold text-right text-[#064E3B] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {balance > 0 && (
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setAmountStr(String(balance))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE8E2] text-xs font-semibold text-[#047857] hover:border-[#10B981]"
                    >
                      Quitar tudo ({formatCurrency(balance / 100)})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAmountStr(String(Math.round(balance / 2)))
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE8E2] text-xs font-semibold text-[#526D60] hover:border-[#10B981]"
                    >
                      Metade (50%)
                    </button>
                  </div>
                )}

                {balance > 0 && effectiveAmount > balance && (
                  <p className="text-xs font-semibold text-rose-600 mt-2">
                    O valor digitado é maior que o saldo pendente atual.
                  </p>
                )}
              </div>

              {/* Conta */}
              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-2">
                  Onde caiu o pagamento?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BANK_OPTIONS.map((bank) => {
                    const active = selectedBank === bank;
                    return (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 transition-all",
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

              {/* Data + Observação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Data
                  </label>
                  <input
                    type="date"
                    value={selectedDateStr}
                    onChange={(e) => setSelectedDateStr(e.target.value)}
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
                    placeholder="Ex: PIX da semana"
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3 py-2.5 text-xs font-medium text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full h-12 bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>
                  {submitting
                    ? "Confirmando..."
                    : `Confirmar Pagamento (${formatCurrency(effectiveAmount / 100)})`}
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
