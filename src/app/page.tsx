"use client";

import { useLedger } from "@/hooks/useLedger";
import { TransportCard } from "@/components/TransportCard";
import { PixCards } from "@/components/PixCards";
import { SwipeableItem } from "@/components/SwipeableItem";
import { formatCurrency, cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  Save, 
  ArrowUpRight, 
  Plus, 
  Sparkles, 
  Share2, 
  LayoutDashboard,
  Home,
  Truck,
  Sun,
  Zap,
  Star,
  CheckCircle2,
  Landmark,
  ArrowDownRight,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const ICONS: Record<string, React.ElementType> = {
  Truck,
  Caminhão: Truck,
  Sun,
  Sol: Sun,
  Zap,
  Cometa: Zap,
  Star,
  Estrela: Star,
};

export default function DashboardPage() {
  const { freights, payments, balance, netProfit, transporters, loading, addFreight, cancelRecord } = useLedger();
  const router = useRouter();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'balance' | 'profit'>('balance');
  
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleDraftChange = (id: string, value: string) => {
    setDrafts(prev => ({ ...prev, [id]: value }));
  };

  const handleShare = (dateStr: string, dayFreights: any[]) => {
    const dateObj = parseISO(dateStr);
    const dateFormatted = format(dateObj, "dd/MM/yyyy");
    let message = `*Resumo de Fretes - ${dateFormatted}*\n\n`;
    
    let totalDay = 0;
    dayFreights.forEach((f: any) => {
      const t = transporters.find(trans => trans.id === f.transportId);
      message += `• ${t?.name || 'Transportadora'}: ${formatCurrency(f.amount / 100)}\n`;
      totalDay += f.amount;
    });
    
    message += `\n*Total do Dia: ${formatCurrency(totalDay / 100)}*`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareAll = () => {
    let message = `*Resumo Geral de Lançamentos*\n\n`;
    let grandTotal = 0;

    sortedDates.forEach(dateStr => {
      const dayItems = groupedTimeline[dateStr];
      const dayFreights = dayItems.filter(i => i.type === 'freight');
      const dayPayments = dayItems.filter(i => i.type === 'payment');
      
      if (dayFreights.length === 0 && dayPayments.length === 0) return;

      const dateObj = parseISO(dateStr);
      const dateFormatted = format(dateObj, "dd/MM/yyyy");
      
      message += `*--- ${dateFormatted} ---*\n`;
      let totalDay = 0;
      dayFreights.forEach((f: any) => {
        const t = transporters.find(trans => trans.id === f.transportId);
        message += `• ${t?.name || 'Transportadora'}: ${formatCurrency(f.amount / 100)}\n`;
        totalDay += f.amount;
      });
      
      dayPayments.forEach((p: any) => {
        message += `• RECEBIMENTO (${p.bank || 'Outro'}): -${formatCurrency(p.amount / 100)}\n`;
        totalDay -= p.amount;
      });

      message += `*Saldo do dia: ${formatCurrency(totalDay / 100)}*\n\n`;
      grandTotal += totalDay;
    });
    
    message += `*TOTAL GERAL: ${formatCurrency(grandTotal / 100)}*`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareUnpaid = () => {
    // 1. Gather non-canceled freights and sort oldest first for correct FIFO settlement
    const activeFreights = [...freights]
      .filter(f => !f.canceled)
      .sort((a, b) => a.createdAt - b.createdAt);

    // 2. Gather non-canceled payments
    const activePayments = payments.filter(p => !p.canceled);
    let totalPaid = activePayments.reduce((acc, p) => acc + p.amount, 0);

    // 3. Subtract paid freights using FIFO logic
    const unpaidFreights: { transportName: string; date: number; amount: number }[] = [];

    activeFreights.forEach(freight => {
      const transport = transporters.find(t => t.id === freight.transportId);
      const transportName = transport ? transport.name : "Transportadora";

      if (totalPaid >= freight.amount) {
        totalPaid -= freight.amount;
      } else if (totalPaid > 0) {
        const unpaidAmount = freight.amount - totalPaid;
        totalPaid = 0;
        unpaidFreights.push({
          transportName,
          date: freight.createdAt,
          amount: unpaidAmount
        });
      } else {
        unpaidFreights.push({
          transportName,
          date: freight.createdAt,
          amount: freight.amount
        });
      }
    });

    if (unpaidFreights.length === 0) {
      toast.success("Tudo pago! Nenhum lançamento pendente de pagamento.");
      return;
    }

    const dateFormatted = format(new Date(), "dd/MM/yyyy");
    let message = `*Resumo de Lançamentos Pendentes - ${dateFormatted}*\n\n`;
    let totalPending = 0;

    unpaidFreights.forEach(f => {
      const dateStr = format(new Date(f.date), "dd/MM/yyyy HH:mm");
      message += `• *${f.transportName}* (${dateStr}): ${formatCurrency(f.amount / 100)}\n`;
      totalPending += f.amount;
    });

    message += `\n*Total Pendente a Receber: ${formatCurrency(totalPending / 100)}*`;
    message += `\n\n*Chaves para Pagamento PIX:*\n`;
    message += `• Nubank (CPF): \`000.820.251-69\`\n`;
    message += `• Caixa (Telefone): \`67 98419-9182\``;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const hasAnyDraft = Object.values(drafts).some(val => parseInt(val || "0", 10) > 0);

  const handleSaveAll = async () => {
    setIsSaving(true);
    let count = 0;
    
    let customMs = Date.now();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    if (selectedDateStr && selectedDateStr !== todayStr) {
      const parsed = parseISO(selectedDateStr);
      parsed.setHours(12, 0, 0, 0);
      customMs = parsed.getTime();
    }

    try {
      for (const transport of transporters) {
        const val = parseInt(drafts[transport.id] || "0", 10);
        if (val > 0) {
          await addFreight(transport.id, val, customMs);
          count++;
        }
      }
      if (count > 0) {
        toast.success(`${count} lançamento(s) salvo(s)!`);
        setDrafts({});
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#3B82F6', '#10B981', '#F59E0B']
        });
      }
    } catch (err) {
      toast.error("Erro ao salvar lançamentos.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  type TimelineItem = {
    id: string;
    amount: number;
    createdAt: number;
    type: 'freight' | 'payment';
    transportId?: string;
    bank?: string;
    note?: string;
  };

  const validFreights: TimelineItem[] = freights.filter(f => !f.canceled).map(f => ({ ...f, type: 'freight' }));
  const validPayments: TimelineItem[] = payments.filter(p => !p.canceled).map(p => ({ ...p, type: 'payment' }));
  
  const timelineItems = [...validFreights, ...validPayments].sort((a, b) => b.createdAt - a.createdAt);

  const groupedTimeline = timelineItems.reduce((acc, item) => {
    const localDate = new Date(item.createdAt);
    const dateStr = format(localDate, "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);
  
  const sortedDates = Object.keys(groupedTimeline).sort((a, b) => b.localeCompare(a));
  const hasDebt = balance > 0;
  return (
    <div className="min-h-screen flex justify-center bg-slate-100/40 relative">
      {/* Background decorations for desktop viewports */}
      <div className="hidden lg:block absolute top-10 left-10 max-w-xs text-slate-800 pointer-events-none">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 rounded-xl bg-blue-600 text-white font-black text-xs">FA</div>
          <h2 className="font-extrabold text-lg tracking-tight">Frete Ana</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Controle e conciliação de fretes de forma mobile, simples e direta.</p>
      </div>
      
      <div className="hidden lg:block absolute bottom-10 right-10 max-w-sm pointer-events-none text-right">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Status do PWA</p>
        <p className="text-sm text-emerald-600 font-extrabold flex items-center justify-end">
          <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
          Conectado & Notificações Ativas
        </p>
      </div>

      {/* Centered Device Container */}
      <div className="w-full max-w-md bg-slate-50/70 min-h-screen flex flex-col relative pb-32 shadow-[0_0_50px_rgba(0,0,0,0.02)] border-x border-slate-200/50 backdrop-blur-3xl overflow-x-hidden">
      <header className="pt-safe px-4 pt-6 pb-6 relative z-10">
        <div className="glass-card p-6 overflow-hidden relative border border-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.03)] bg-white/75 backdrop-blur-2xl">
          {/* Animated Glowing Ambient Blobs in header */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500 animate-pulse" />
                Painel Administrativo
              </p>
              <h1 className="text-xl font-black text-slate-800 capitalize tracking-tight flex items-center">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative group cursor-pointer">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-[13px] shadow-[0_4px_15px_rgba(79,70,229,0.3)] border border-white/60 transition-transform duration-300 group-hover:scale-105 active:scale-95">
                  AN
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* Premium Metallic Card Toggle */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-[1.5rem] p-5.5 flex items-center justify-between shadow-[0_20px_50px_rgba(30,27,75,0.25)] relative z-10 overflow-hidden cursor-pointer border border-white/10"
            onClick={() => setViewMode(prev => prev === 'balance' ? 'profit' : 'balance')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
            <div>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
                  {viewMode === 'balance' ? 'Saldo a Receber' : 'Lucro Líquido'}
                </p>
              </div>
              <motion.p 
                key={viewMode === 'balance' ? balance : netProfit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-black text-3xl tracking-tight text-white leading-none font-sans"
              >
                {formatCurrency((viewMode === 'balance' ? balance : netProfit) / 100)}
              </motion.p>
            </div>
            <div className={`p-3.5 rounded-2xl ${hasDebt ? 'bg-amber-400/90 text-amber-950 shadow-[0_0_20px_rgba(251,191,36,0.35)]' : 'bg-emerald-400/90 text-emerald-950 shadow-[0_0_20px_rgba(52,211,153,0.35)]'} transition-all duration-300`}>
              <DollarSign className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
          </motion.div>

          <div className="mt-5 flex gap-3 relative z-10">
            <Link 
              href="/acertar"
              className="flex-1 h-12 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/50 rounded-2xl flex items-center justify-center font-bold text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.04)] active:scale-[0.97] transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Dar Baixa
            </Link>
            <button 
              onClick={handleShareUnpaid}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl flex items-center justify-center font-bold shadow-[0_8px_25px_rgba(37,99,235,0.22)] active:scale-[0.97] transition-all text-xs border border-blue-400/20"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Enviar Pendentes
            </button>
          </div>

        </div>
      </header>


      <main className="flex-1 px-4 space-y-5 relative z-0">
        <div className="flex justify-between items-center px-2">
          <div>
            <h2 className="text-slate-800 font-black text-lg tracking-tight">Novo Lançamento</h2>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Lançar na caderneta</p>
          </div>
          <div className="relative flex items-center bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl px-3 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-500 mr-2" />
            <input 
              type="date" 
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-black focus:outline-none transition-all cursor-pointer"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {transporters.filter(t => t.active).map((transport) => (
            <TransportCard
              key={transport.id}
              config={transport}
              value={drafts[transport.id] || ""}
              onChange={(val) => handleDraftChange(transport.id, val)}
            />
          ))}
        </div>

        <AnimatePresence>
          {hasAnyDraft && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pt-4"
            >
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-[1.25rem] font-bold text-lg shadow-[0_8px_30px_rgb(37,99,235,0.3)] flex items-center justify-center transition-all disabled:opacity-50 border border-blue-400/30"
              >
                {isSaving ? (
                  <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar na Caderneta
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <PixCards />

        {sortedDates.length > 0 && (
          <div className="mt-10 mb-8 space-y-8">
            <div className="flex justify-between items-center px-2 mb-2">
              <h2 className="text-slate-800 font-bold text-lg tracking-tight">Histórico</h2>
              <button 
                onClick={handleShareAll}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full transition-colors flex items-center text-sm font-bold shadow-sm active:scale-95 hover:bg-blue-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar Tudo
              </button>
            </div>
            {sortedDates.map(dateStr => {
              const dayItems = groupedTimeline[dateStr];
              const dateObj = parseISO(dateStr);
              const isToday = isSameDay(dateObj, new Date());
              
              return (
                <motion.div 
                  key={dateStr}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-between items-center mb-4 px-2">
                    <h2 className="text-slate-800 font-bold tracking-tight">
                      Lançamentos de {isToday ? "Hoje" : format(dateObj, "dd/MM/yyyy", { locale: ptBR })}
                    </h2>
                    <button 
                      onClick={() => handleShare(dateStr, dayItems.filter(i => i.type === 'freight'))}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors flex items-center text-xs font-bold"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Compartilhar
                    </button>
                  </div>
                  <div className="glass-card overflow-hidden divide-y divide-slate-100/50">
                    {dayItems.map(item => {
                      if (item.type === 'payment') {
                        return (
                          <SwipeableItem
                            key={item.id}
                            onDelete={() => cancelRecord('payment', item.id)}
                            confirmTitle={`Deseja cancelar o pagamento de ${formatCurrency(item.amount / 100)}?`}
                          >
                            <div className="p-4 flex justify-between items-center hover:bg-white/40 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="p-2.5 rounded-2xl text-emerald-600 bg-emerald-100 shadow-sm flex items-center justify-center">
                                  <ArrowDownRight className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">Pagamento Recebido</p>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-xs text-slate-500 font-medium">{format(new Date(item.createdAt), "HH:mm")}</p>
                                    {item.bank && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <p className="text-xs font-semibold text-emerald-600 flex items-center">
                                          <Landmark className="w-3 h-3 mr-1" />
                                          {item.bank}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="font-black text-lg text-emerald-600 tracking-tight">
                                  - {formatCurrency(item.amount / 100)}
                                </span>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Deseja cancelar o pagamento de ${formatCurrency(item.amount / 100)}?`)) {
                                      cancelRecord('payment', item.id);
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                                  title="Cancelar Lançamento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </SwipeableItem>
                        );
                      }

                      // Freight item
                      const transport = transporters.find(t => t.id === item.transportId);
                      const iconKey = transport?.icon || 'Truck';
                      const TransportIcon = ICONS[iconKey] || ICONS[iconKey.charAt(0).toUpperCase() + iconKey.slice(1).toLowerCase()] || Truck;
                      
                      const COLOR_MAP: Record<string, string> = {
                        'bg-blue-600': '#2563eb',
                        'bg-blue-800': '#1e40af',
                        'bg-emerald-600': '#059669',
                        'bg-amber-600': '#d97706',
                        'bg-purple-600': '#9333ea',
                        'bg-red-600': '#dc2626',
                        'bg-pink-600': '#db2777',
                        'bg-slate-400': '#94a3b8',
                      };
                      const bgColor = transport?.color ? (COLOR_MAP[transport.color] || '#3b82f6') : '#94a3b8';

                      return (
                        <SwipeableItem
                          key={item.id}
                          onDelete={() => cancelRecord('freight', item.id)}
                          confirmTitle={`Deseja cancelar o frete de ${formatCurrency(item.amount / 100)} (${transport?.name || 'Transportadora'})?`}
                        >
                          <div className="p-4 flex justify-between items-center hover:bg-white/40 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div 
                                className="p-2.5 rounded-2xl text-white shadow-sm flex items-center justify-center"
                                style={{ backgroundColor: bgColor }}
                              >
                                <TransportIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{transport?.name || '...'}</p>
                                <p className="text-xs text-slate-500 font-medium">{format(new Date(item.createdAt), "HH:mm")}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-black text-lg text-slate-800 tracking-tight">
                                {formatCurrency(item.amount / 100)}
                              </span>
                              <button 
                                onClick={() => {
                                  if (confirm(`Deseja cancelar o frete de ${formatCurrency(item.amount / 100)} (${transport?.name || 'Transportadora'})?`)) {
                                    cancelRecord('freight', item.id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                                title="Cancelar Lançamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </SwipeableItem>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="flex fixed bottom-0 max-w-md w-full left-1/2 -translate-x-1/2 bg-white/85 backdrop-blur-md border-t border-slate-100/85 flex justify-around items-center p-2.5 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.03)] pb-safe">
        <button 
          onClick={() => router.push("/")}
          className="flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl text-blue-600 bg-blue-50/80 transition-all font-semibold"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Início</span>
        </button>
        <button 
          onClick={() => router.push("/agenda")}
          className="flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl text-slate-400 hover:text-slate-700 transition-all"
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Agenda</span>
        </button>
        <button 
          onClick={() => router.push("/admin")}
          className="flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl text-slate-400 hover:text-slate-700 transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Gestão</span>
        </button>
      </nav>

      </div>
    </div>
  );
}
