"use client";

import { useLedger } from "@/hooks/useLedger";
import { formatCurrency, cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
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
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transporter } from "@/types";
import Link from "next/link";
import { useState, useMemo } from "react";
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

export default function AdminDashboard() {
  const { 
    freights, 
    payments, 
    expenses, 
    transporters, 
    balance, 
    netProfit, 
    loading, 
    cancelRecord,
    manageTransporter,
    addExpense
  } = useLedger();

  const [activeTab, setActiveTab] = useState<Tab>('extrato');
  
  const [newTransporter, setNewTransporter] = useState({ name: '', color: 'bg-blue-600', icon: 'Truck' });
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', note: '' });

  const chartData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const dayFreights = freights.filter(f => !f.canceled && isSameDay(new Date(f.createdAt), day));
      const dayExpenses = expenses.filter(e => !e.canceled && isSameDay(new Date(e.createdAt), day));
      
      return {
        name: format(day, "dd"),
        fretes: dayFreights.reduce((acc, f) => acc + f.amount / 100, 0),
        despesas: dayExpenses.reduce((acc, e) => acc + e.amount / 100, 0),
      };
    });
  }, [freights, expenses]);

  const transporterStats = useMemo(() => {
    return transporters.map(t => {
      const tFreights = freights.filter(f => !f.canceled && f.transportId === t.id);
      return {
        name: t.name,
        value: tFreights.reduce((acc, f) => acc + f.amount / 100, 0),
      };
    }).filter(s => s.value > 0);
  }, [freights, transporters]);

  const handleShareLedger = () => {
    let message = `*Extrato Consolidado - Painel da Ana*\n`;
    message += `Data: ${format(new Date(), "dd/MM/yyyy")}\n\n`;
    message += `*Saldo a Receber:* ${formatCurrency(balance / 100)}\n`;
    message += `*Lucro Líquido:* ${formatCurrency(netProfit / 100)}\n\n`;
    message += `Transportadoras Ativas:\n`;
    
    transporters.filter(t => t.active).forEach(t => {
      const tFreights = freights.filter(f => !f.canceled && f.transportId === t.id);
      const total = tFreights.reduce((acc, f) => acc + f.amount, 0);
      message += `• ${t.name}: ${formatCurrency(total / 100)}\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-800 rounded-full" />
      </div>
    );
  }

  const timeline = [
    ...freights.map(f => ({ ...f, type: 'freight' as const })),
    ...payments.map(p => ({ ...p, type: 'payment' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  const handleAddTransporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransporter.name) return;
    await manageTransporter({
      ...newTransporter,
      textColor: newTransporter.color.replace('bg-', 'text-'),
      borderColor: newTransporter.color.replace('bg-', 'border-'),
    } as any);
    setNewTransporter({ name: '', color: 'bg-blue-600', icon: 'Truck' });
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newExpense.amount.replace(/\D/g, ""), 10);
    if (!newExpense.category || isNaN(amount)) return;
    await addExpense(newExpense.category, amount, newExpense.note);
    setNewExpense({ category: '', amount: '', note: '' });
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-slate-900 text-white p-8 shadow-2xl z-20 flex-shrink-0 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
        <div className="flex items-center space-x-4 mb-12 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <LayoutDashboard className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin</h1>
            <p className="text-blue-300 text-sm font-medium">Controle de Frota</p>
          </div>
        </div>

        <nav className="space-y-2 relative z-10">
          {[
            { id: 'extrato', icon: Activity, label: 'Extrato' },
            { id: 'relatorios', icon: BarChart3, label: 'Relatórios' },
            { id: 'transportadoras', icon: Users, label: 'Transportadoras' },
            { id: 'despesas', icon: Receipt, label: 'Despesas' }
          ].map(tab => (
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
          <Link href="/" className="flex items-center px-5 py-4 text-slate-400 hover:text-white font-bold transition-all pt-8">
            ← Ir para Lançamentos
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <p className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-2">Painel de Gestão</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight capitalize">
              {activeTab}
            </h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleShareLedger}
              className="px-6 py-4 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-[1.25rem] font-bold shadow-sm transition-all flex items-center active:scale-[0.98]"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </button>
            {activeTab === 'extrato' && (
              <Link 
                href="/acertar"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] font-bold shadow-lg transition-all flex items-center active:scale-[0.98]"
              >
                <ArrowDownRight className="w-6 h-6 mr-3" />
                Receber Pagamento
              </Link>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-6 border-l-4 border-blue-500">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Saldo a Receber</h3>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(balance / 100)}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-emerald-500">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Lucro Líquido</h3>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(netProfit / 100)}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-amber-500">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Fretes Brutos</h3>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(freights.reduce((acc, f) => acc + (f.canceled ? 0 : f.amount), 0) / 100)}</p>
          </div>
          <div className="glass-card p-6 border-l-4 border-red-500">
            <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">Despesas Totais</h3>
            <p className="text-2xl font-black text-red-600">{formatCurrency(expenses.reduce((acc, e) => acc + (e.canceled ? 0 : e.amount), 0) / 100)}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'extrato' && (
            <motion.div key="extrato" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[10px]">
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
                        <tr key={item.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", item.canceled && "opacity-40")}>
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
                            <span className="font-bold text-slate-700">{isFreight ? `Frete: ${transport?.name || '...'}` : isPayment ? 'Pagamento Recebido' : `Despesa: ${item.category}`}</span>
                            {item.note && <p className="text-xs text-slate-500">{item.note}</p>}
                          </td>
                          <td className={cn("p-4 text-right font-bold", isFreight ? "text-slate-800" : isPayment ? "text-emerald-600" : "text-red-600")}>
                            {isFreight ? "+" : "-"}{formatCurrency(item.amount / 100)}
                          </td>
                          <td className="p-4 text-center">
                            {!item.canceled && (
                              <button onClick={() => cancelRecord(item.type, item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'relatorios' && (
            <motion.div key="relatorios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                    Fluxo Diário (Mês Atual)
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="fretes" stroke="#3b82f6" strokeWidth={3} dot={false} name="Faturamento" />
                      <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={3} dot={false} name="Despesas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-card p-8 h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-500" />
                    Volume por Transportadora
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={transporterStats} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                        {transporterStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transportadoras' && (
            <motion.div key="transportadoras" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="glass-card p-8">
                <h3 className="font-bold text-slate-800 mb-6">Cadastrar Nova</h3>
                <form onSubmit={handleAddTransporter} className="flex flex-col md:flex-row gap-4">
                  <input type="text" placeholder="Nome" value={newTransporter.name} onChange={e => setNewTransporter({...newTransporter, name: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
                  <select value={newTransporter.icon} onChange={e => setNewTransporter({...newTransporter, icon: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none">
                    <option value="Truck">Caminhão</option>
                    <option value="Star">Estrela</option>
                    <option value="Sun">Sol</option>
                    <option value="Zap">Cometa</option>
                  </select>
                  <select value={newTransporter.color} onChange={e => setNewTransporter({...newTransporter, color: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none">
                    <option value="bg-blue-600">Azul</option>
                    <option value="bg-amber-600">Laranja</option>
                    <option value="bg-emerald-600">Verde</option>
                    <option value="bg-red-600">Vermelho</option>
                    <option value="bg-purple-600">Roxo</option>
                  </select>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Adicionar</button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {transporters.map(t => {
                  const Icon = ICONS[t.icon] || Truck;
                  return (
                    <div key={t.id} className="glass-card p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", t.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800">{t.name}</h4>
                      </div>
                      <button onClick={() => manageTransporter({ ...t, active: !t.active })} className={cn("p-2 rounded-lg transition-colors", t.active ? "text-emerald-500 hover:bg-emerald-50" : "text-slate-300 hover:bg-slate-100")}>
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
              <div className="glass-card p-8">
                <h3 className="font-bold text-slate-800 mb-6">Lançar Despesa</h3>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" placeholder="Categoria" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
                  <input type="text" placeholder="Valor (R$)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value.replace(/\D/g, "")})} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
                  <button type="submit" className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold">Lançar</button>
                </form>
              </div>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold tracking-widest border-b">
                      <th className="p-4">Data</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className={cn("border-b", e.canceled && "opacity-40")}>
                        <td className="p-4 text-sm">{format(new Date(e.createdAt), "dd/MM/yyyy")}</td>
                        <td className="p-4 font-bold">{e.category}</td>
                        <td className="p-4 text-right text-red-600 font-bold">{formatCurrency(e.amount / 100)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => cancelRecord('expense', e.id)} className="text-slate-300 hover:text-red-500">
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
    </div>
  );
}
