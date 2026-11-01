import React from "react";
import { Banknote, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Logo oficial do app "Controle de Frete" (Esmeralda & Gelo)
 */
export function ControleFreteLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-xs shrink-0",
        className
      )}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[64%] h-[64%]"
      >
        {/* Baú do caminhão */}
        <rect
          x="3"
          y="8"
          width="17"
          height="14"
          rx="3"
          fill="white"
        />
        {/* Check esmeralda dentro do baú */}
        <path
          d="M8.5 15.2L10.8 17.5L15.2 12.8"
          stroke="#059669"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cabine do caminhão */}
        <path
          d="M20 12H26.2C27.2 12 28.1 12.5 28.6 13.4L31.5 18.2C31.8 18.7 32 19.3 32 19.9V22H20V12Z"
          fill="white"
          fillOpacity="0.92"
        />
        {/* Janela da cabine */}
        <path
          d="M22.2 14.2H26L28.2 17.8H22.2V14.2Z"
          fill="#059669"
        />
        {/* Rodas */}
        <circle cx="10" cy="24.5" r="3.2" fill="white" />
        <circle cx="10" cy="24.5" r="1.4" fill="#059669" />
        <circle cx="25.5" cy="24.5" r="3.2" fill="white" />
        <circle cx="25.5" cy="24.5" r="1.4" fill="#059669" />
      </svg>
    </div>
  );
}

/**
 * Logo vetorial da Caixa Econômica Federal (bloco Azul Caixa #005CA9 com o X branco e Laranja #F37021)
 */
export function CaixaLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#005CA9] shadow-2xs flex items-center justify-center shrink-0",
        className
      )}
      title="Caixa Econômica Federal"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[68%] h-[68%]"
      >
        {/* Barra diagonal laranja da Caixa (/) */}
        <path
          d="M24.5 8.5H33.2L15.5 31.5H6.8L24.5 8.5Z"
          fill="#F37021"
        />
        {/* Braço superior esquerdo branco (\) com recorte paralelo exato */}
        <path
          d="M6.8 8.5H15.5L19.0 13.05L14.65 18.7L6.8 8.5Z"
          fill="#FFFFFF"
        />
        {/* Braço inferior direito branco (\) simétrico em 180° */}
        <path
          d="M33.2 31.5H24.5L21.0 26.95L25.35 21.3L33.2 31.5Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

/**
 * Logo vetorial do Nubank (bloco Roxo Nubank #820AD1 com o monograma "nu" branco oficial)
 */
export function NubankLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#820AD1] shadow-2xs flex items-center justify-center shrink-0",
        className
      )}
      title="Nubank"
    >
      <svg
        viewBox="0 0 44 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[74%] h-[74%]"
      >
        {/* Arco "n" */}
        <path
          d="M6.5 27.2V17.4C6.5 13.3 9.5 10.5 13.4 10.5C17.3 10.5 20.3 13.3 20.3 17.4V27.2"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        {/* Arco "u" */}
        <path
          d="M23.7 10.8V20.6C23.7 24.7 26.7 27.5 30.6 27.5C34.5 27.5 37.5 24.7 37.5 20.6V10.8"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Ícone automático para qualquer banco de recebimento
 */
export function BankIcon({
  bank,
  className = "w-8 h-8",
}: {
  bank?: string;
  className?: string;
}) {
  const normalized = (bank || "").toLowerCase();
  if (normalized.includes("caixa")) {
    return <CaixaLogo className={className} />;
  }
  if (normalized.includes("nubank") || normalized.includes("nu")) {
    return <NubankLogo className={className} />;
  }
  if (normalized.includes("dinheiro") || normalized.includes("espécie")) {
    return (
      <div
        className={cn(
          "rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0",
          className
        )}
      >
        <Banknote className="w-[52%] h-[52%]" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-[#526D60] flex items-center justify-center shrink-0",
        className
      )}
    >
      <Landmark className="w-[52%] h-[52%]" />
    </div>
  );
}
