"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { BankIcon } from "@/components/BrandLogos";
import { cn, formatCurrency } from "@/lib/utils";

export type EditableRecordTarget =
  | {
      type: "freight";
      id: string;
      transportId: string;
      amount: number;
      createdAt: number;
      note?: string;
    }
  | {
      type: "payment";
      id: string;
      amount: number;
      bank?: string;
      transportId?: string;
      createdAt: number;
      note?: string;
    };

interface EditRecordModalProps {
  target: EditableRecordTarget | null;
  onClose: () => void;
}

const BANK_OPTIONS = ["Caixa Econômica", "Nubank", "Dinheiro", "Outro"];

function EditRecordForm({
  target,
  onClose,
}: {
  target: EditableRecordTarget;
  onClose: () => void;
}) {
  const { transporters, updateFreight, updatePayment } = useLedger();
  const activeTransporters = transporters.filter((t) => t.active);

  const [amountStr, setAmountStr] = useState(() => String(target.amount));
  const [transportId, setTransportId] = useState(() =>
    target.type === "freight" ? target.transportId : target.transportId || ""
  );
  const [bank, setBank] = useState(() =>
    target.type === "payment" ? target.bank || "Caixa Econômica" : "Caixa Econômica"
  );
  const [dateStr, setDateStr] = useState(() =>
    format(new Date(target.createdAt), "yyyy-MM-dd")
  );
  const [note, setNote] = useState(() => target.note || "");
  const [saving, setSaving] = useState(false);

  const parsedAmount = parseInt(amountStr, 10) || 0;

  const getDisplayAmount = () => {
    if (!parsedAmount) return "";
    return formatCurrency(parsedAmount / 100).replace("R$", "").trim();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    try {
      const originalDayStr = format(new Date(target.createdAt), "yyyy-MM-dd");
      let finalCreatedAt = target.createdAt;
      if (dateStr && dateStr !== originalDayStr) {
        const parsed = parseISO(dateStr);
        parsed.setHours(12, 0, 0, 0);
        finalCreatedAt = parsed.getTime();
      }

      if (target.type === "freight") {
        const ok = await updateFreight(target.id, {
          transportId,
          amount: parsedAmount,
          createdAt: finalCreatedAt,
          note: note.trim(),
        });
        if (ok) onClose();
      } else {
        const ok = await updatePayment(target.id, {
          amount: parsedAmount,
          bank,
          transportId: transportId || undefined,
          createdAt: finalCreatedAt,
          note: note.trim(),
        });
        if (ok) onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 36, scale: 0.98 }}
      className="relative z-10 w-full sm:max-w-md bg-white border border-[#DCE8E2] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
            <Pencil className="w-3 h-3" />
            Editar Lançamento
          </span>
          <h2 className="text-xl font-extrabold text-[#0F291E] mt-1.5">
            {target.type === "freight" ? "Ajustar Frete" : "Ajustar Recebimento"}
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

      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-2xl bg-[#F4F8F6] border border-[#DCE8E2] p-4">
          <label className="block text-xs font-bold text-[#526D60] mb-2">
            Valor
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-extrabold text-[#059669]">
              R$
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={getDisplayAmount()}
              onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
              placeholder="0,00"
              className="w-full bg-white border border-[#C6F0DC] rounded-xl py-3 pl-11 pr-4 text-2xl font-extrabold text-right text-[#064E3B] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {target.type === "freight" ? (
          <div>
            <label className="block text-xs font-bold text-[#526D60] mb-1.5">
              Transportadora
            </label>
            <select
              value={transportId}
              onChange={(e) => setTransportId(e.target.value)}
              className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {activeTransporters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-[#526D60] mb-2">
                Conta de Recebimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BANK_OPTIONS.map((b) => {
                  const active = bank === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBank(b)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all",
                        active
                          ? "bg-[#ECFDF5] border-[#10B981] text-[#047857]"
                          : "bg-white border-[#DCE8E2] text-[#526D60] hover:bg-[#F4F8F6]"
                      )}
                    >
                      <BankIcon bank={b} className="w-6 h-6" />
                      <span className="truncate">{b}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                Transportadora vinculada (opcional)
              </label>
              <select
                value={transportId}
                onChange={(e) => setTransportId(e.target.value)}
                className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="">Automático (Mais antigos)</option>
                {activeTransporters.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#526D60] mb-1.5">
              Data
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#526D60] mb-1.5">
              Observação
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
              className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3 py-2.5 text-xs font-medium text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || parsedAmount <= 0}
          className="w-full h-12 bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
        </button>
      </form>
    </motion.div>
  );
}

export function EditRecordModal({ target, onClose }: EditRecordModalProps) {
  return (
    <AnimatePresence>
      {target && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F291E]/25 backdrop-blur-xs"
          />
          <EditRecordForm
            key={`${target.type}-${target.id}`}
            target={target}
            onClose={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
