"use client";

import { Copy, CheckCircle2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function PixCards() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (pixKey: string, bankName: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(pixKey);
    toast.success(`Chave PIX da ${bankName} copiada!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="mt-8 mb-6 px-2">
      <h2 className="text-slate-800 font-black text-lg tracking-tight mb-4 flex items-center">
        <Wallet className="w-5 h-5 mr-2 text-blue-600 animate-pulse" />
        Minhas Chaves PIX
      </h2>
      <div className="grid grid-cols-1 gap-4">
        
        {/* Caixa Econômica - Blue Gradient Metal Card */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCopy("67984199182", "Caixa")}
          className="relative overflow-hidden cursor-pointer rounded-[1.5rem] p-5 h-44 flex flex-col justify-between text-white shadow-[0_12px_35px_rgba(0,92,169,0.15)] bg-gradient-to-tr from-[#004884] via-[#005CA9] to-[#0090EA] border border-white/10"
        >
          {/* Card subtle shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Banco de Recebimento</p>
              <h3 className="font-extrabold text-lg tracking-tight mt-0.5">Caixa Econômica</h3>
            </div>
            <div className="h-6 w-auto bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-100">TELEFONE</span>
            </div>
          </div>

          {/* Micro-chip detail */}
          <div className="flex justify-between items-end z-10">
            <div>
              {/* Virtual Card Chip */}
              <div className="w-9 h-7 bg-amber-400/80 rounded-md mb-2 relative overflow-hidden flex flex-col justify-between p-1 border border-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                <div className="w-[1px] h-full bg-[#b45309]/30 absolute left-3 top-0" />
                <div className="w-[1px] h-full bg-[#b45309]/30 absolute left-6 top-0" />
                <div className="w-full h-[1px] bg-[#b45309]/30 absolute left-0 top-2.5" />
                <div className="w-full h-[1px] bg-[#b45309]/30 absolute left-0 top-4.5" />
                <div className="w-3 h-3 bg-amber-400 rounded-sm border border-amber-500/30 z-10 m-auto" />
              </div>
              <p className="text-xl font-mono font-bold tracking-widest text-slate-100">
                67 98419-9182
              </p>
            </div>

            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md",
              copiedKey === "67984199182" ? "bg-emerald-500 text-white" : "bg-white/15 backdrop-blur-md text-white hover:bg-white/25"
            )}>
              {copiedKey === "67984199182" ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : <Copy className="w-5 h-5" />}
            </div>
          </div>
        </motion.div>

        {/* Nubank - Purple Gradient Metal Card */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCopy("00082025169", "Nubank")}
          className="relative overflow-hidden cursor-pointer rounded-[1.5rem] p-5 h-44 flex flex-col justify-between text-white shadow-[0_12px_35px_rgba(138,5,190,0.15)] bg-gradient-to-tr from-[#530276] via-[#7504a5] to-[#9c18d4] border border-white/10"
        >
          {/* Card subtle shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Banco de Recebimento</p>
              <h3 className="font-extrabold text-lg tracking-tight mt-0.5">Nubank</h3>
            </div>
            <div className="h-6 w-auto bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-100">CPF</span>
            </div>
          </div>

          {/* Micro-chip detail */}
          <div className="flex justify-between items-end z-10">
            <div>
              {/* Virtual Card Chip */}
              <div className="w-9 h-7 bg-amber-400/80 rounded-md mb-2 relative overflow-hidden flex flex-col justify-between p-1 border border-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                <div className="w-[1px] h-full bg-[#b45309]/30 absolute left-3 top-0" />
                <div className="w-[1px] h-full bg-[#b45309]/30 absolute left-6 top-0" />
                <div className="w-full h-[1px] bg-[#b45309]/30 absolute left-0 top-2.5" />
                <div className="w-full h-[1px] bg-[#b45309]/30 absolute left-0 top-4.5" />
                <div className="w-3 h-3 bg-amber-400 rounded-sm border border-amber-500/30 z-10 m-auto" />
              </div>
              <p className="text-xl font-mono font-bold tracking-widest text-slate-100">
                000.820.251-69
              </p>
            </div>

            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md",
              copiedKey === "00082025169" ? "bg-emerald-500 text-white" : "bg-white/15 backdrop-blur-md text-white hover:bg-white/25"
            )}>
              {copiedKey === "00082025169" ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : <Copy className="w-5 h-5" />}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
