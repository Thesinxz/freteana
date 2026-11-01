"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { AppShell } from "@/components/AppShell";

export default function NovaColetaPage() {
  const router = useRouter();
  const { transporters, addPickup } = useLedger();
  const activeTransporters = transporters.filter((t) => t.active);

  const [transportId, setTransportId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTransportId = transportId || activeTransporters[0]?.id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Por favor, selecione data e hora.");
      return;
    }

    setLoading(true);
    try {
      const ok = await addPickup(
        selectedTransportId,
        new Date(date).getTime(),
        note.trim()
      );
      if (ok) {
        router.push("/agenda");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Nova Coleta" subtitle="Agendar retirada de mercadoria">
      <div className="max-w-lg mx-auto clean-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#526D60] mb-1.5">
              Transportadora
            </label>
            <select
              value={selectedTransportId}
              onChange={(e) => setTransportId(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
              Data e Hora
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-sm font-semibold text-[#0F291E] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
              placeholder="Ex: Retirar na porta dos fundos"
              rows={3}
              className="w-full p-3.5 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-sm text-[#0F291E] resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Salvando..." : "Salvar Coleta"}</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}
