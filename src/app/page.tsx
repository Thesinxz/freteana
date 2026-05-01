"use client";

import { useLedger } from "@/hooks/useLedger";
import { TransportCard } from "@/components/TransportCard";
import { TRANSPORTERS } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, Save, ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function DashboardPage() {
  const { freights, balance, loading, addFreight } = useLedger();
  const router = useRouter();

  const [drafts, setDrafts] = useState<Record<string, string>>({
    estrella: "",
    sol: "",
    cometa: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Date picker state, defaults to today
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleDraftChange = (id: string, value: string) => {
    setDrafts(prev => ({ ...prev, [id]: value }));
  };

  const hasAnyDraft = Object.values(drafts).some(val => parseInt(val || "0", 10) > 0);

  const handleSaveAll = async () => {
    setIsSaving(true);
    let count = 0;
    
    // Parse selected date and create timestamp at 12:00 PM of that date to avoid timezone issues
    let customMs = Date.now();
    if (selectedDateStr) {
      const parsed = parseISO(selectedDateStr);
      parsed.setHours(12, 0, 0, 0);
      customMs = parsed.getTime();
    }

    try {
      for (const config of TRANSPORTERS) {
        const val = parseInt(drafts[config.id] || "0", 10);
        if (val > 0) {
          await addFreight(config.id, val, customMs);
          count++;
        }
      }
      if (count > 0) {
        toast.success(`${count} lançamento(s) salvo(s)!`);
        setDrafts({ estrella: "", sol: "", cometa: "" });
        
        // Confetti!
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
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin h-10 w-10 border-4 border-blue-400 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  // Date objects are used inside the grouping loop now

  const validFreights = freights.filter(f => !f.canceled).sort((a, b) => b.createdAt - a.createdAt);
  
  const groupedFreights = validFreights.reduce((acc, freight) => {
    // Add timezone offset to ensure the date aligns with local time representation
    const localDate = new Date(freight.createdAt);
    const dateStr = format(localDate, "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(freight);
    return acc;
  }, {} as Record<string, typeof freights>);
  
  const sortedDates = Object.keys(groupedFreights).sort((a, b) => b.localeCompare(a));
  const hasDebt = balance > 0;

  return (
    <div className="min-h-screen flex flex-col relative pb-32 overflow-x-hidden">
      {/* HeaderDay */}
      <header className="pt-safe px-4 pt-6 pb-8 relative z-10">
        <div className="glass-card p-6 overflow-hidden relative">
          {/* Decorative glows inside card */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                Painel da Ana
              </p>
              <h1 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h1>
            </div>
            <div className="flex space-x-2">
              <Link href="/admin" className="px-4 py-2 bg-slate-900/5 hover:bg-slate-900/10 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-sm">
                <span className="text-slate-800 font-bold text-sm">Admin</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[1.25rem] p-5 flex items-center justify-between shadow-2xl relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
            <div>
              <p className="text-sm text-slate-300 mb-1 font-medium">Saldo a Receber</p>
              <motion.p 
                key={balance}
                initial={{ scale: 1.1, color: "#6EE7B7" }}
                animate={{ scale: 1, color: "#FFFFFF" }}
                className="font-black text-3xl tracking-tight"
              >
                {formatCurrency(balance / 100)}
              </motion.p>
            </div>
            <div className={`p-3 rounded-full ${hasDebt ? 'bg-amber-400 text-amber-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 text-emerald-900 shadow-[0_0_15px_rgba(52,211,153,0.5)]'} transition-all`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 space-y-5 relative z-0">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-slate-800 font-bold text-lg tracking-tight">Novo Lançamento</h2>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white/60 backdrop-blur-md border border-white/60 text-slate-700 text-sm rounded-full px-4 py-1.5 font-bold shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {TRANSPORTERS.map((config) => (
            <TransportCard
              key={config.id}
              config={config}
              value={drafts[config.id]}
              onChange={(val) => handleDraftChange(config.id, val)}
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

        {/* Histórico Geral Agrupado por Data */}
        {sortedDates.length > 0 && (
          <div className="mt-10 mb-8 space-y-8">
            {sortedDates.map(dateStr => {
              const dayFreights = groupedFreights[dateStr];
              const dateObj = parseISO(dateStr);
              const isToday = isSameDay(dateObj, new Date());
              
              return (
                <motion.div 
                  key={dateStr}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h2 className="text-slate-800 font-bold ml-2 mb-4 tracking-tight">
                    Lançamentos de {isToday ? "Hoje" : format(dateObj, "dd/MM/yyyy", { locale: ptBR })}
                  </h2>
                  <div className="glass-card overflow-hidden divide-y divide-slate-100/50">
                    {dayFreights.map(freight => {
                      const transport = TRANSPORTERS.find(t => t.id === freight.transportId);
                      return (
                        <div key={freight.id} className="p-4 flex justify-between items-center hover:bg-white/40 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={cn("p-2.5 rounded-2xl text-white shadow-sm", transport?.color || "bg-slate-400")}>
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{transport?.name}</p>
                              <p className="text-xs text-slate-500 font-medium">{format(new Date(freight.createdAt), "HH:mm")}</p>
                            </div>
                          </div>
                          <span className="font-black text-lg text-slate-800 tracking-tight">
                            {formatCurrency(freight.amount / 100)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
