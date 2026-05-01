"use client";

import { Copy, Landmark, Wallet, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PixCards() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(pixKey);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="mt-8 mb-4 px-2">
      <h2 className="text-slate-800 font-bold text-lg tracking-tight mb-4 flex items-center">
        Minhas Chaves PIX
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Caixa Econômica */}
        <div className="glass-card p-4 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#005CA9]"></div>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#005CA9]/10 text-[#005CA9] flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Caixa Econômica</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Telefone</p>
                <p className="text-sm font-medium text-slate-700 mt-1">67 98419-9182</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopy("67984199182")}
              className={cn(
                "p-2 rounded-lg transition-all",
                copiedKey === "67984199182" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              {copiedKey === "67984199182" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nubank */}
        <div className="glass-card p-4 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8A05BE]"></div>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A05BE]/10 text-[#8A05BE] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Nubank</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">CPF</p>
                <p className="text-sm font-medium text-slate-700 mt-1">000.820.251-69</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopy("00082025169")}
              className={cn(
                "p-2 rounded-lg transition-all",
                copiedKey === "00082025169" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-purple-50 hover:text-purple-600"
              )}
            >
              {copiedKey === "00082025169" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
