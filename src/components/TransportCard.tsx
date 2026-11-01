"use client";

import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  resolveTransporterIcon,
  resolveTransporterPalette,
} from "@/lib/transporter-styles";

interface TransportCardProps {
  config: {
    id: string;
    name: string;
    color: string;
    textColor?: string;
    borderColor?: string;
    icon: string;
  };
  value: string;
  onChange: (value: string) => void;
}

export function TransportCard({ config, value, onChange }: TransportCardProps) {
  const palette = resolveTransporterPalette(config.color);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    onChange(rawValue);
  };

  const getDisplayValue = () => {
    if (!value) return "";
    const num = parseInt(value, 10);
    if (isNaN(num) || num === 0) return "";
    return formatCurrency(num / 100).replace("R$", "").trim();
  };

  const hasValue = Boolean(value && parseInt(value, 10) > 0);

  return (
    <div
      className={cn(
        "p-3 rounded-2xl flex items-center justify-between gap-3 border transition-all",
        hasValue
          ? "bg-[#ECFDF5]/65 border-[#A7F3D0]"
          : "bg-[#F9FCFA] border-[#E6F0EB] hover:border-[#C6F0DC]"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{
            backgroundColor: palette.softBg,
            borderColor: palette.softBorder,
            color: palette.iconText,
          }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
        >
          {React.createElement(resolveTransporterIcon(config.icon), {
            className: "w-4.5 h-4.5",
          })}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-[#0F291E] truncate">
            {config.name}
          </div>
          <div className="text-xs text-[#648274] flex items-center gap-1.5">
            <span
              style={{ backgroundColor: palette.dot }}
              className="w-2 h-2 rounded-full inline-block"
            />
            <span>{hasValue ? "Pronto para salvar" : "Toque para lançar"}</span>
          </div>
        </div>
      </div>

      <div className="relative w-34 sm:w-36 shrink-0">
        <span
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none",
            hasValue ? "text-[#047857]" : "text-[#86A395]"
          )}
        >
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={getDisplayValue()}
          onChange={handleInputChange}
          placeholder="0,00"
          className={cn(
            "w-full rounded-xl py-2.5 pl-9 pr-3 text-base font-extrabold text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all",
            hasValue
              ? "bg-white border border-[#10B981] text-[#047857] shadow-xs"
              : "bg-white border border-[#DCE8E2] text-[#0F291E] placeholder:text-[#B4C7BD]"
          )}
        />
      </div>
    </div>
  );
}
