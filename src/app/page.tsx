"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Plus,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";
import { BalanceCard } from "@/components/BalanceCard";
import { BankIcon } from "@/components/BrandLogos";
import { TransportCard } from "@/components/TransportCard";
import { PixCards } from "@/components/PixCards";
import { SwipeableItem } from "@/components/SwipeableItem";
import { QuickPaymentModal } from "@/components/QuickPaymentModal";
import { cn, formatCurrency } from "@/lib/utils";
import {
  resolveTransporterIcon,
  resolveTransporterPalette,
} from "@/lib/transporter-styles";

type HistoryFilter = "all" | "freight" | "payment";

export default function DashboardPage() {
  const {
    freights,
    payments,
    totalFreights,
    totalPayments,
    balance,
    netProfit,
    transporters,
    loading,
    addFreightsBatch,
    cancelRecord,
  } = useLedger();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const activeTransporters = useMemo(
    () => transporters.filter((t) => t.active),
    [transporters]
  );

  const monthReceived = useMemo(() => {
    const monthStart = startOfMonth(new Date()).getTime();
    return payments
      .filter((p) => !p.canceled && p.createdAt >= monthStart)
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const draftEntries = useMemo(() => {
    return activeTransporters
      .map((t) => ({
        transportId: t.id,
        amount: parseInt(drafts[t.id] || "0", 10) || 0,
      }))
      .filter((item) => item.amount > 0);
  }, [activeTransporters, drafts]);

  const draftTotal = useMemo(
    () => draftEntries.reduce((acc, e) => acc + e.amount, 0),
    [draftEntries]
  );

  const handleDraftChange = (id: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveAll = async () => {
    if (draftEntries.length === 0) return;
    setIsSaving(true);

    let customMs = Date.now();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (selectedDateStr && selectedDateStr !== todayStr) {
      const parsed = parseISO(selectedDateStr);
      parsed.setHours(12, 0, 0, 0);
      customMs = parsed.getTime();
    }

    try {
      const savedCount = await addFreightsBatch(draftEntries, customMs);
      if (savedCount > 0) {
        setDrafts({});
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#10B981", "#34D399", "#A7F3D0"],
        });
      }
    } catch {
      // Handled inside addFreightsBatch
    } finally {
      setIsSaving(false);
    }
  };

  type TimelineItem = {
    id: string;
    amount: number;
    createdAt: number;
    type: "freight" | "payment";
    transportId?: string;
    bank?: string;
    note?: string;
  };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const fItems: TimelineItem[] = freights
      .filter((f) => !f.canceled)
      .map((f) => ({ ...f, type: "freight" }));
    const pItems: TimelineItem[] = payments
      .filter((p) => !p.canceled)
      .map((p) => ({ ...p, type: "payment" }));

    return [...fItems, ...pItems]
      .filter((item) =>
        historyFilter === "all" ? true : item.type === historyFilter
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [freights, payments, historyFilter]);

  const groupedTimeline = useMemo(() => {
    return timelineItems.reduce(
      (acc, item) => {
        const dateStr = format(new Date(item.createdAt), "yyyy-MM-dd");
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(item);
        return acc;
      },
      {} as Record<string, TimelineItem[]>
    );
  }, [timelineItems]);

  const sortedDates = useMemo(
    () => Object.keys(groupedTimeline).sort((a, b) => b.localeCompare(a)),
    [groupedTimeline]
  );

  const handleShareDay = (dateStr: string, dayItems: TimelineItem[]) => {
    const dayFreights = dayItems.filter((i) => i.type === "freight");
    const dayPayments = dayItems.filter((i) => i.type === "payment");
    const dateFormatted = format(parseISO(dateStr), "dd/MM/yyyy");
    let message = `*Resumo do Dia — ${dateFormatted}*\n\n`;

    let totalDay = 0;
    dayFreights.forEach((f) => {
      const t = transporters.find((trans) => trans.id === f.transportId);
      message += `• ${t?.name || "Transportadora"}: ${formatCurrency(f.amount / 100)}\n`;
      totalDay += f.amount;
    });

    dayPayments.forEach((p) => {
      message += `• Pagamento (${p.bank || "Recebido"}): -${formatCurrency(p.amount / 100)}\n`;
      totalDay -= p.amount;
    });

    message += `\n*Saldo do dia: ${formatCurrency(totalDay / 100)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleShareAll = () => {
    let message = `*Resumo Geral — Controle de Frete*\n\n`;
    let grandTotal = 0;

    sortedDates.forEach((dateStr) => {
      const dayItems = groupedTimeline[dateStr];
      const dayFreights = dayItems.filter((i) => i.type === "freight");
      const dayPayments = dayItems.filter((i) => i.type === "payment");
      if (dayFreights.length === 0 && dayPayments.length === 0) return;

      const dateFormatted = format(parseISO(dateStr), "dd/MM/yyyy");
      message += `*--- ${dateFormatted} ---*\n`;
      let totalDay = 0;

      dayFreights.forEach((f) => {
        const t = transporters.find((trans) => trans.id === f.transportId);
        message += `• ${t?.name || "Transportadora"}: ${formatCurrency(f.amount / 100)}\n`;
        totalDay += f.amount;
      });

      dayPayments.forEach((p) => {
        message += `• RECEBIMENTO (${p.bank || "Outro"}): -${formatCurrency(p.amount / 100)}\n`;
        totalDay -= p.amount;
      });

      message += `*Saldo do dia: ${formatCurrency(totalDay / 100)}*\n\n`;
      grandTotal += totalDay;
    });

    message += `*SALDO GERAL: ${formatCurrency(grandTotal / 100)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleShareUnpaid = () => {
    const activeFreights = [...freights]
      .filter((f) => !f.canceled)
      .sort((a, b) => a.createdAt - b.createdAt);

    const activePayments = payments.filter((p) => !p.canceled);
    let totalPaid = activePayments.reduce((acc, p) => acc + p.amount, 0);

    const unpaidFreights: {
      transportName: string;
      date: number;
      amount: number;
    }[] = [];

    activeFreights.forEach((freight) => {
      const transport = transporters.find((t) => t.id === freight.transportId);
      const transportName = transport ? transport.name : "Transportadora";

      if (totalPaid >= freight.amount) {
        totalPaid -= freight.amount;
      } else if (totalPaid > 0) {
        const unpaidAmount = freight.amount - totalPaid;
        totalPaid = 0;
        unpaidFreights.push({
          transportName,
          date: freight.createdAt,
          amount: unpaidAmount,
        });
      } else {
        unpaidFreights.push({
          transportName,
          date: freight.createdAt,
          amount: freight.amount,
        });
      }
    });

    if (unpaidFreights.length === 0) {
      toast.success("Tudo em dia! Nenhum frete pendente de pagamento.");
      return;
    }

    const dateFormatted = format(new Date(), "dd/MM/yyyy");
    let message = `*Resumo de Fretes Pendentes — ${dateFormatted}*\n\n`;
    let totalPending = 0;

    unpaidFreights.forEach((f) => {
      const dStr = format(new Date(f.date), "dd/MM/yyyy");
      message += `• *${f.transportName}* (${dStr}): ${formatCurrency(f.amount / 100)}\n`;
      totalPending += f.amount;
    });

    message += `\n*Total Pendente a Receber: ${formatCurrency(totalPending / 100)}*`;
    message += `\n\n*Chaves para Pagamento PIX:*\n`;
    message += `• Nubank (CPF): \`000.820.251-69\`\n`;
    message += `• Caixa (Telefone): \`67 98419-9182\``;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6]">
        <span className="animate-spin h-10 w-10 border-4 border-[#D1FAE5] border-t-[#059669] rounded-full" />
      </div>
    );
  }

  return (
    <AppShell title="Controle de Frete">
      <div className="space-y-5">
        {/* Card do Saldo Esmeralda & Gelo */}
        <BalanceCard
          balance={balance}
          netProfit={netProfit}
          totalFreights={totalFreights}
          totalPayments={totalPayments}
          monthReceived={monthReceived}
          onOpenPayment={() => setPaymentModalOpen(true)}
          onShareUnpaid={handleShareUnpaid}
        />

        {/* Cartões de Chaves PIX com Logos da Caixa e Nubank */}
        <PixCards />

        {/* Grid 2 Colunas no Desktop (Lançamento à esquerda + Extrato à direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Coluna Esquerda: Lançamento Unificado */}
          <section className="lg:col-span-5 lg:sticky lg:top-8 clean-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF5F1]">
              <div>
                <h2 className="text-base font-extrabold text-[#0F291E]">
                  Lançar Fretes
                </h2>
                <p className="text-xs text-[#648274]">
                  Preencha uma ou mais empresas
                </p>
              </div>

              <label className="flex items-center gap-1.5 bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E3A2F] cursor-pointer">
                <CalendarIcon className="w-3.5 h-3.5 text-[#059669]" />
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs font-bold"
                />
              </label>
            </div>

            {activeTransporters.length > 0 ? (
              <div className="space-y-2.5">
                {activeTransporters.map((transport) => (
                  <TransportCard
                    key={transport.id}
                    config={transport}
                    value={drafts[transport.id] || ""}
                    onChange={(val) => handleDraftChange(transport.id, val)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-[#F4F8F6] border border-[#DCE8E2]">
                <p className="text-xs text-[#526D60] mb-3">
                  Nenhuma transportadora ativa cadastrada.
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#059669] text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Transportadora
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || draftEntries.length === 0}
              className={cn(
                "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                draftEntries.length > 0
                  ? "bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white shadow-sm"
                  : "bg-[#EEF5F1] text-[#86A395] cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {draftTotal > 0
                      ? `Salvar Lançamento (${formatCurrency(draftTotal / 100)})`
                      : "Digite um valor acima para salvar"}
                  </span>
                </>
              )}
            </button>
          </section>

          {/* Coluna Direita: Últimas Movimentações Limpas (Zero fundo rosado!) */}
          <section className="lg:col-span-7 clean-card p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEF5F1]">
              <div>
                <h2 className="text-base font-extrabold text-[#0F291E]">
                  Últimas Movimentações
                </h2>
                <p className="text-xs text-[#648274]">
                  Histórico sincronizado em tempo real
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-[#F4F8F6] p-1 rounded-xl border border-[#DCE8E2]">
                  {(
                    [
                      { id: "all", label: "Todos" },
                      { id: "freight", label: "Fretes" },
                      { id: "payment", label: "Pagos" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHistoryFilter(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                        historyFilter === tab.id
                          ? "bg-white text-[#047857] shadow-2xs"
                          : "text-[#648274] hover:text-[#0F291E]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {sortedDates.length > 0 && (
                  <button
                    type="button"
                    onClick={handleShareAll}
                    className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </button>
                )}
              </div>
            </div>

            {sortedDates.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-[#526D60]">
                  Nenhuma movimentação encontrada.
                </p>
                <p className="text-xs text-[#86A395] mt-1">
                  Os fretes e pagamentos salvos aparecerão aqui imediatamente.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {sortedDates.map((dateStr) => {
                  const dayItems = groupedTimeline[dateStr];
                  const dateObj = parseISO(dateStr);
                  const isToday = isSameDay(dateObj, new Date());

                  return (
                    <div key={dateStr} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#648274]">
                          {isToday
                            ? "Hoje"
                            : format(dateObj, "dd 'de' MMMM (EEEE)", {
                                locale: ptBR,
                              })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleShareDay(dateStr, dayItems)}
                          className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          Enviar dia
                        </button>
                      </div>

                      <div className="space-y-2">
                        {dayItems.map((item) => {
                          if (item.type === "payment") {
                            return (
                              <SwipeableItem
                                key={item.id}
                                onDelete={() =>
                                  cancelRecord("payment", item.id)
                                }
                                confirmTitle={`Deseja cancelar o recebimento de ${formatCurrency(item.amount / 100)}?`}
                              >
                                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <BankIcon bank={item.bank} className="w-10 h-10" />
                                    <div className="min-w-0">
                                      <div className="text-xs sm:text-sm font-bold text-[#14532D] truncate">
                                        Pagamento Recebido
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-[#166534]/85">
                                        <span>
                                          {format(
                                            new Date(item.createdAt),
                                            "HH:mm"
                                          )}
                                        </span>
                                        {item.bank && (
                                          <span className="font-semibold">
                                            • {item.bank}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-sm sm:text-base font-extrabold text-[#15803D]">
                                      - {formatCurrency(item.amount / 100)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Deseja remover o recebimento de ${formatCurrency(item.amount / 100)}?`
                                          )
                                        ) {
                                          void cancelRecord("payment", item.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-[#648274] hover:text-rose-600 hover:bg-white/80 transition-colors"
                                      title="Remover pagamento"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </SwipeableItem>
                            );
                          }

                          const transport = transporters.find(
                            (t) => t.id === item.transportId
                          );
                          const Icon = resolveTransporterIcon(transport?.icon);
                          const palette = resolveTransporterPalette(
                            transport?.color
                          );

                          return (
                            <SwipeableItem
                              key={item.id}
                              onDelete={() => cancelRecord("freight", item.id)}
                              confirmTitle={`Deseja remover o frete de ${formatCurrency(item.amount / 100)} (${transport?.name || "Transportadora"})?`}
                            >
                              <div className="p-3.5 rounded-2xl bg-white border border-[#E6F0EB] hover:border-[#C6F0DC] flex items-center justify-between gap-3 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    style={{
                                      backgroundColor: palette.softBg,
                                      borderColor: palette.softBorder,
                                      color: palette.iconText,
                                    }}
                                    className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs sm:text-sm font-bold text-[#0F291E] truncate">
                                      {transport?.name || "Transportadora"}
                                    </div>
                                    <div className="text-xs text-[#7A9688]">
                                      {format(
                                        new Date(item.createdAt),
                                        "HH:mm"
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span className="text-sm sm:text-base font-extrabold text-[#0F291E]">
                                    {formatCurrency(item.amount / 100)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Deseja remover o frete de ${formatCurrency(item.amount / 100)}?`
                                        )
                                      ) {
                                        void cancelRecord("freight", item.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-[#86A395] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Remover frete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </SwipeableItem>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal Rápido de Baixa / Pagamento */}
      <QuickPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </AppShell>
  );
}
