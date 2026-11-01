"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  CheckCircle2,
  DollarSign,
  Share2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  netProfit: number;
  totalFreights: number;
  totalPayments: number;
  monthReceived: number;
  onOpenPayment: () => void;
  onShareUnpaid: () => void;
}

export function BalanceCard({
  balance,
  netProfit,
  totalFreights,
  totalPayments,
  monthReceived,
  onOpenPayment,
  onShareUnpaid,
}: BalanceCardProps) {
  const [viewMode, setViewMode] = useState<"balance" | "profit">("balance");

  const paidPercent =
    totalFreights > 0
      ? Math.min(100, Math.max(0, Math.round((totalPayments / totalFreights) * 100)))
      : 100;

  return (
    <section className="clean-card p-5 sm:p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card Principal do Saldo em Verde Esmeralda Suave (Zero Preto!) */}
        <div
          onClick={() =>
            setViewMode((prev) => (prev === "balance" ? "profit" : "balance"))
          }
          className="lg:col-span-7 cursor-pointer rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#059669] via-[#0D9488] to-[#10B981] text-white shadow-[0_12px_32px_rgba(5,150,105,0.22)] relative overflow-hidden flex flex-col justify-between transition-transform active:scale-[0.99]"
        >
          {/* Brilho sutil */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/15 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                <span>
                  {viewMode === "balance"
                    ? "SALDO A RECEBER"
                    : "LUCRO LÍQUIDO"}
                </span>
                <ArrowLeftRight className="w-3 h-3 ml-1 opacity-85" />
              </div>

              <motion.p
                key={viewMode === "balance" ? `b-${balance}` : `p-${netProfit}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3"
              >
                {formatCurrency(
                  (viewMode === "balance" ? balance : netProfit) / 100
                )}
              </motion.p>
              <p className="text-xs text-emerald-50/90 mt-1 font-medium">
                Toque no cartão para alternar entre Saldo a Receber e Lucro Líquido
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center shrink-0">
              {viewMode === "balance" ? (
                <DollarSign className="w-6 h-6 text-white" />
              ) : (
                <TrendingUp className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {/* Barra de Quitação dentro do Card do Saldo */}
          <div className="mt-5 pt-4 border-t border-white/20 relative z-10">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-50 mb-1.5">
              <span>Quitação geral dos fretes</span>
              <span>{paidPercent}% recebido</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                style={{ width: `${paidPercent}%` }}
                className="h-full rounded-full bg-white transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Coluna lateral do Card do Saldo: Resumo + Ações Rápidas */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3.5 bg-[#F4F8F6] border border-[#DCE8E2]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#648274]">
                <Wallet className="w-3.5 h-3.5 text-[#059669]" />
                <span>Recebido (Mês)</span>
              </div>
              <p className="text-lg font-extrabold text-[#047857] mt-1">
                {formatCurrency(monthReceived / 100)}
              </p>
            </div>

            <div className="rounded-2xl p-3.5 bg-[#ECFDF5]/70 border border-[#C6F0DC]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#047857]">
                <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
                <span>Lucro Líquido</span>
              </div>
              <p className="text-lg font-extrabold text-[#064E3B] mt-1">
                {formatCurrency(netProfit / 100)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenPayment}
              className={cn(
                "h-12 px-4 rounded-2xl bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
              )}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Dar Baixa</span>
            </button>

            <button
              type="button"
              onClick={onShareUnpaid}
              className="h-12 px-4 rounded-2xl bg-[#ECFDF5] hover:bg-[#D1FAE5] active:scale-[0.98] text-[#047857] border border-[#A7F3D0] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Enviar Pendentes</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
