"use client";

import { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Truck, Sun, Zap, Save, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TransportCardProps {
  config: {
    id: string;
    name: string;
    color: string;
    textColor: string;
    borderColor: string;
    icon: string;
  };
  value: string;
  onChange: (value: string) => void;
}

const ICONS: Record<string, React.ElementType> = {
  Truck,
  Sun,
  Zap,
  Star,
};


export function TransportCard({ config, value, onChange }: TransportCardProps) {
  const Icon = ICONS[config.icon] || Truck;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    onChange(rawValue);
  };

  const getDisplayValue = () => {
    if (!value) return "";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "";
    return formatCurrency(num / 100).replace('R$', '').trim();
  };

  return (
    <div className="glass-card p-4 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="flex items-center space-x-4 mb-4">
        <div className={cn("p-3 rounded-2xl text-white shadow-sm", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 tracking-tight">{config.name}</h3>
          <p className="text-xs text-slate-500 font-medium">Lançar valor</p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={getDisplayValue()}
          onChange={handleInputChange}
          placeholder="0,00"
          className={cn(
            "w-full bg-slate-50/50 border border-slate-200/60 rounded-[1rem] py-4 pl-12 pr-4 text-2xl font-black text-right focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-700",
            value ? "bg-white border-blue-200/80 shadow-inner" : "",
            config.textColor.replace('text-', 'focus:ring-').replace('-600', '-400').replace('-800', '-400')
          )}
        />
      </div>
    </div>
  );
}
