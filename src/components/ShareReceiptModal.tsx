"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLedger } from "@/hooks/useLedger";
import { generateReceiptCardImage } from "@/lib/receipt-image";
import { getDeviceName } from "@/lib/pwa-notifications";
import { cn, formatCurrency } from "@/lib/utils";

interface ShareReceiptModalProps {
  open: boolean;
  initialTransportId?: string;
  onClose: () => void;
}

function ShareReceiptContent({
  initialTransportId = "",
  onClose,
}: {
  initialTransportId?: string;
  onClose: () => void;
}) {
  const { pendingSummary, transporters } = useLedger();
  const [filterTransportId, setFilterTransportId] =
    useState(initialTransportId);
  const [renderedResult, setRenderedResult] = useState<{
    key: string;
    dataUrl: string;
    blob: Blob;
    fileName: string;
  } | null>(null);

  const activeTransporters = useMemo(
    () => transporters.filter((t) => t.active),
    [transporters]
  );

  const filteredItems = useMemo(() => {
    if (!filterTransportId) return pendingSummary.unpaidFreights;
    return pendingSummary.unpaidFreights.filter(
      (item) => item.transportId === filterTransportId
    );
  }, [pendingSummary.unpaidFreights, filterTransportId]);

  const filteredTotal = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.remainingAmount, 0),
    [filteredItems]
  );

  const filterTitle = useMemo(() => {
    if (!filterTransportId) return "Todas as Transportadoras";
    const found = transporters.find((t) => t.id === filterTransportId);
    return found?.name || "Transportadora";
  }, [filterTransportId, transporters]);

  const requestKey = `${filterTransportId}:${filteredTotal}:${filteredItems.length}`;
  const generating = renderedResult?.key !== requestKey;

  useEffect(() => {
    let active = true;

    generateReceiptCardImage({
      filterTitle,
      items: filteredItems,
      totalPending: filteredTotal,
      generatedBy: getDeviceName(),
    })
      .then((res) => {
        if (!active) return;
        setRenderedResult({
          key: requestKey,
          dataUrl: res.dataUrl,
          blob: res.blob,
          fileName: res.fileName,
        });
      })
      .catch((err) => {
        console.error("Failed to generate receipt card:", err);
      });

    return () => {
      active = false;
    };
  }, [requestKey, filterTitle, filteredItems, filteredTotal]);

  const handleShareImage = async () => {
    if (!renderedResult) return;

    try {
      const file = new File([renderedResult.blob], renderedResult.fileName, {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({
          title: `Controle de Frete • ${filterTitle}`,
          text: `Demonstrativo de fretes pendentes (${formatCurrency(filteredTotal / 100)})`,
          files: [file],
        });
        toast.success("Card compartilhado com sucesso!");
        return;
      }

      const link = document.createElement("a");
      link.href = renderedResult.dataUrl;
      link.download = renderedResult.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Imagem salva! Agora é só anexar no WhatsApp.");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error("Não foi possível compartilhar a imagem.");
      }
    }
  };

  const handleDownloadImage = () => {
    if (!renderedResult) return;
    const link = document.createElement("a");
    link.href = renderedResult.dataUrl;
    link.download = renderedResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagem baixada com sucesso!");
  };

  const handleShareWhatsAppText = () => {
    if (filteredItems.length === 0) {
      toast.info("Nenhum frete pendente neste filtro.");
      return;
    }

    const todayStr = format(new Date(), "dd/MM/yyyy");
    let message = `*Demonstrativo de Fretes Pendentes — ${todayStr}*\n`;
    message += `_${filterTitle}_\n\n`;

    filteredItems.forEach((f) => {
      const dStr = format(new Date(f.createdAt), "dd/MM/yyyy");
      message += `• *${f.transportName}* (${dStr}): ${formatCurrency(f.remainingAmount / 100)}\n`;
    });

    message += `\n*Total Pendente a Receber: ${formatCurrency(filteredTotal / 100)}*`;
    message += `\n\n*Chaves para Pagamento PIX:*\n`;
    message += `• Caixa (Telefone): \`67 98419-9182\`\n`;
    message += `• Nubank (CPF): \`000.820.251-69\``;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 36, scale: 0.98 }}
      className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white border border-[#DCE8E2] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
            <ImageIcon className="w-3.5 h-3.5" />
            Cobrança &amp; Demonstrativo
          </span>
          <h2 className="text-lg font-extrabold text-[#0F291E] mt-1.5">
            Enviar Card de Fretes Pendentes
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full text-[#648274] hover:bg-[#F4F8F6] hover:text-[#0F291E]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filtro por Transportadora */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterTransportId("")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
            filterTransportId === ""
              ? "bg-[#059669] text-white border-[#059669]"
              : "bg-[#F4F8F6] text-[#526D60] border-[#DCE8E2] hover:bg-[#ECFDF5]"
          )}
        >
          Todas ({formatCurrency(pendingSummary.totalPending / 100)})
        </button>

        {activeTransporters.map((t) => {
          const summary = pendingSummary.byTransporter.find(
            (item) => item.transporter.id === t.id
          );
          const pendingVal = summary?.pendingAmount || 0;
          const active = filterTransportId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilterTransportId(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                active
                  ? "bg-[#059669] text-white border-[#059669]"
                  : "bg-[#F4F8F6] text-[#526D60] border-[#DCE8E2] hover:bg-[#ECFDF5]"
              )}
            >
              {t.name} ({formatCurrency(pendingVal / 100)})
            </button>
          );
        })}
      </div>

      {/* Preview da Imagem Gerada */}
      <div className="rounded-2xl bg-[#F4F8F6] border border-[#DCE8E2] p-3 flex items-center justify-center min-h-56">
        {generating || !renderedResult ? (
          <div className="py-12 flex flex-col items-center gap-2 text-xs font-semibold text-[#648274]">
            <span className="animate-spin h-7 w-7 border-3 border-[#C6F0DC] border-t-[#059669] rounded-full" />
            <span>Montando card em alta definição...</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={renderedResult.dataUrl}
            alt="Demonstrativo de Fretes Pendentes"
            className="w-full max-h-88 object-contain rounded-xl shadow-xs"
          />
        )}
      </div>

      {/* Botões de Compartilhamento */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleShareImage}
            disabled={generating || !renderedResult}
            className="h-12 px-4 rounded-2xl bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Enviar Imagem (WhatsApp)</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsAppText}
            className="h-12 px-4 rounded-2xl bg-[#ECFDF5] hover:bg-[#D1FAE5] active:scale-[0.99] text-[#047857] border border-[#A7F3D0] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Enviar Texto (WhatsApp)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadImage}
          disabled={generating || !renderedResult}
          className="w-full h-10 rounded-xl bg-[#F4F8F6] hover:bg-[#E6F0EB] text-[#526D60] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Imagem PNG no Aparelho</span>
        </button>
      </div>
    </motion.div>
  );
}

export function ShareReceiptModal({
  open,
  initialTransportId = "",
  onClose,
}: ShareReceiptModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F291E]/30 backdrop-blur-xs"
          />
          <ShareReceiptContent
            key={`receipt-${initialTransportId}`}
            initialTransportId={initialTransportId}
            onClose={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
