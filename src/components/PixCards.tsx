"use client";

import { useState } from "react";
import { Check, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CaixaLogo, NubankLogo } from "@/components/BrandLogos";

const PIX_CARDS = [
  {
    id: "caixa",
    bank: "Caixa Econômica",
    badge: "TELEFONE",
    display: "67 98419-9182",
    raw: "67984199182",
    accentBorder: "hover:border-[#005CA9]/40",
    badgeClass: "bg-[#EEF6FC] text-[#005CA9] border-[#CBE2F6]",
    Logo: CaixaLogo,
  },
  {
    id: "nubank",
    bank: "Nubank",
    badge: "CPF",
    display: "000.820.251-69",
    raw: "00082025169",
    accentBorder: "hover:border-[#820AD1]/40",
    badgeClass: "bg-[#F5EEFC] text-[#820AD1] border-[#DFC7F7]",
    Logo: NubankLogo,
  },
];

export function PixCards() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (raw: string, bank: string, id: string) => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopiedId(id);
      toast.success(`Chave PIX da ${bank} copiada!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Não foi possível copiar a chave PIX.");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <QrCode className="w-4 h-4 text-[#059669]" />
        <h2 className="text-sm font-extrabold text-[#0F291E]">
          Minhas Chaves PIX
        </h2>
        <span className="text-xs text-[#648274]">
          • toque no cartão para copiar
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {PIX_CARDS.map((card) => {
          const isCopied = copiedId === card.id;
          const LogoComponent = card.Logo;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCopy(card.raw, card.bank, card.id)}
              className={cn(
                "clean-card p-4 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer",
                card.accentBorder,
                isCopied && "border-[#10B981] bg-[#ECFDF5]/60"
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <LogoComponent className="w-12 h-12" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#0F291E] truncate">
                      {card.bank}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-bold border",
                        card.badgeClass
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-base font-mono font-bold text-[#1E3A2F] mt-1 tracking-wide">
                    {card.display}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border transition-all",
                  isCopied
                    ? "bg-[#059669] text-white border-[#059669]"
                    : "bg-[#F4F8F6] text-[#047857] border-[#DCE8E2]"
                )}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
