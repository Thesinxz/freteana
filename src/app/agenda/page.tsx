"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Plus, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLedger } from "@/hooks/useLedger";
import { cn } from "@/lib/utils";

export default function AgendaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { transporters } = useLedger();
  
  const [events, setEvents] = useState([
    { id: 1, transportId: 'estrella', date: new Date(Date.now() + 86400000), note: "Retirar as 14h" }
  ]);

  const handleConnectCalendar = () => {
    window.location.href = "/api/calendar/auth";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-safe pb-safe">
      <header className="p-4 flex justify-between items-center bg-blue-900 text-white pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold ml-2">Agenda</h1>
        </div>
        <button 
          onClick={() => router.push("/agenda/novo")}
          className="bg-white/20 p-2 rounded-full backdrop-blur-md active:bg-white/30 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 p-4 -mt-2">
        {!user?.calendarTokens && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center mb-6">
            <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Conectar Calendário</h3>
            <p className="text-sm text-slate-500 mb-4">
              Sincronize com o Google Calendar para receber lembretes de coletas.
            </p>
            <button
              onClick={handleConnectCalendar}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md w-full active:scale-[0.98] transition-all"
            >
              Conectar Google Calendar
            </button>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Próximas Coletas</h2>
        
        <div className="space-y-3">
          {events.map((event) => {
            const transport = transporters.find(t => t.id === event.transportId);
            return (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4"
              >
                <div className={cn("p-3 rounded-xl text-white", transport?.color || 'bg-slate-400')}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{transport?.name || 'Transportadora'}</h4>
                  <p className="text-sm text-slate-500 capitalize">
                    {format(event.date, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {event.note && (
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg">
                      {event.note}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {events.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              Nenhuma coleta agendada.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
