"use client";

import { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isSameDay,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FileDown,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  Share2,
  Target,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";
import { BankIcon } from "@/components/BrandLogos";
import {
  EditableRecordTarget,
  EditRecordModal,
} from "@/components/EditRecordModal";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AVAILABLE_TRANSPORTER_COLORS,
  resolveTransporterIcon,
  resolveTransporterPalette,
} from "@/lib/transporter-styles";

type Tab = "extrato" | "relatorios" | "transportadoras" | "despesas";

const EXPENSE_CATEGORIES = [
  "Combustível",
  "Manutenção",
  "Alimentação",
  "Estacionamento",
  "Pedágio",
  "Pessoal",
  "Outros",
];

const ICON_OPTIONS = [
  { key: "Truck", label: "Caminhão" },
  { key: "Zap", label: "Raio / Cometa" },
  { key: "Star", label: "Estrela" },
  { key: "Sun", label: "Sol" },
];

export default function AdminDashboard() {
  const {
    freights,
    payments,
    expenses,
    transporters,
    loading,
    cancelRecord,
    manageTransporter,
    addExpense,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<Tab>("extrato");
  const [profitGoal, setProfitGoal] = useState(5000);
  const [editTarget, setEditTarget] = useState<EditableRecordTarget | null>(
    null
  );

  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const [newTransporter, setNewTransporter] = useState({
    name: "",
    color: "bg-emerald-600",
    icon: "Truck",
  });

  const [newExpense, setNewExpense] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    note: "",
  });

  const safeDateRange = useMemo(() => {
    let start = dateRange.start;
    let end = dateRange.end;
    if (!isValid(start)) start = startOfMonth(new Date());
    if (!isValid(end)) end = endOfMonth(new Date());
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }
    return { start, end };
  }, [dateRange]);

  const filteredData = useMemo(() => {
    const filterByDate = (item: { createdAt?: number }) => {
      if (!item.createdAt) return false;
      const date = new Date(item.createdAt);
      if (!isValid(date)) return false;
      return isWithinInterval(date, {
        start: startOfDay(safeDateRange.start),
        end: endOfDay(safeDateRange.end),
      });
    };

    return {
      freights: (freights || []).filter(filterByDate),
      payments: (payments || []).filter(filterByDate),
      expenses: (expenses || []).filter(filterByDate),
    };
  }, [freights, payments, expenses, safeDateRange]);

  const stats = useMemo(() => {
    const f = filteredData.freights
      .filter((item) => !item.canceled)
      .reduce((acc, item) => acc + item.amount, 0);
    const p = filteredData.payments
      .filter((item) => !item.canceled)
      .reduce((acc, item) => acc + item.amount, 0);
    const e = filteredData.expenses
      .filter((item) => !item.canceled)
      .reduce((acc, item) => acc + item.amount, 0);
    const goal = profitGoal > 0 ? profitGoal : 1;
    const net = f - e;

    return {
      totalFreights: f,
      totalPayments: p,
      totalExpenses: e,
      balance: f - p,
      netProfit: net,
      profitPercentage: Math.max(
        0,
        Math.min(Math.round((net / (goal * 100)) * 100), 100)
      ),
    };
  }, [filteredData, profitGoal]);

  const chartData = useMemo(() => {
    try {
      const days = eachDayOfInterval({
        start: safeDateRange.start,
        end: safeDateRange.end,
      }).slice(-62);

      return days.map((day) => {
        const dayFreights = filteredData.freights.filter(
          (f) => !f.canceled && isSameDay(new Date(f.createdAt), day)
        );
        const dayExpenses = filteredData.expenses.filter(
          (e) => !e.canceled && isSameDay(new Date(e.createdAt), day)
        );
        return {
          name: format(day, "dd/MM"),
          fretes: dayFreights.reduce((acc, f) => acc + f.amount / 100, 0),
          despesas: dayExpenses.reduce((acc, e) => acc + e.amount / 100, 0),
        };
      });
    } catch {
      return [];
    }
  }, [filteredData, safeDateRange]);

  const transporterBreakdown = useMemo(() => {
    return transporters
      .map((t) => {
        const total = filteredData.freights
          .filter((f) => !f.canceled && f.transportId === t.id)
          .reduce((acc, f) => acc + f.amount, 0);
        return { transporter: t, total };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredData.freights, transporters]);

  const handleAddTransporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransporter.name.trim()) return;
    await manageTransporter({
      name: newTransporter.name.trim(),
      color: newTransporter.color,
      icon: newTransporter.icon,
    });
    setNewTransporter({ name: "", color: "bg-emerald-600", icon: "Truck" });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newExpense.amount, 10);
    if (isNaN(amount) || amount <= 0) return;
    await addExpense(newExpense.category, amount, newExpense.note.trim());
    setNewExpense({ category: EXPENSE_CATEGORIES[0], amount: "", note: "" });
  };

  const getExpenseDisplay = () => {
    if (!newExpense.amount) return "";
    const parsed = parseInt(newExpense.amount, 10);
    if (isNaN(parsed)) return "";
    return formatCurrency(parsed / 100).replace("R$", "").trim();
  };

  const handleShareLedger = () => {
    let message = `*Extrato — Controle de Frete*\n`;
    message += `Período: ${format(safeDateRange.start, "dd/MM/yyyy")} até ${format(safeDateRange.end, "dd/MM/yyyy")}\n\n`;
    message += `*Saldo a Receber:* ${formatCurrency(stats.balance / 100)}\n`;
    message += `*Faturamento:* ${formatCurrency(stats.totalFreights / 100)}\n`;
    message += `*Lucro Líquido:* ${formatCurrency(stats.netProfit / 100)}\n\n`;
    if (transporterBreakdown.length > 0) {
      message += `*Por Transportadora:*\n`;
      transporterBreakdown.forEach(({ transporter, total }) => {
        message += `• ${transporter.name}: ${formatCurrency(total / 100)}\n`;
      });
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    const date = parseISO(value);
    if (isValid(date)) {
      setDateRange((prev) => ({ ...prev, [type]: date }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6]">
        <span className="animate-spin h-10 w-10 border-4 border-[#D1FAE5] border-t-[#059669] rounded-full" />
      </div>
    );
  }

  const timeline = [
    ...filteredData.freights.map((f) => ({ ...f, type: "freight" as const })),
    ...filteredData.payments.map((p) => ({ ...p, type: "payment" as const })),
    ...filteredData.expenses.map((e) => ({ ...e, type: "expense" as const })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  const tabs = [
    { id: "extrato" as const, icon: Activity, label: "Extrato" },
    { id: "relatorios" as const, icon: BarChart3, label: "Relatórios" },
    { id: "transportadoras" as const, icon: Users, label: "Empresas" },
    { id: "despesas" as const, icon: Receipt, label: "Despesas" },
  ];

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center bg-white border border-[#DCE8E2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E3A2F]">
        <input
          type="date"
          value={format(safeDateRange.start, "yyyy-MM-dd")}
          onChange={(e) => handleDateChange("start", e.target.value)}
          className="bg-transparent outline-none"
        />
        <span className="px-1.5 text-[#86A395]">→</span>
        <input
          type="date"
          value={format(safeDateRange.end, "yyyy-MM-dd")}
          onChange={(e) => handleDateChange("end", e.target.value)}
          className="bg-transparent outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#DCE8E2] text-xs font-bold text-[#1E3A2F] flex items-center gap-1.5"
      >
        <FileDown className="w-4 h-4 text-[#059669]" />
        <span>PDF</span>
      </button>
      <button
        type="button"
        onClick={handleShareLedger}
        className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1.5"
      >
        <Share2 className="w-4 h-4" />
        <span>WhatsApp</span>
      </button>
    </div>
  );

  return (
    <AppShell
      title="Gestão & Relatórios"
      subtitle="Controle completo de fretes, empresas e despesas"
      headerRight={headerControls}
    >
      {/* Versão para Impressão / PDF */}
      <div className="hidden print:block p-8 bg-white text-black">
        <h1 className="text-2xl font-bold mb-2">Relatório — Controle de Frete</h1>
        <p className="text-sm mb-6">
          Período: {format(safeDateRange.start, "dd/MM/yyyy")} até{" "}
          {format(safeDateRange.end, "dd/MM/yyyy")}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border p-3 rounded-lg">
            <div className="text-xs">Faturamento</div>
            <div className="text-lg font-bold">
              {formatCurrency(stats.totalFreights / 100)}
            </div>
          </div>
          <div className="border p-3 rounded-lg">
            <div className="text-xs">Saldo a Receber</div>
            <div className="text-lg font-bold">
              {formatCurrency(stats.balance / 100)}
            </div>
          </div>
          <div className="border p-3 rounded-lg">
            <div className="text-xs">Lucro Líquido</div>
            <div className="text-lg font-bold">
              {formatCurrency(stats.netProfit / 100)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 print:hidden">
        {/* Filtro de Data no Mobile */}
        <div className="lg:hidden">{headerControls}</div>

        {/* Cards de Indicadores Claros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="clean-card p-4">
            <span className="text-xs font-bold text-[#648274]">
              Saldo a Receber
            </span>
            <p className="text-xl font-extrabold text-[#0F291E] mt-1">
              {formatCurrency(stats.balance / 100)}
            </p>
          </div>
          <div className="clean-card p-4 bg-[#ECFDF5]/60 border-[#C6F0DC]">
            <span className="text-xs font-bold text-[#047857]">
              Lucro Líquido
            </span>
            <p className="text-xl font-extrabold text-[#047857] mt-1">
              {formatCurrency(stats.netProfit / 100)}
            </p>
          </div>
          <div className="clean-card p-4">
            <span className="text-xs font-bold text-[#648274]">
              Faturamento
            </span>
            <p className="text-xl font-extrabold text-[#0F291E] mt-1">
              {formatCurrency(stats.totalFreights / 100)}
            </p>
          </div>
          <div className="clean-card p-4">
            <span className="text-xs font-bold text-[#648274]">Despesas</span>
            <p className="text-xl font-extrabold text-orange-600 mt-1">
              {formatCurrency(stats.totalExpenses / 100)}
            </p>
          </div>
          <div className="col-span-2 lg:col-span-1 clean-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#648274]">
                Meta ({formatCurrency(profitGoal)})
              </span>
              <Trophy className="w-4 h-4 text-[#059669]" />
            </div>
            <p className="text-xl font-extrabold text-[#0F291E] mt-1">
              {stats.profitPercentage}%
            </p>
            <div className="w-full h-2 bg-[#EEF5F1] rounded-full mt-2 overflow-hidden">
              <div
                style={{ width: `${stats.profitPercentage}%` }}
                className="h-full bg-[#10B981] rounded-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* Abas Clean */}
        <div className="bg-white border border-[#DCE8E2] p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                  active
                    ? "bg-[#ECFDF5] text-[#047857] border border-[#C6F0DC]"
                    : "text-[#648274] hover:text-[#0F291E] hover:bg-[#F4F8F6]"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === "extrato" && (
          <div className="clean-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F8F6] border-b border-[#E2ECE7] text-xs font-bold text-[#526D60]">
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5">Descrição</th>
                    <th className="p-3.5 text-right">Valor</th>
                    <th className="p-3.5 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF5F1] text-sm">
                  {timeline.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-xs text-[#648274]"
                      >
                        Nenhuma movimentação no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    timeline.map((item) => {
                      const isFreight = item.type === "freight";
                      const isPayment = item.type === "payment";
                      const transport = isFreight
                        ? transporters.find((t) => t.id === item.transportId)
                        : null;
                      const Icon = isFreight
                        ? resolveTransporterIcon(transport?.icon)
                        : XCircle;
                      const palette = resolveTransporterPalette(
                        transport?.color
                      );

                      return (
                        <tr
                          key={`${item.type}-${item.id}`}
                          className={cn(
                            "hover:bg-[#F9FCFA] transition-colors",
                            item.canceled && "opacity-40 line-through"
                          )}
                        >
                          <td className="p-3.5">
                            {isPayment ? (
                              <BankIcon bank={item.bank} className="w-9 h-9" />
                            ) : (
                              <div
                                style={
                                  isFreight
                                    ? {
                                        backgroundColor: palette.softBg,
                                        borderColor: palette.softBorder,
                                        color: palette.iconText,
                                      }
                                    : undefined
                                }
                                className={cn(
                                  "w-9 h-9 rounded-xl border flex items-center justify-center",
                                  !isFreight &&
                                    "bg-orange-50 border-orange-200 text-orange-700"
                                )}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-semibold text-xs text-[#0F291E]">
                              {format(new Date(item.createdAt), "dd/MM/yyyy")}
                            </div>
                            <div className="text-xs text-[#7A9688]">
                              {format(new Date(item.createdAt), "HH:mm")}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-xs sm:text-sm text-[#0F291E]">
                              {isFreight
                                ? `Frete • ${transport?.name || "Transportadora"}`
                                : isPayment
                                  ? "Pagamento Recebido"
                                  : `Despesa • ${item.category}`}
                            </div>
                            {item.note && (
                              <p className="text-xs text-[#648274]">
                                {item.note}
                              </p>
                            )}
                            {isPayment && item.bank && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] mt-0.5">
                                <Landmark className="w-3 h-3" />
                                {item.bank}
                              </span>
                            )}
                          </td>
                          <td
                            className={cn(
                              "p-3.5 text-right font-extrabold whitespace-nowrap",
                              isFreight
                                ? "text-[#0F291E]"
                                : isPayment
                                  ? "text-[#059669]"
                                  : "text-orange-600"
                            )}
                          >
                            {isFreight ? "+" : "-"}{" "}
                            {formatCurrency(item.amount / 100)}
                          </td>
                          <td className="p-3.5 text-center">
                            {!item.canceled && (
                              <div className="inline-flex items-center gap-1">
                                {(isFreight || isPayment) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditTarget(
                                        isFreight
                                          ? {
                                              type: "freight",
                                              id: item.id,
                                              transportId:
                                                item.transportId || "",
                                              amount: item.amount,
                                              createdAt: item.createdAt,
                                              note: item.note,
                                            }
                                          : {
                                              type: "payment",
                                              id: item.id,
                                              amount: item.amount,
                                              bank: item.bank,
                                              transportId: item.transportId,
                                              createdAt: item.createdAt,
                                              note: item.note,
                                            }
                                      )
                                    }
                                    className="p-1.5 rounded-lg text-[#86A395] hover:text-[#047857] hover:bg-[#ECFDF5]"
                                    title="Editar lançamento"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm("Deseja remover este registro?")
                                    ) {
                                      void cancelRecord(item.type, item.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-[#86A395] hover:text-rose-600 hover:bg-rose-50"
                                  title="Estornar lançamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "relatorios" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 clean-card p-5">
              <h3 className="text-sm font-extrabold text-[#0F291E] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#059669]" />
                Evolução Diária (Fretes x Despesas)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#EEF5F1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="#7A9688"
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      stroke="#7A9688"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "0.875rem",
                        border: "1px solid #DCE8E2",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fretes"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={false}
                      name="Fretes (R$)"
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      stroke="#F97316"
                      strokeWidth={2.5}
                      dot={false}
                      name="Despesas (R$)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <div className="clean-card p-5">
                <h3 className="text-sm font-extrabold text-[#0F291E] mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#059669]" />
                  Ajustar Meta Mensal
                </h3>
                <p className="text-3xl font-extrabold text-[#047857] mb-3">
                  {formatCurrency(profitGoal)}
                </p>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={profitGoal}
                  onChange={(e) => setProfitGoal(parseInt(e.target.value, 10))}
                  className="w-full accent-[#059669] cursor-pointer"
                />
              </div>

              <div className="clean-card p-5 space-y-3">
                <h3 className="text-sm font-extrabold text-[#0F291E]">
                  Total por Transportadora
                </h3>
                {transporterBreakdown.length === 0 ? (
                  <p className="text-xs text-[#648274]">
                    Sem lançamentos no período.
                  </p>
                ) : (
                  transporterBreakdown.map(({ transporter, total }) => {
                    const palette = resolveTransporterPalette(
                      transporter.color
                    );
                    return (
                      <div
                        key={transporter.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F8F6]"
                      >
                        <span className="flex items-center gap-2 text-xs font-bold text-[#1E3A2F]">
                          <span
                            style={{ backgroundColor: palette.dot }}
                            className="w-2.5 h-2.5 rounded-full"
                          />
                          {transporter.name}
                        </span>
                        <span className="text-xs font-extrabold text-[#047857]">
                          {formatCurrency(total / 100)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transportadoras" && (
          <div className="space-y-5">
            <div className="clean-card p-5">
              <h3 className="text-sm font-extrabold text-[#0F291E] mb-4">
                Cadastrar Nova Transportadora
              </h3>
              <form
                onSubmit={handleAddTransporter}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
              >
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cometa Del Amambay"
                    value={newTransporter.name}
                    onChange={(e) =>
                      setNewTransporter({
                        ...newTransporter,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Ícone
                  </label>
                  <select
                    value={newTransporter.icon}
                    onChange={(e) =>
                      setNewTransporter({
                        ...newTransporter,
                        icon: e.target.value,
                      })
                    }
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F291E]"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Cor
                  </label>
                  <div className="flex items-center gap-1.5 py-1.5">
                    {AVAILABLE_TRANSPORTER_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() =>
                          setNewTransporter({ ...newTransporter, color: c.key })
                        }
                        style={{ backgroundColor: c.dot }}
                        className={cn(
                          "w-7 h-7 rounded-full transition-transform",
                          newTransporter.color === c.key
                            ? "ring-2 ring-offset-2 ring-[#059669] scale-110"
                            : "opacity-70 hover:opacity-100"
                        )}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-10.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {transporters.map((t) => {
                const Icon = resolveTransporterIcon(t.icon);
                const palette = resolveTransporterPalette(t.color);
                return (
                  <div
                    key={t.id}
                    className="clean-card p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        style={{
                          backgroundColor: palette.softBg,
                          borderColor: palette.softBorder,
                          color: palette.iconText,
                        }}
                        className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0F291E] truncate">
                          {t.name}
                        </h4>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            t.active ? "text-[#059669]" : "text-[#86A395]"
                          )}
                        >
                          {t.active ? "Ativa nos lançamentos" : "Inativa"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        manageTransporter({ ...t, active: !t.active })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all",
                        t.active
                          ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                          : "bg-[#F4F8F6] border-[#DCE8E2] text-[#648274]"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.active ? "Ativa" : "Ativar"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "despesas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 clean-card p-5">
              <h3 className="text-sm font-extrabold text-[#0F291E] mb-4">
                Registrar Nova Despesa
              </h3>
              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E]"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={getExpenseDisplay()}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-base font-extrabold text-[#0F291E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Abastecimento posto centro"
                    value={newExpense.note}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, note: e.target.value })
                    }
                    className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm text-[#0F291E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-xs sm:text-sm"
                >
                  Salvar Despesa
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 clean-card p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#0F291E] pb-2 border-b border-[#EEF5F1]">
                Despesas no Período
              </h3>
              {filteredData.expenses.filter((e) => !e.canceled).length === 0 ? (
                <p className="text-xs text-[#648274] py-6 text-center">
                  Nenhuma despesa registrada neste período.
                </p>
              ) : (
                filteredData.expenses
                  .filter((e) => !e.canceled)
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-[#F9FCFA] border border-[#E6F0EB] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#0F291E]">
                          {exp.category}
                        </div>
                        <div className="text-xs text-[#648274]">
                          {format(
                            new Date(exp.createdAt),
                            "dd/MM/yyyy 'às' HH:mm"
                          )}
                          {exp.note ? ` • ${exp.note}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-orange-600">
                          - {formatCurrency(exp.amount / 100)}
                        </span>
                        <button
                          type="button"
                          onClick={() => cancelRecord("expense", exp.id)}
                          className="p-1.5 rounded-lg text-[#86A395] hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      <EditRecordModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </AppShell>
  );
}
