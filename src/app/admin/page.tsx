"use client";

import { useLedger } from "@/hooks/useLedger";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Truck, ArrowUpRight, ArrowDownRight, Activity, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { TRANSPORTERS } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const { freights, payments, balance, loading, cancelRecord } = useLedger();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-800 rounded-full" />
      </div>
    );
  }

  // Combine freights and payments into a single timeline
  const timeline = [
    ...freights.map(f => ({ ...f, type: 'freight' as const })),
    ...payments.map(p => ({ ...p, type: 'payment' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  // Estatísticas (somente ativos)
  const currentMonth = new Date().getMonth();
  const monthlyFreights = freights.filter(f => !f.canceled && new Date(f.createdAt).getMonth() === currentMonth);
  const totalMonthFreights = monthlyFreights.reduce((acc, f) => acc + f.amount, 0);

  const monthlyPayments = payments.filter(p => !p.canceled && new Date(p.createdAt).getMonth() === currentMonth);
  const totalMonthPayments = monthlyPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleCancel = async (type: 'freight' | 'payment', id: string) => {
    if (confirm("Tem certeza que deseja cancelar este registro? Ele não será apagado, mas deixará de contar no saldo.")) {
      await cancelRecord(type, id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-gradient-to-b from-slate-900 to-blue-950 text-white p-8 shadow-2xl z-10 flex-shrink-0 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
        <div className="flex items-center space-x-4 mb-12 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin</h1>
            <p className="text-blue-300 text-sm font-medium">Controle Financeiro</p>
          </div>
        </div>
        <nav className="space-y-3 relative z-10">
          <a href="#" className="block px-5 py-4 bg-white/10 rounded-2xl font-bold border border-white/10 shadow-inner">Extrato Geral</a>
          <a href="/" className="block px-5 py-4 hover:bg-white/5 rounded-2xl font-bold transition-colors text-blue-200">← Voltar para Painel</a>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <p className="text-blue-600 font-bold tracking-widest uppercase text-xs mb-2">Visão Geral</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">Conta Corrente</h2>
          </div>
          <Link 
            href="/acertar"
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-[1.25rem] font-bold shadow-[0_8px_30px_rgb(16,185,129,0.3)] transition-all flex items-center active:scale-[0.98] border border-emerald-400/30"
          >
            <ArrowDownRight className="w-6 h-6 mr-3" />
            Receber Pagamento
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-slate-900" />
            </div>
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Dívida Total (Saldo)</h3>
            <p className={cn("text-5xl font-black tracking-tighter", balance > 0 ? "text-slate-800" : "text-emerald-500")}>
              {formatCurrency(balance / 100)}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2 flex items-center">
              <ArrowUpRight className="w-4 h-4 text-amber-500 mr-2" />
              Fretes (Mês)
            </h3>
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalMonthFreights / 100)}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8"
          >
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2 flex items-center">
              <ArrowDownRight className="w-4 h-4 text-emerald-500 mr-2" />
              Recebimentos (Mês)
            </h3>
            <p className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalMonthPayments / 100)}</p>
          </motion.div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center tracking-tight">
            <Activity className="w-6 h-6 mr-3 text-blue-500" />
            Extrato de Movimentações
          </h3>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[10px]">
                    <th className="p-4 font-bold w-16"></th>
                    <th className="p-4 font-bold">Data/Hora</th>
                    <th className="p-4 font-bold">Descrição</th>
                    <th className="p-4 font-bold text-right">Valor</th>
                    <th className="p-4 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((item) => {
                    const isFreight = item.type === 'freight';
                    const transport = isFreight ? TRANSPORTERS.find(t => t.id === (item as any).transportId) : null;
                    const isCanceled = item.canceled;
                    
                    return (
                      <tr key={`${item.type}-${item.id}`} className={cn(
                        "border-b border-slate-50 transition-colors",
                        isCanceled ? "bg-slate-100 opacity-60" : "hover:bg-slate-50"
                      )}>
                        <td className="p-4 text-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                            isCanceled ? "bg-slate-300 text-slate-500" :
                            isFreight ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            {isFreight ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn("font-medium block", isCanceled ? "text-slate-500" : "text-slate-800")}>
                            {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.createdAt), "HH:mm")}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "font-bold block",
                              isCanceled ? "text-slate-500 line-through" : "text-slate-700"
                            )}>
                              {isFreight ? `Frete - ${transport?.name || 'Desconhecido'}` : 'Pagamento Recebido'}
                            </span>
                            {isCanceled && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase">
                                Cancelado
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <span className="text-xs text-slate-500">{item.note}</span>
                          )}
                        </td>
                        <td className={cn(
                          "p-4 text-right font-bold text-lg",
                          isCanceled ? "text-slate-400 line-through" :
                          isFreight ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {isFreight ? "+" : "-"}{formatCurrency(item.amount / 100)}
                        </td>
                        <td className="p-4 text-center">
                          {!isCanceled && (
                            <button
                              onClick={() => handleCancel(item.type, item.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Cancelar registro"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {timeline.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Nenhuma movimentação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
