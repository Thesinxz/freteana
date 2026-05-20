"use client";

import { useState, useEffect } from "react";
import { Bell, X, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  registerServiceWorker, 
  getNotificationPermissionState, 
  requestNotificationPermission,
  isNotificationSupported 
} from "@/lib/pwa-notifications";

export function PwaNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<string>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // 1. Register the Service Worker
    registerServiceWorker();

    // 2. Check notification compatibility & status
    const initNotifications = async () => {
      const isSupported = isNotificationSupported();
      setSupported(isSupported);

      if (isSupported) {
        const state = await getNotificationPermissionState();
        setPermissionState(state);

        // Check if user dismissed the prompt in this session/localStorage
        const dismissed = localStorage.getItem("pwa-notif-prompt-dismissed");
        
        if (state === "default" && dismissed !== "true") {
          // Delay showing the prompt slightly for a better user experience
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

  const handleDismiss = () => {
    localStorage.setItem("pwa-notif-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (!supported || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
      >
        <div className="glass-card p-5 overflow-hidden relative border border-blue-500/20 bg-slate-900/95 backdrop-blur-lg shadow-[0_10px_30px_rgba(30,64,175,0.25)] text-white rounded-2xl">
          {/* Decorative blurred backgrounds */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-0.5 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Notificações PWA
                </p>
                <h3 className="text-base font-bold tracking-tight text-white">
                  Ativar Alertas no iOS?
                </h3>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed relative z-10">
            Receba notificações na tela inicial sempre que um frete for salvo ou pagamento for registrado na caderneta!
          </p>

          <div className="mt-4 flex space-x-2 relative z-10">
            <button
              onClick={handleEnableNotifications}
              className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center transition-all border border-blue-400/20"
            >
              Ativar Notificações 🔔
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 h-10 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl font-semibold text-xs transition-all"
            >
              Depois
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
