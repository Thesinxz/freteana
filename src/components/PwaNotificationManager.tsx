"use client";

import { useState, useEffect } from "react";
import { Bell, X, Sparkles, Share, PlusSquare, Smartphone, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  registerServiceWorker, 
  requestNotificationPermission,
  canUseNotifications,
  isIOS,
  isStandalone,
  isIOSSafari,
  getNotificationPermissionState
} from "@/lib/pwa-notifications";

function getIOSVersion(): number {
  const match = /CPU.*OS ([0-9_]{1,5})/i.exec(navigator.userAgent);
  if (!match) return 0;
  return parseFloat(match[1].replace(/_/g, '.'));
}

export function PwaNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showIOSIncompatible, setShowIOSIncompatible] = useState(false);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    // 1. Register Service Worker
    registerServiceWorker();

    // 2. Check notification compatibility & status
    const initNotifications = async () => {
      const iosDevice = isIOS();
      const standaloneMode = isStandalone();
      const dismissedNotif = localStorage.getItem("pwa-notif-prompt-dismissed");
      const dismissedIOS = localStorage.getItem("pwa-ios-guide-dismissed");
      const dismissedIncompatible = localStorage.getItem("pwa-ios-incompatible-dismissed");

      // On iOS in Safari (not saved to Home Screen yet)
      if (iosDevice && !standaloneMode && dismissedIOS !== "true") {
        const timer = setTimeout(() => {
          setShowIOSInstallGuide(true);
        }, 1500);
        return () => clearTimeout(timer);
      }

      // iOS installed but old version (< 16.4)
      if (iosDevice && standaloneMode) {
        const version = getIOSVersion();
        if (version > 0 && version < 16.4 && dismissedIncompatible !== "true") {
          const timer = setTimeout(() => {
            setShowIOSIncompatible(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      }

      // If standalone or desktop/android
      const supported = canUseNotifications();
      if (supported) {
        const state = await getNotificationPermissionState();
        setPermissionState(state);

        if (state === "default" && dismissedNotif !== "true") {
          const timer = setTimeout(() => {
            setShowPrompt(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    };

    initNotifications();
  }, []);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermissionState(result);
    setShowPrompt(false);
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

  const isIOSDevice = isIOS();

  return (
    <AnimatePresence>
      {/* 1. iOS Safari Banner: Guide to Add to Home Screen */}
      {showIOSInstallGuide && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        >
          <div className="p-5 overflow-hidden relative border border-slate-700/80 bg-slate-900 text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Ambient glows */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md flex items-center justify-center">
                  <Smartphone className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <p className="text-[11px] text-blue-400 font-extrabold uppercase tracking-wider mb-0.5 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Notificações no iPhone
                  </p>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Instalar PWA no iOS
                  </h3>
                </div>
              </div>
              <button 
                onClick={handleDismissIOSGuide}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 font-medium leading-relaxed relative z-10">
              Para receber alertas no iOS, siga estes 3 passos simples no Safari:
            </p>

            <div className="mt-3 space-y-2.5 text-xs relative z-10 bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl shadow-inner">
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-white bg-blue-600 px-2 py-0.5 rounded-md text-xs shadow-sm">1</span>
                <span className="text-slate-200">Toque em <strong className="text-white font-extrabold">Compartilhar <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /></strong> no Safari.</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-white bg-blue-600 px-2 py-0.5 rounded-md text-xs shadow-sm">2</span>
                <span className="text-slate-200">Selecione <strong className="text-white font-extrabold">Adicionar à Tela de Início <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /></strong>.</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="font-black text-white bg-blue-600 px-2 py-0.5 rounded-md text-xs shadow-sm">3</span>
                <span className="text-slate-200">Abra pelo ícone da tela inicial para receber alertas!</span>
              </div>
            </div>

            <button
              onClick={handleDismissIOSGuide}
              className="mt-3.5 w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs transition-all shadow-lg border border-blue-400/20"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. iOS Incompatible Version Warning */}
      {showIOSIncompatible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        >
          <div className="p-5 overflow-hidden relative border border-amber-700/80 bg-amber-950 text-amber-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-md flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wider mb-0.5">
                    iOS Desatualizado
                  </p>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Atualização Necessária
                  </h3>
                </div>
              </div>
              <button 
                onClick={handleDismissIncompatible}
                className="p-1.5 hover:bg-amber-900 rounded-full text-amber-400 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-amber-200 mt-3 font-medium leading-relaxed relative z-10">
              Seu iPhone precisa do iOS 16.4 ou superior para receber notificações no app instalado. Atualize em Ajustes &gt; Geral &gt; Atualização de Software.
            </p>

            <button
              onClick={handleDismissIncompatible}
              className="mt-3.5 w-full h-11 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs transition-all shadow-lg border border-amber-400/20"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. Standalone / Standard Notification Permission Banner */}
      {!showIOSInstallGuide && !showIOSIncompatible && showPrompt && permissionState === "default" && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        >
          <div className="p-5 overflow-hidden relative border border-slate-700/80 bg-slate-900 text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md flex items-center justify-center animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-blue-400 font-extrabold uppercase tracking-wider mb-0.5 flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Notificações PWA
                  </p>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Ativar Alertas de Frete?
                  </h3>
                </div>
              </div>
              <button 
                onClick={handleDismissPrompt}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 font-medium leading-relaxed relative z-10">
              {isIOSDevice 
                ? "Receba avisos quando usar o app. Notificações em background são limitadas no iPhone."
                : "Receba avisos em tempo real sempre que um frete for salvo ou pagamento for registrado na caderneta!"}
            </p>

            <div className="mt-4 flex space-x-2.5 relative z-10">
              <button
                onClick={handleEnableNotifications}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center transition-all border border-blue-400/20"
              >
                Ativar Notificações 🔔
              </button>
              <button
                onClick={handleDismissPrompt}
                className="px-4 h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl font-bold text-xs transition-all border border-slate-700"
              >
                Depois
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
