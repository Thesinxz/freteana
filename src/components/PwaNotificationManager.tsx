"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  PlusSquare,
  Send,
  Share,
  Smartphone,
  Sparkles,
  UserCheck,
  VolumeX,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  canUseNotifications,
  clearAppUnreadBadge,
  getDeviceName,
  getIOSVersion,
  getMuteOwnPush,
  getNotificationPermissionState,
  isIOS,
  isStandalone,
  registerServiceWorker,
  requestNotificationPermission,
  sendTestPushNotification,
  setDeviceName,
  setMuteOwnPush,
  syncPushSubscription,
} from "@/lib/pwa-notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const QUICK_NAMES = ["Ana", "Marlon", "Motorista"];

export function PwaNotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showIOSIncompatible, setShowIOSIncompatible] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [permissionState, setPermissionState] = useState<string>("default");
  const [busy, setBusy] = useState(false);

  const [nameInput, setNameInput] = useState(() => getDeviceName());
  const [muteSelf, setMuteSelfState] = useState(() => getMuteOwnPush());

  useEffect(() => {
    void registerServiceWorker();
    void clearAppUnreadBadge();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void clearAppUnreadBadge();
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

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
          await syncPushSubscription();
        } else if (state === "default" && dismissedNotif !== "true") {
          setTimeout(() => setShowPrompt(true), 1500);
        }
      }
    };

    void init();

    const handleOpenDialog = async () => {
      setNameInput(getDeviceName());
      setMuteSelfState(getMuteOwnPush());

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
      setShowSettingsModal(true);
    };

    window.addEventListener("freteana:open-notif-settings", handleOpenDialog);
    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
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
        toast.error("Permissão negada nas configurações do navegador.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = () => {
    setDeviceName(nameInput);
    setMuteOwnPush(muteSelf);
    toast.success("Preferências deste aparelho salvas!");
    setShowSettingsModal(false);
  };

  const handleSendTest = async () => {
    setBusy(true);
    try {
      setDeviceName(nameInput);
      setMuteOwnPush(muteSelf);
      const ok = await sendTestPushNotification();
      if (ok) {
        toast.success("Notificação de teste disparada!");
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
      {/* Modal de Identificação do Aparelho & Preferências de Push */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
            className="fixed inset-0 bg-[#0F291E]/25 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            className="relative z-10 w-full sm:max-w-md bg-white border border-[#DCE8E2] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
                  Aparelho &amp; Notificações
                </span>
                <h2 className="text-lg font-extrabold text-[#0F291E] mt-2">
                  Identificação e Alertas Push
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-2 rounded-full text-[#648274] hover:bg-[#F4F8F6] hover:text-[#0F291E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nome de quem usa este aparelho */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A2F]">
                <UserCheck className="w-4 h-4 text-[#059669]" />
                <span>Quem usa este aparelho?</span>
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: Ana, Marlon..."
                className="w-full bg-[#F4F8F6] border border-[#DCE8E2] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NAMES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNameInput(preset)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all",
                      nameInput.trim().toLowerCase() === preset.toLowerCase()
                        ? "bg-[#ECFDF5] border-[#10B981] text-[#047857]"
                        : "bg-white border-[#DCE8E2] text-[#526D60] hover:bg-[#F4F8F6]"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#648274]">
                Esse nome aparece nas notificações enviadas aos outros celulares (ex.:{" "}
                <em>&ldquo;Por Ana • Saldo a receber...&rdquo;</em>).
              </p>
            </div>

            {/* Silenciar auto-notificação */}
            <button
              type="button"
              onClick={() => setMuteSelfState((v) => !v)}
              className={cn(
                "w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all",
                muteSelf
                  ? "bg-[#ECFDF5] border-[#10B981]"
                  : "bg-[#F4F8F6] border-[#DCE8E2]"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    muteSelf
                      ? "bg-[#059669] text-white"
                      : "bg-white text-[#648274] border border-[#DCE8E2]"
                  )}
                >
                  <VolumeX className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#0F291E]">
                    Não tocar Push quando eu mesmo lançar
                  </div>
                  <div className="text-xs text-[#648274] leading-snug">
                    {muteSelf
                      ? "Ativo: apenas os outros celulares recebem o Push."
                      : "Desativado: todos os celulares (incluindo este) recebem o Push."}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "w-11 h-6 rounded-full p-0.5 transition-colors shrink-0",
                  muteSelf ? "bg-[#059669]" : "bg-[#CBDAD2]"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-xs transition-transform",
                    muteSelf ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </div>
            </button>

            {/* Status / Teste de Push */}
            <div className="rounded-2xl p-3.5 bg-[#F4F8F6] border border-[#DCE8E2] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-[#0F291E]">
                  Status do Push neste aparelho
                </div>
                <div className="text-xs text-[#526D60]">
                  {permissionState === "granted"
                    ? "Conectado e recebendo alertas"
                    : permissionState === "denied"
                      ? "Bloqueado nos ajustes do navegador"
                      : "Aguardando ativação"}
                </div>
              </div>

              {permissionState === "granted" ? (
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{busy ? "Enviando..." : "Testar Push"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={busy}
                  className="px-3 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shrink-0 transition-all"
                >
                  {busy ? "Ativando..." : "Ativar Agora"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full h-12 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-xs transition-all"
            >
              Salvar Preferências
            </button>
          </motion.div>
        </div>
      )}

      {/* 1. Guia de Instalação iOS */}
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
        !showSettingsModal &&
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
                Receba uma notificação no celular sempre que um novo frete for lançado, pago ou estornado!
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
