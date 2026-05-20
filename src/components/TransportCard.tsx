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

// Tailwind Safelist (Ensures these dynamic classes are not purged):
// bg-blue-600 bg-blue-800 bg-emerald-600 bg-amber-600 bg-purple-600 bg-red-600 bg-pink-600 bg-slate-400
// text-blue-600 text-blue-800 text-emerald-600 text-amber-600 text-purple-600 text-red-600 text-pink-600 text-slate-400
// border-blue-600 border-blue-800 border-emerald-600 border-amber-600 border-purple-600 border-red-600 border-pink-600 border-slate-400

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


// Map Tailwind classes to actual hex colors as a fallback
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

export function TransportCard({ config, value, onChange }: TransportCardProps) {
  const iconKey = config.icon || 'Truck';
  const IconComponent = ICONS[iconKey] || ICONS[iconKey.charAt(0).toUpperCase() + iconKey.slice(1).toLowerCase()] || Truck;
  
  const bgColor = COLOR_MAP[config.color] || '#3b82f6';

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
    <motion.div 
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="glass-card p-5 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-white/85"
    >
      {/* Dynamic branding vertical stripe on the left */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-14 rounded-r-full transition-all duration-300 group-hover:h-16"
        style={{ backgroundColor: bgColor }}
      />

      <div className="flex items-center justify-between mb-4 pl-1">
        <div className="flex items-center space-x-3.5">
          <div 
            className="p-3 rounded-2xl text-white shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: bgColor }}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 tracking-tight text-[15px] group-hover:text-slate-900 transition-colors">{config.name}</h3>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Lançamento diário</p>
          </div>
        </div>

        {value && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] uppercase tracking-wider"
            style={{ backgroundColor: bgColor }}
          >
            Preenchido
          </motion.div>
        )}
      </div>

      <div className="relative pl-1">
        <span 
          className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-base transition-colors duration-300"
          style={{ color: value ? bgColor : '#94a3b8' }}
        >
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={getDisplayValue()}
          onChange={handleInputChange}
          placeholder="0,00"
          style={{ 
            boxShadow: value ? `0 0 20px rgba(${bgColor === '#2563eb' ? '37,99,235' : bgColor === '#059669' ? '5,150,105' : '148,163,184'}, 0.04)` : undefined,
            borderColor: value ? bgColor : undefined
          }}
          className={cn(
            "w-full bg-slate-50/50 border border-slate-200/50 rounded-[1.25rem] py-4 pl-12 pr-5 text-2xl font-black text-right focus:outline-none focus:ring-2 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300 shadow-inner",
            value ? "bg-white border-blue-200/80" : ""
          )}
        />
      </div>
    </motion.div>
  );
}
