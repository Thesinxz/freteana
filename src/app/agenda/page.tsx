"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";
import {
  resolveTransporterIcon,
  resolveTransporterPalette,
} from "@/lib/transporter-styles";

export default function AgendaPage() {
  const { user } = useAuth();
  const {
    transporters,
    pickups,
    addPickup,
    togglePickupCompleted,
    cancelRecord,
  } = useLedger();

  const activeTransporters = transporters.filter((t) => t.active);
  const [transportId, setTransportId] = useState("");
  const [dateTimeStr, setDateTimeStr] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTransportId = transportId || activeTransporters[0]?.id || "";

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransportId) {
      toast.error("Selecione uma transportadora.");
      return;
    }
    if (!dateTimeStr) {
      toast.error("Selecione a data e o horário da coleta.");
      return;
    }

    const scheduledMs = new Date(dateTimeStr).getTime();
    if (isNaN(scheduledMs)) {
      toast.error("Data inválida.");
      return;
    }

    setSaving(true);
    try {
      const ok = await addPickup(selectedTransportId, scheduledMs, note.trim());
      if (ok) {
        setDateTimeStr("");
        setNote("");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCalendar = () => {
    window.location.href = "/api/calendar/auth";
  };

  const upcomingPickups = pickups.filter((p) => !p.completed);
  const completedPickups = pickups.filter((p) => p.completed);

  return (
    <AppShell
      title="Agenda de Coletas"
      subtitle="Agende retiradas e avise todos os aparelhos"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Nova Coleta + Google Calendar */}
        <div className="lg:col-span-5 space-y-4">
          <section className="clean-card p-5 space-y-4">
            <div className="pb-3 border-b border-[#EEF5F1]">
              <h2 className="text-base font-extrabold text-[#0F291E]">
                Agendar Nova Coleta
              </h2>
              <p className="text-xs text-[#648274]">
                Envia alerta Push imediato ao salvar
              </p>
            </div>

            <form onSubmit={handleCreatePickup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                  Transportadora
                </label>
                <select
                  value={selectedTransportId}
                  onChange={(e) => setTransportId(e.target.value)}
                  className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {activeTransporters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                  Data e Horário
                </label>
                <input
                  type="datetime-local"
                  value={dateTimeStr}
                  onChange={(e) => setDateTimeStr(e.target.value)}
                  className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#526D60] mb-1.5">
                  Observações (opcional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Retirar mercadoria às 14h"
                  rows={2}
                  className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm text-[#0F291E] placeholder:text-[#86A395] resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{saving ? "Salvando..." : "Salvar Coleta"}</span>
              </button>
            </form>
          </section>

          {!user?.calendarTokens && (
            <section className="clean-card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F291E]">
                    Google Calendar
                  </h3>
                  <p className="text-xs text-[#648274]">
                    Sincronize lembretes na sua agenda Google
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectCalendar}
                className="px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <span>Conectar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </section>
          )}
        </div>

        {/* Coluna Direita: Lista de Coletas */}
        <section className="lg:col-span-7 clean-card p-5 space-y-5">
          <div className="pb-3 border-b border-[#EEF5F1]">
            <h2 className="text-base font-extrabold text-[#0F291E]">
              Próximas Coletas ({upcomingPickups.length})
            </h2>
            <p className="text-xs text-[#648274]">
              Marque como concluída assim que realizar a retirada
            </p>
          </div>

          {upcomingPickups.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-[#A3BBAE] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#526D60]">
                Nenhuma coleta pendente.
              </p>
              <p className="text-xs text-[#86A395] mt-0.5">
                Use o formulário ao lado para agendar uma retirada.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingPickups.map((item) => {
                const transport = transporters.find(
                  (t) => t.id === item.transportId
                );
                const Icon = resolveTransporterIcon(transport?.icon);
                const palette = resolveTransporterPalette(transport?.color);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#F9FCFA] border border-[#E2ECE7] flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        style={{
                          backgroundColor: palette.softBg,
                          borderColor: palette.softBorder,
                          color: palette.iconText,
                        }}
                        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0F291E]">
                          {transport?.name || "Transportadora"}
                        </h4>
                        <p className="text-xs text-[#047857] font-semibold capitalize mt-0.5">
                          {format(
                            new Date(item.scheduledAt),
                            "EEEE, dd/MM 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </p>
                        {item.note && (
                          <p className="text-xs text-[#526D60] mt-2 bg-white border border-[#E6F0EB] px-3 py-1.5 rounded-lg">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          togglePickupCompleted(item.id, !item.completed)
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Feito</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelRecord("pickup", item.id)}
                        className="p-1.5 rounded-lg text-[#86A395] hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {completedPickups.length > 0 && (
            <div className="pt-4 border-t border-[#EEF5F1] space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7A9688]">
                Concluídas recentemente
              </h3>
              {completedPickups.slice(0, 5).map((item) => {
                const transport = transporters.find(
                  (t) => t.id === item.transportId
                );
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-xl bg-[#F4F8F6] border border-[#E6F0EB] flex items-center justify-between text-xs opacity-75"
                    )}
                  >
                    <span className="line-through font-medium text-[#526D60]">
                      {transport?.name || "Transportadora"} •{" "}
                      {format(new Date(item.scheduledAt), "dd/MM HH:mm")}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePickupCompleted(item.id, false)}
                      className="text-[#059669] font-bold hover:underline"
                    >
                      Reabrir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
