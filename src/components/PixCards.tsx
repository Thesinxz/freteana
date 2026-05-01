"use client";

import { Copy, CheckCircle2 } from "lucide-react";
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
        <div 
          onClick={() => handleCopy("67984199182")}
          className="glass-card p-4 relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#005CA9]"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm border border-slate-100">
                <img 
                  src="https://logodownload.org/wp-content/uploads/2014/02/caixa-logo-0.png" 
                  alt="Caixa" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Caixa Econômica</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Telefone</p>
                <p className="text-sm font-black text-slate-700 mt-0.5">67 98419-9182</p>
              </div>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              copiedKey === "67984199182" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
            )}>
              {copiedKey === "67984199182" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Nubank */}
        <div 
          onClick={() => handleCopy("00082025169")}
          className="glass-card p-4 relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8A05BE]"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm border border-slate-100">
                <img 
                  src="https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-0-1.png" 
                  alt="Nubank" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-slate-800 leading-tight">Nubank</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">CPF</p>
                <p className="text-sm font-black text-slate-700 mt-0.5">000.820.251-69</p>
              </div>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              copiedKey === "00082025169" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600"
            )}>
              {copiedKey === "00082025169" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
