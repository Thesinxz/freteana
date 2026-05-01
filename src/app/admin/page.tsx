"use client";

import { useLedger } from "@/hooks/useLedger";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  subMonths, 
  startOfDay, 
  endOfDay,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Truck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  XCircle, 
  LayoutDashboard, 
  Users, 
  Receipt, 
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  DollarSign,
  Share2,
  Star,
  Sun,
  Zap,
  Home,
  FileDown,
  Moon,
  Target,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transporter } from "@/types";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";

type Tab = 'extrato' | 'transportadoras' | 'despesas' | 'relatorios';

const ICONS: Record<string, React.ElementType> = {
  Truck,
  Sun,
  Zap,
  Star,
};

const EXPENSE_CATEGORIES = [
  "Combustível",
  "Manutenção",
  "Alimentação",
  "Estacionamento",
  "Pedágio",
  "Pessoal",
  "Outros"
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
    addExpense
  } = useLedger();

  const [activeTab, setActiveTab] = useState<Tab>('extrato');
  const [darkMode, setDarkMode] = useState(false);
  const [profitGoal, setProfitGoal] = useState(5000); // R$ 5.000,00 default
  
  // Date Filter
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const [newTransporter, setNewTransporter] = useState({ name: '', color: 'bg-blue-600', icon: 'Truck' });
  const [newExpense, setNewExpense] = useState({ category: EXPENSE_CATEGORIES[0], amount: '', note: '' });

  // Filtered Data based on Date Range
  const filteredData = useMemo(() => {
    const filterByDate = (item: any) => {
      const date = new Date(item.createdAt);
      return isWithinInterval(date, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
    };

    return {
      freights: freights.filter(filterByDate),
      payments: payments.filter(filterByDate),
      expenses: expenses.filter(filterByDate)
    };
  }, [freights, payments, expenses, dateRange]);

  const stats = useMemo(() => {
    const f = filteredData.freights.filter(f => !f.canceled).reduce((acc, f) => acc + f.amount, 0);
    const p = filteredData.payments.filter(p => !p.canceled).reduce((acc, p) => acc + p.amount, 0);
    const e = filteredData.expenses.filter(e => !e.canceled).reduce((acc, e) => acc + e.amount, 0);
    return {
      totalFreights: f,
      totalPayments: p,
      totalExpenses: e,
      balance: f - p,
      netProfit: f - e,
      profitPercentage: Math.min(Math.round(((f - e) / (profitGoal * 100)) * 100), 100)
    };
  }, [filteredData, profitGoal]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const dayFreights = filteredData.freights.filter(f => !f.canceled && isSameDay(new Date(f.createdAt), day));
      const dayExpenses = filteredData.expenses.filter(e => !e.canceled && isSameDay(new Date(e.createdAt), day));
      return {
        name: format(day, "dd/MM"),
        fretes: dayFreights.reduce((acc, f) => acc + f.amount / 100, 0),
        despesas: dayExpenses.reduce((acc, e) => acc + e.amount / 100, 0),
      };
    });
  }, [filteredData, dateRange]);

  const transporterStats = useMemo(() => {
    return transporters.map(t => {
      const tFreights = filteredData.freights.filter(f => !f.canceled && f.transportId === t.id);
      return {
        name: t.name,
        value: tFreights.reduce((acc, f) => acc + f.amount / 100, 0),
      };
    }).filter(s => s.value > 0);
  }, [filteredData, transporters]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareLedger = () => {
    let message = `*Extrato - Painel da Ana*\n`;
    message += `Período: ${format(dateRange.start, "dd/MM")} até ${format(dateRange.end, "dd/MM")}\n\n`;
    message += `*Saldo a Receber:* ${formatCurrency(stats.balance / 100)}\n`;
    message += `*Lucro Líquido:* ${formatCurrency(stats.netProfit / 100)}\n\n`;
    message += `Transportadoras:\n`;
    transporters.filter(t => t.active).forEach(t => {
      const tFreights = filteredData.freights.filter(f => !f.canceled && f.transportId === t.id);
      const total = tFreights.reduce((acc, f) => acc + f.amount, 0);
      if (total > 0) message += `• ${t.name}: ${formatCurrency(total / 100)}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-800 rounded-full" />
      </div>
    );
  }

  const timeline = [
    ...filteredData.freights.map(f => ({ ...f, type: 'freight' as const })),
    ...filteredData.payments.map(p => ({ ...p, type: 'payment' as const })),
    ...filteredData.expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const navItems = [
    { id: 'extrato', icon: Activity, label: 'Extrato' },
    { id: 'relatorios', icon: BarChart3, label: 'Relatórios' },
    { id: 'transportadoras', icon: Users, label: 'Empresas' },
    { id: 'despesas', icon: Receipt, label: 'Despesas' }
  ];

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 transition-colors duration-500", darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      {/* Print Overlay (Hidden on Screen) */}
      <div className="hidden print:block p-10 bg-white text-black">
        <h1 className="text-3xl font-black mb-4">Relatório de Gestão - Ana</h1>
        <p className="mb-8 font-bold">Período: {format(dateRange.start, "dd/MM/yyyy")} - {format(dateRange.end, "dd/MM/yyyy")}</p>
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="border p-4"><h3>Lucro Líquido</h3><p className="text-2xl font-bold">{formatCurrency(stats.netProfit/100)}</p></div>
          <div className="border p-4"><h3>Saldo a Receber</h3><p className="text-2xl font-bold">{formatCurrency(stats.balance/100)}</p></div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b"><th>Data</th><th>Descrição</th><th className="text-right">Valor</th></tr></thead>
          <tbody>
            {timeline.filter(i => !i.canceled).map(i => (
              <tr key={i.id} className="border-b h-10">
                <td>{format(new Date(i.createdAt), "dd/MM/yyyy")}</td>
                <td>{i.type === 'freight' ? 'Frete' : i.type === 'payment' ? 'Pagamento' : 'Despesa'}</td>
                <td className="text-right">{formatCurrency(i.amount/100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar Desktop */}
      <aside className={cn("hidden md:flex w-72 p-8 shadow-2xl z-20 flex-shrink-0 flex-col relative overflow-hidden transition-colors", darkMode ? "bg-slate-900" : "bg-slate-900")}>
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
        <div className="flex items-center space-x-4 mb-12 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <LayoutDashboard className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight">Admin</h1>
            <p className="text-blue-300 text-sm font-medium">Controle de Frota</p>
          </div>
        </div>

        <nav className="space-y-2 relative z-10 flex-1">
          {navItems.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "w-full flex items-center px-5 py-4 rounded-2xl font-bold transition-all",
                activeTab === tab.id ? "bg-white/10 border border-white/10 shadow-inner text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
            </button>
          ))}
          
          <div className="pt-8 space-y-4">
            <div className="px-5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Preferências</p>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center p-3 rounded-xl bg-white/5 text-slate-300 hover:text-white transition-all font-bold text-sm"
              >
                <Moon className={cn("w-4 h-4 mr-2", darkMode ? "text-amber-400" : "text-slate-400")} />
                {darkMode ? 'Modo Claro' : 'Modo Escuro'}
              </button>
            </div>
          </div>
        </nav>

        <Link href="/" className="flex items-center px-5 py-4 text-slate-400 hover:text-white font-bold transition-all relative z-10">
          <Home className="w-5 h-5 mr-3" />
          Lançamentos
        </Link>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative print:hidden">
        <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <p className="text-blue-600 font-bold tracking-widest uppercase text-[10px] mb-2">Painel de Gestão</p>
            <h2 className="text-4xl font-black tracking-tight capitalize">
              {activeTab}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className={cn("flex items-center rounded-2xl border p-1 shadow-sm", darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
              <input 
                type="date" 
                value={format(dateRange.start, "yyyy-MM-dd")}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="bg-transparent px-3 py-2 text-sm font-bold outline-none"
              />
              <span className="text-slate-400 px-1">→</span>
              <input 
                type="date" 
                value={format(dateRange.end, "yyyy-MM-dd")}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="bg-transparent px-3 py-2 text-sm font-bold outline-none"
              />
            </div>
            
            <button 
              onClick={handlePrint}
              className={cn("px-6 py-4 rounded-2xl font-bold shadow-sm transition-all flex items-center active:scale-95", darkMode ? "bg-slate-900 border border-slate-800 text-slate-300" : "bg-white border border-slate-200 text-slate-700")}
            >
              <FileDown className="w-5 h-5 mr-2 text-blue-500" />
              PDF
            </button>
            
            <button 
              onClick={handleShareLedger}
              className={cn("px-6 py-4 rounded-2xl font-bold shadow-sm transition-all flex items-center active:scale-95", darkMode ? "bg-slate-900 border border-slate-800 text-slate-300" : "bg-white border border-slate-200 text-slate-700")}
            >
              <Share2 className="w-5 h-5 mr-2 text-emerald-500" />
              WhatsApp
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <div className={cn("glass-card p-6 border-l-4 border-blue-500", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
            <h3 className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Saldo a Receber</h3>
            <p className="text-2xl font-black">{formatCurrency(stats.balance / 100)}</p>
          </div>
          <div className={cn("glass-card p-6 border-l-4 border-emerald-500", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
            <h3 className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Lucro Líquido</h3>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(stats.netProfit / 100)}</p>
          </div>
          <div className={cn("glass-card p-6 border-l-4 border-amber-500", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
            <h3 className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Faturamento</h3>
            <p className="text-2xl font-black">{formatCurrency(stats.totalFreights / 100)}</p>
          </div>
          <div className={cn("glass-card p-6 border-l-4 border-red-500", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
            <h3 className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Despesas</h3>
            <p className="text-2xl font-black text-red-500">{formatCurrency(stats.totalExpenses / 100)}</p>
          </div>
          
          {/* Profit Goal Card */}
          <div className={cn("glass-card p-6 border-l-4 border-purple-500 relative overflow-hidden", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
            <div className="relative z-10">
              <h3 className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">Meta de Lucro</h3>
              <div className="flex items-end space-x-2">
                <p className="text-2xl font-black">{stats.profitPercentage}%</p>
                <p className="text-[10px] text-slate-400 mb-1">de {formatCurrency(profitGoal)}</p>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.profitPercentage}%` }}
                  className="h-full bg-purple-500"
                />
              </div>
            </div>
            <Trophy className="absolute -bottom-2 -right-2 w-12 h-12 text-purple-500/10" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'extrato' && (
            <motion.div key="extrato" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={cn("glass-card overflow-hidden", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn("border-b text-slate-500 uppercase tracking-widest text-[10px]", darkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-100")}>
                      <th className="p-4 font-bold w-16">Tipo</th>
                      <th className="p-4 font-bold">Data</th>
                      <th className="p-4 font-bold">Descrição</th>
                      <th className="p-4 font-bold text-right">Valor</th>
                      <th className="p-4 font-bold text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.map((item: any) => {
                      const isFreight = item.type === 'freight';
                      const isPayment = item.type === 'payment';
                      const transport = isFreight ? transporters.find(t => t.id === item.transportId) : null;
                      const Icon = isFreight ? (ICONS[transport?.icon || 'Truck'] || Truck) : isPayment ? ArrowDownRight : XCircle;
                      return (
                        <tr key={item.id} className={cn("border-b hover:bg-white/10 transition-colors", item.canceled && "opacity-40", darkMode ? "border-slate-800/50" : "border-slate-50")}>
                          <td className="p-4">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isFreight ? "bg-blue-100 text-blue-600" : isPayment ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                              <Icon className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium block">{format(new Date(item.createdAt), "dd/MM/yyyy")}</span>
                            <span className="text-xs text-slate-400">{format(new Date(item.createdAt), "HH:mm")}</span>
                          </td>
                          <td className="p-4">
                            <span className={cn("font-bold", darkMode ? "text-slate-200" : "text-slate-700")}>{isFreight ? `Frete: ${transport?.name || '...'}` : isPayment ? 'Pagamento Recebido' : `Despesa: ${item.category}`}</span>
                            {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
                          </td>
                          <td className={cn("p-4 text-right font-bold", isFreight ? (darkMode ? "text-blue-400" : "text-slate-800") : isPayment ? "text-emerald-500" : "text-red-500")}>
                            {isFreight ? "+" : "-"}{formatCurrency(item.amount / 100)}
                          </td>
                          <td className="p-4 text-center">
                            {!item.canceled && (
                              <button onClick={() => cancelRecord(item.type, item.id)} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {timeline.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">Nenhum lançamento no período selecionado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'relatorios' && (
            <motion.div key="relatorios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={cn("glass-card p-8 min-h-[400px]", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
                  <h3 className="font-bold mb-6 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                    Fluxo Diário
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e293b" : "#f1f5f9"} vertical={false} />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} stroke={darkMode ? "#64748b" : "#94a3b8"} />
                        <Tooltip contentStyle={{ backgroundColor: darkMode ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="fretes" stroke="#3b82f6" strokeWidth={3} dot={false} name="Faturamento" />
                        <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} dot={false} name="Despesas" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Meta Edit Card */}
                <div className={cn("glass-card p-8 min-h-[400px] flex flex-col", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
                  <h3 className="font-bold mb-6 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-500" />
                    Configurar Meta de Lucro
                  </h3>
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="text-center mb-6">
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-2">Meta Atual</p>
                      <p className="text-5xl font-black text-purple-500">{formatCurrency(profitGoal)}</p>
                    </div>
                    <input 
                      type="range" 
                      min="1000" 
                      max="20000" 
                      step="500" 
                      value={profitGoal}
                      onChange={(e) => setProfitGoal(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-8"
                    />
                    <div className="grid grid-cols-3 gap-4 w-full">
                      {[3000, 5000, 10000].map(val => (
                        <button key={val} onClick={() => setProfitGoal(val)} className={cn("py-3 rounded-xl font-bold text-sm transition-all", profitGoal === val ? "bg-purple-500 text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                          {formatCurrency(val)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transportadoras' && (
            <motion.div key="transportadoras" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className={cn("glass-card p-8", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
                <h3 className="font-bold mb-6">Cadastrar Nova Empresa</h3>
                <form onSubmit={handleAddTransporter} className="flex flex-col lg:flex-row gap-4">
                  <input type="text" placeholder="Nome" value={newTransporter.name} onChange={e => setNewTransporter({...newTransporter, name: e.target.value})} className={cn("flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all", darkMode ? "bg-slate-800 border-slate-700 focus:ring-blue-500/20" : "bg-slate-50 border-slate-200 focus:ring-blue-500/20")} />
                  <div className="flex gap-4">
                    <select value={newTransporter.icon} onChange={e => setNewTransporter({...newTransporter, icon: e.target.value})} className={cn("flex-1 lg:flex-none border rounded-xl px-4 py-3 outline-none", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                      <option value="Truck">Caminhão</option>
                      <option value="Star">Estrela</option>
                      <option value="Sun">Sol</option>
                      <option value="Zap">Cometa</option>
                    </select>
                    <select value={newTransporter.color} onChange={e => setNewTransporter({...newTransporter, color: e.target.value})} className={cn("flex-1 lg:flex-none border rounded-xl px-4 py-3 outline-none", darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                      <option value="bg-blue-600">Azul</option>
                      <option value="bg-amber-600">Laranja</option>
                      <option value="bg-emerald-600">Verde</option>
                      <option value="bg-red-600">Vermelho</option>
                      <option value="bg-purple-600">Roxo</option>
                    </select>
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">Adicionar</button>
                </form>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {transporters.map(t => {
                  const Icon = ICONS[t.icon] || Truck;
                  return (
                    <div key={t.id} className={cn("glass-card p-6 flex items-center justify-between transition-colors", darkMode ? "bg-slate-900/40 hover:bg-slate-900/60" : "bg-white/60 hover:bg-white")}>
                      <div className="flex items-center space-x-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", t.color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold">{t.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.active ? 'Ativa' : 'Inativa'}</p>
                        </div>
                      </div>
                      <button onClick={() => manageTransporter({ ...t, active: !t.active })} className={cn("p-2 rounded-xl transition-all", t.active ? "text-emerald-500 bg-emerald-100/20" : "text-slate-500 bg-slate-100/20")}>
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'despesas' && (
            <motion.div key="despesas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className={cn("glass-card p-8", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
                <h3 className="font-bold mb-6">Lançar Nova Despesa</h3>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select 
                    value={newExpense.category} 
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})} 
                    className={cn("border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all", darkMode ? "bg-slate-800 border-slate-700 focus:ring-red-500/20" : "bg-slate-50 border-slate-200 focus:ring-red-500/20")}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Valor (R$)" 
                    value={newExpense.amount} 
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value.replace(/\D/g, "")})} 
                    className={cn("border rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all", darkMode ? "bg-slate-800 border-slate-700 focus:ring-red-500/20" : "bg-slate-50 border-slate-200 focus:ring-red-500/20")}
                  />
                  <button type="submit" className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all">Lançar</button>
                </form>
              </div>
              <div className={cn("glass-card overflow-hidden", darkMode ? "bg-slate-900/50" : "bg-white/60")}>
                <table className="w-full text-left">
                  <thead>
                    <tr className={cn("text-[10px] uppercase font-bold tracking-widest border-b", darkMode ? "bg-slate-800/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500")}>
                      <th className="p-4">Data</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.expenses.map(e => (
                      <tr key={e.id} className={cn("border-b transition-colors", e.canceled && "opacity-40", darkMode ? "border-slate-800/50 hover:bg-white/5" : "border-slate-50 hover:bg-slate-50")}>
                        <td className="p-4 text-sm font-medium text-slate-500">{format(new Date(e.createdAt), "dd/MM/yyyy")}</td>
                        <td className="p-4 font-bold">{e.category}</td>
                        <td className="p-4 text-right text-red-500 font-bold">{formatCurrency(e.amount / 100)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => cancelRecord('expense', e.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className={cn("md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center p-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-colors", darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
              activeTab === item.id ? (darkMode ? "text-blue-400 bg-blue-500/10" : "text-blue-600 bg-blue-50") : "text-slate-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
