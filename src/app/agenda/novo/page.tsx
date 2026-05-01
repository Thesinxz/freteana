"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { TRANSPORTERS } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function NovaColetaPage() {
  const router = useRouter();
  const [transport, setTransport] = useState(TRANSPORTERS[0].id);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Por favor, selecione data e hora.");
      return;
    }

    setLoading(true);
    // Aqui seria chamada API real
    setTimeout(() => {
      setLoading(false);
      toast.success("Coleta agendada com sucesso!");
      router.push("/agenda");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-safe pb-safe">
      <header className="p-4 flex items-center mb-2 bg-white shadow-sm rounded-b-3xl">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-slate-800">Nova Coleta</h1>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <label className="text-sm font-bold text-slate-600 ml-1">Transportador</label>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <select 
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
                className="w-full p-4 bg-transparent focus:outline-none text-slate-800 font-medium"
              >
                {TRANSPORTERS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-bold text-slate-600 ml-1">Data e Hora</label>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <input 
                type="datetime-local" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-transparent focus:outline-none text-slate-800 font-medium"
                required
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-sm font-bold text-slate-600 ml-1">Observações (opcional)</label>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Retirar na porta dos fundos"
                className="w-full p-4 bg-transparent focus:outline-none text-slate-800 resize-none min-h-[100px]"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4"
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Coleta
                </>
              )}
            </button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
