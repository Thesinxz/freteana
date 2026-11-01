"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  PlusSquare,
  Share,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  canUseNotifications,
  getIOSVersion,
  getNotificationPermissionState,
  isIOS,
  isStandalone,
  registerServiceWorker,
  requestNotificationPermission,
  sendTestPushNotification,
  syncPushSubscription,
} from "@/lib/pwa-notifications";
import { toast } from "sonner";

export function PwaNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showIOSIncompatible, setShowIOSIncompatible] = useState(false);
  const [permissionState, setPermissionState] = useState<string>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void registerServiceWorker();

    const init = async () => {
      const iosDevice = isIOS();
      const standalone = isStandalone();
      const dismissedNotif = localStorage.getItem("pwa-notif-prompt-dismissed");
      const dismissedIOS = localStorage.getItem("pwa-ios-guide-dismissed");
      const dismissedIncompatible = localStorage.getItem(
        "pwa-ios-incompatible-dismissed"
      );

      if (iosDevice && !standalone) {
        if (dismissedIOS !== "true") {
          setTimeout(() => setShowIOSInstallGuide(true), 1200);
        }
        return;
      }

      if (iosDevice && standalone) {
        const version = getIOSVersion();
        if (
          version > 0 &&
          version < 16.4 &&
          dismissedIncompatible !== "true"
        ) {
          setTimeout(() => setShowIOSIncompatible(true), 1200);
          return;
        }
      }

      if (canUseNotifications()) {
        const state = await getNotificationPermissionState();
        setPermissionState(state);

        if (state === "granted") {
          // Crucial: ensure existing permitted devices register/refresh their Web Push endpoint!
          await syncPushSubscription();
        } else if (state === "default" && dismissedNotif !== "true") {
          setTimeout(() => setShowPrompt(true), 1500);
        }
      }
    };

    void init();

    const handleOpenDialog = async () => {
      if (isIOS() && !isStandalone()) {
        setShowIOSInstallGuide(true);
        return;
      }
      if (isIOS() && isStandalone()) {
        const version = getIOSVersion();
        if (version > 0 && version < 16.4) {
          setShowIOSIncompatible(true);
          return;
        }
      }
      const state = await getNotificationPermissionState();
      setPermissionState(state);

      if (state === "granted") {
        toast.info("Enviando notificação de teste...");
        const ok = await sendTestPushNotification();
        if (ok) {
          toast.success("Notificação de teste enviada!");
        }
      } else if (state === "denied") {
        toast.error(
          "As notificações estão bloqueadas nas configurações do navegador/aparelho. Libere nas configurações do site para receber alertas."
        );
      } else {
        setShowPrompt(true);
      }
    };

    window.addEventListener("freteana:open-notif-settings", handleOpenDialog);
    return () => {
      window.removeEventListener(
        "freteana:open-notif-settings",
        handleOpenDialog
      );
    };
  }, []);

  const handleEnableNotifications = async () => {
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      setPermissionState(result);
      setShowPrompt(false);
      if (result === "granted") {
        toast.success("Alertas ativados com sucesso!");
      } else if (result === "denied") {
        toast.error("Permissão negada no navegador.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismissPrompt = () => {
    localStorage.setItem("pwa-notif-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  const handleDismissIOSGuide = () => {
    localStorage.setItem("pwa-ios-guide-dismissed", "true");
    setShowIOSInstallGuide(false);
  };

  const handleDismissIncompatible = () => {
    localStorage.setItem("pwa-ios-incompatible-dismissed", "true");
    setShowIOSIncompatible(false);
  };

  return (
    <AnimatePresence>
      {/* 1. Guia de Instalação iOS (Clean Esmeralda & Gelo) */}
      {showIOSInstallGuide && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          className="fixed bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-[0_16px_45px_rgba(5,150,105,0.14)]">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Alertas no iPhone
                  </span>
                  <h3 className="text-base font-extrabold text-[#0F291E]">
                    Adicione à Tela de Início
                  </h3>
                </div>
              </div>
              <button
                onClick={handleDismissIOSGuide}
                className="p-1.5 rounded-full text-[#648274] hover:bg-emerald-50 hover:text-[#0F291E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#526D60] mt-3 leading-relaxed">
              No iPhone, o Apple Push funciona assim que o app é salvo na tela inicial:
            </p>

            <div className="mt-3 space-y-2 text-xs bg-[#F4F8F6] border border-[#DCE8E2] p-3.5 rounded-2xl">
              <div className="flex items-center gap-2.5 text-[#1E3A2F]">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <span>
                  Toque em <strong>Compartilhar</strong>{" "}
                  <Share className="w-3.5 h-3.5 inline text-emerald-600" /> no Safari.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[#1E3A2F]">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <span>
                  Escolha <strong>Adicionar à Tela de Início</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" />.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[#1E3A2F]">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <span>Abra pelo novo ícone e toque em <strong>Ativar Alertas</strong>!</span>
              </div>
            </div>

            <button
              onClick={handleDismissIOSGuide}
              className="mt-4 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-sm"
            >
              Entendi
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Aviso iOS Antigo */}
      {showIOSIncompatible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          className="fixed bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-700">
                    Atualização do iOS
                  </span>
                  <h3 className="text-sm font-extrabold text-[#0F291E]">
                    Requer iOS 16.4 ou superior
                  </h3>
                </div>
              </div>
              <button
                onClick={handleDismissIncompatible}
                className="p-1.5 rounded-full text-[#648274] hover:bg-amber-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#526D60] mt-3 leading-relaxed">
              Atualize seu iPhone em Ajustes &gt; Geral &gt; Atualização de Software para receber alertas Push.
            </p>
          </div>
        </motion.div>
      )}

      {/* 3. Convite Limpo de Ativação de Alertas Push */}
      {!showIOSInstallGuide &&
        !showIOSIncompatible &&
        showPrompt &&
        permissionState === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            className="fixed bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
          >
            <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-[0_16px_45px_rgba(5,150,105,0.14)]">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Avisos em Tempo Real
                    </span>
                    <h3 className="text-base font-extrabold text-[#0F291E]">
                      Ativar Alertas da Caderneta?
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleDismissPrompt}
                  className="p-1.5 rounded-full text-[#648274] hover:bg-emerald-50 hover:text-[#0F291E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#526D60] mt-3 leading-relaxed">
                Receba uma notificação no celular sempre que um novo frete for lançado ou um pagamento for confirmado!
              </p>

              <div className="mt-4 flex gap-2.5">
                <button
                  onClick={handleEnableNotifications}
                  disabled={busy}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-bold text-xs shadow-sm transition-all disabled:opacity-60"
                >
                  {busy ? "Ativando..." : "Ativar Alertas 🔔"}
                </button>
                <button
                  onClick={handleDismissPrompt}
                  className="px-4 h-11 bg-[#F4F8F6] hover:bg-emerald-50 text-[#526D60] rounded-2xl font-semibold text-xs border border-[#DCE8E2] transition-all"
                >
                  Agora não
                </button>
              </div>
            </div>
          </motion.div>
        )}
    </AnimatePresence>
  );
}
