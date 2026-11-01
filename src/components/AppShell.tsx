"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BellRing,
  Calendar,
  CheckCircle2,
  Home,
  Settings2,
  UserCheck,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useLedger } from "@/hooks/useLedger";
import {
  canUseNotifications,
  getDeviceName,
  getNotificationPermissionState,
  isIOS,
  isStandalone,
  requestNotificationPermission,
} from "@/lib/pwa-notifications";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ControleFreteLogo } from "@/components/BrandLogos";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Início & Fretes", shortLabel: "Início", icon: Home },
  {
    href: "/acertar",
    label: "Receber Pagamento",
    shortLabel: "Receber",
    icon: Wallet,
  },
  {
    href: "/agenda",
    label: "Agenda de Coletas",
    shortLabel: "Agenda",
    icon: Calendar,
  },
  {
    href: "/admin",
    label: "Gestão & Relatórios",
    shortLabel: "Gestão",
    icon: BarChart3,
  },
];

export function AppShell({
  children,
  title,
  subtitle,
  headerRight,
}: AppShellProps) {
  const pathname = usePathname();
  const { balance } = useLedger();
  const [notifStatus, setNotifStatus] = useState<string>("default");
  const [deviceName, setDeviceNameState] = useState<string>("");

  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      if (typeof window === "undefined") return;
      const currentName = getDeviceName();
      let nextStatus: string;
      if (isIOS() && !isStandalone()) {
        nextStatus = "ios-install";
      } else if (!canUseNotifications()) {
        nextStatus = "unsupported";
      } else {
        nextStatus = await getNotificationPermissionState();
      }
      if (active) {
        setDeviceNameState(currentName);
        setNotifStatus(nextStatus);
      }
    };

    const timer = window.setTimeout(() => {
      void checkStatus();
    }, 0);
    const handler = () => {
      void checkStatus();
    };
    window.addEventListener("freteana:permission-changed", handler);
    window.addEventListener("freteana:push-synced", handler);
    window.addEventListener("freteana:device-prefs-changed", handler);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("freteana:permission-changed", handler);
      window.removeEventListener("freteana:push-synced", handler);
      window.removeEventListener("freteana:device-prefs-changed", handler);
    };
  }, []);

  const openDeviceSettings = () => {
    window.dispatchEvent(new CustomEvent("freteana:open-notif-settings"));
  };

  const handlePrimaryBellClick = async () => {
    if (notifStatus === "default") {
      const res = await requestNotificationPermission();
      setNotifStatus(res);
      if (res === "granted") {
        toast.success("Notificações ativadas neste aparelho!");
      }
      return;
    }
    openDeviceSettings();
  };

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F8F6] text-[#0F291E]">
      {/* Sidebar Clean — Desktop */}
      <aside className="hidden lg:flex w-68 shrink-0 bg-white border-r border-[#E2ECE7] flex-col justify-between p-6 sticky top-0 h-screen print:hidden">
        <div>
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <ControleFreteLogo className="w-10 h-10 group-hover:scale-105 transition-transform" />
            <div>
              <div className="font-extrabold text-base text-[#0F291E] tracking-tight">
                Controle de Frete
              </div>
              <div className="text-xs text-[#648274] font-medium">
                Gestão &amp; Caderneta
              </div>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#ECFDF5] text-[#047857] border border-[#C6F0DC]"
                      : "text-[#526D60] hover:bg-[#F4F8F6] hover:text-[#0F291E]"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4.5 h-4.5",
                        isActive ? "text-[#059669]" : "text-[#7A9688]"
                      )}
                    />
                    {item.label}
                  </span>
                  {item.href === "/acertar" && balance > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {formatCurrency(balance / 100)}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Card de Aparelho & Notificações na Sidebar */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={openDeviceSettings}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F8F6] hover:bg-[#ECFDF5] border border-[#DCE8E2] flex items-center justify-between gap-2 text-xs font-bold text-[#1E3A2F] transition-colors"
          >
            <span className="flex items-center gap-2 truncate">
              <UserCheck className="w-4 h-4 text-[#059669] shrink-0" />
              <span className="truncate">
                {deviceName ? `Aparelho: ${deviceName}` : "Identificar aparelho"}
              </span>
            </span>
            <Settings2 className="w-3.5 h-3.5 text-[#648274] shrink-0" />
          </button>

          {notifStatus === "granted" ? (
            <div className="rounded-2xl p-4 bg-[#F0FDF4] border border-[#BBF7D0]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#15803D] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5" />
                  Alertas Ativos
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-[#166534]/85 leading-snug mb-3">
                Fretes, baixas e estornos notificam em tempo real.
              </p>
              <button
                type="button"
                onClick={openDeviceSettings}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#047857] border border-[#A7F3D0] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Configurar / Testar Push
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-4 bg-[#F4F8F6] border border-[#DCE8E2]">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-[#059669]" />
                <span className="text-xs font-bold text-[#0F291E]">
                  Notificações Push
                </span>
              </div>
              <p className="text-xs text-[#526D60] leading-snug mb-3">
                {notifStatus === "ios-install"
                  ? "Salve na Tela de Início do iPhone para receber alertas."
                  : "Ative para saber na hora quando cair pagamento ou frete novo."}
              </p>
              <button
                type="button"
                onClick={handlePrimaryBellClick}
                className="w-full py-2 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs"
              >
                {notifStatus === "ios-install"
                  ? "Ver como instalar"
                  : "Ativar Alertas 🔔"}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Topbar — Mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2ECE7] pt-safe print:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <ControleFreteLogo className="w-9 h-9" />
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-[#0F291E] truncate">
                {title || "Controle de Frete"}
              </div>
              <div className="text-xs text-[#648274] capitalize truncate">
                {subtitle || todayFormatted}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={openDeviceSettings}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#F4F8F6] text-[#1E3A2F] border border-[#DCE8E2] flex items-center gap-1"
              title="Identificar aparelho e preferências de Push"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span className="max-w-20 truncate">
                {deviceName || "Perfil"}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrimaryBellClick}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition-all",
                notifStatus === "granted"
                  ? "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]"
                  : "bg-[#059669] text-white border-[#059669] shadow-xs"
              )}
            >
              {notifStatus === "granted" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Push OK</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alertas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <div className="flex-1 min-w-0 pb-24 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
          <div className="hidden lg:flex items-center justify-between mb-6 print:hidden">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F291E] tracking-tight">
                {title || "Controle de Frete"}
              </h1>
              <p className="text-sm text-[#648274] capitalize mt-0.5">
                {subtitle || todayFormatted}
              </p>
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>

          {children}
        </div>
      </div>

      {/* Navegação Inferior Clean — Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2ECE7] pb-safe print:hidden shadow-[0_-4px_20px_rgba(15,41,30,0.04)]">
        <div className="grid grid-cols-4 px-2 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all",
                  isActive ? "text-[#059669]" : "text-[#7A9688]"
                )}
              >
                <div
                  className={cn(
                    "px-3.5 py-1 rounded-full transition-all",
                    isActive ? "bg-[#ECFDF5]" : "bg-transparent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold mt-0.5">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
