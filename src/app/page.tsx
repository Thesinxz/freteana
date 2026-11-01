"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Pencil,
  Plus,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";
import { BalanceCard } from "@/components/BalanceCard";
import { BankIcon } from "@/components/BrandLogos";
import { TransportCard } from "@/components/TransportCard";
import { PixCards } from "@/components/PixCards";
import { SwipeableItem } from "@/components/SwipeableItem";
import { QuickPaymentModal } from "@/components/QuickPaymentModal";
import { ShareReceiptModal } from "@/components/ShareReceiptModal";
import {
  EditableRecordTarget,
  EditRecordModal,
} from "@/components/EditRecordModal";
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
    pendingSummary,
    transporters,
    loading,
    addFreightsBatch,
    cancelRecord,
  } = useLedger();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTransportId, setPaymentTransportId] = useState("");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptTransportId, setReceiptTransportId] = useState("");

  const [editTarget, setEditTarget] = useState<EditableRecordTarget | null>(
    null
  );

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

  const handleOpenPayment = (transportId?: string) => {
    setPaymentTransportId(transportId || "");
    setPaymentModalOpen(true);
  };

  const handleOpenReceipt = (transportId?: string) => {
    setReceiptTransportId(transportId || "");
    setReceiptModalOpen(true);
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
    authorName?: string;
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
        {/* Card do Saldo + Saldo Individual por Transportadora */}
        <BalanceCard
          balance={balance}
          netProfit={netProfit}
          totalFreights={totalFreights}
          totalPayments={totalPayments}
          monthReceived={monthReceived}
          byTransporter={pendingSummary.byTransporter}
          onOpenPayment={handleOpenPayment}
          onOpenReceipt={handleOpenReceipt}
        />

        {/* Cartões de Chaves PIX com Logos da Caixa e Nubank */}
        <PixCards />

        {/* Grid 2 Colunas no Desktop */}
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

          {/* Coluna Direita: Últimas Movimentações */}
          <section className="lg:col-span-7 clean-card p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EEF5F1]">
              <div>
                <h2 className="text-base font-extrabold text-[#0F291E]">
                  Últimas Movimentações
                </h2>
                <p className="text-xs text-[#648274]">
                  Toque no lápis para editar ou na lixeira para estornar
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
                    <span>Texto</span>
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
                            const linkedTransport = item.transportId
                              ? transporters.find(
                                  (t) => t.id === item.transportId
                                )
                              : null;

                            return (
                              <SwipeableItem
                                key={item.id}
                                onDelete={() =>
                                  cancelRecord("payment", item.id)
                                }
                                confirmTitle={`Deseja estornar o recebimento de ${formatCurrency(item.amount / 100)}?`}
                              >
                                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <BankIcon
                                      bank={item.bank}
                                      className="w-10 h-10"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs sm:text-sm font-bold text-[#14532D] truncate">
                                        Pagamento Recebido
                                        {linkedTransport
                                          ? ` • ${linkedTransport.name}`
                                          : ""}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#166534]/85">
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
                                        {item.authorName && (
                                          <span>• por {item.authorName}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-sm sm:text-base font-extrabold text-[#15803D] mr-1">
                                      - {formatCurrency(item.amount / 100)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditTarget({
                                          type: "payment",
                                          id: item.id,
                                          amount: item.amount,
                                          bank: item.bank,
                                          transportId: item.transportId,
                                          createdAt: item.createdAt,
                                          note: item.note,
                                        })
                                      }
                                      className="p-1.5 rounded-lg text-[#526D60] hover:text-[#047857] hover:bg-white/80 transition-colors"
                                      title="Editar pagamento"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Deseja estornar o recebimento de ${formatCurrency(item.amount / 100)}?`
                                          )
                                        ) {
                                          void cancelRecord("payment", item.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-[#648274] hover:text-rose-600 hover:bg-white/80 transition-colors"
                                      title="Estornar pagamento"
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
                                    {React.createElement(
                                      resolveTransporterIcon(transport?.icon),
                                      { className: "w-4 h-4" }
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs sm:text-sm font-bold text-[#0F291E] truncate">
                                      {transport?.name || "Transportadora"}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#7A9688]">
                                      <span>
                                        {format(
                                          new Date(item.createdAt),
                                          "HH:mm"
                                        )}
                                      </span>
                                      {item.authorName && (
                                        <span>• por {item.authorName}</span>
                                      )}
                                      {item.note && (
                                        <span className="truncate">
                                          • {item.note}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-sm sm:text-base font-extrabold text-[#0F291E] mr-1">
                                    {formatCurrency(item.amount / 100)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditTarget({
                                        type: "freight",
                                        id: item.id,
                                        transportId:
                                          item.transportId ||
                                          activeTransporters[0]?.id ||
                                          "",
                                        amount: item.amount,
                                        createdAt: item.createdAt,
                                        note: item.note,
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-[#86A395] hover:text-[#047857] hover:bg-[#ECFDF5] transition-colors"
                                    title="Editar frete"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
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
        initialTransportId={paymentTransportId}
        onClose={() => setPaymentModalOpen(false)}
      />

      {/* Modal de Geração de Card em Imagem / WhatsApp */}
      <ShareReceiptModal
        open={receiptModalOpen}
        initialTransportId={receiptTransportId}
        onClose={() => setReceiptModalOpen(false)}
      />

      {/* Modal de Edição Rápida em 1 Toque */}
      <EditRecordModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </AppShell>
  );
}
