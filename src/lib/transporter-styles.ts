import React from "react";
import { Star, Sun, Truck, Zap } from "lucide-react";

export const TRANSPORTER_ICONS: Record<string, React.ElementType> = {
  Truck,
  Caminhão: Truck,
  Sun,
  Sol: Sun,
  Zap,
  Cometa: Zap,
  Star,
  Estrela: Star,
};

export interface CleanColorPalette {
  dot: string;
  softBg: string;
  softBorder: string;
  iconText: string;
  label: string;
  key: string;
}

export const TRANSPORTER_PALETTES: Record<string, CleanColorPalette> = {
  "bg-emerald-600": {
    key: "bg-emerald-600",
    label: "Esmeralda",
    dot: "#10B981",
    softBg: "#ECFDF5",
    softBorder: "#A7F3D0",
    iconText: "#047857",
  },
  "bg-blue-600": {
    key: "bg-blue-600",
    label: "Azul Água",
    dot: "#0EA5E9",
    softBg: "#F0F9FF",
    softBorder: "#BAE6FD",
    iconText: "#0369A1",
  },
  "bg-blue-800": {
    key: "bg-blue-800",
    label: "Oceano",
    dot: "#0284C7",
    softBg: "#E0F2FE",
    softBorder: "#7DD3FC",
    iconText: "#075985",
  },
  "bg-amber-600": {
    key: "bg-amber-600",
    label: "Sol Dourado",
    dot: "#F59E0B",
    softBg: "#FFFBEB",
    softBorder: "#FDE68A",
    iconText: "#B45309",
  },
  "bg-teal-600": {
    key: "bg-teal-600",
    label: "Verde Água",
    dot: "#14B8A6",
    softBg: "#F0FDFA",
    softBorder: "#99F6E4",
    iconText: "#0F766E",
  },
  "bg-purple-600": {
    key: "bg-purple-600",
    label: "Lavanda Suave",
    dot: "#14B8A6",
    softBg: "#F0FDFA",
    softBorder: "#99F6E4",
    iconText: "#0F766E",
  },
  "bg-red-600": {
    key: "bg-red-600",
    label: "Coral Suave",
    dot: "#F97316",
    softBg: "#FFF7ED",
    softBorder: "#FED7AA",
    iconText: "#C2410C",
  },
  "bg-pink-600": {
    key: "bg-pink-600",
    label: "Pêssego",
    dot: "#FB7185",
    softBg: "#FFF1F2",
    softBorder: "#FECDD3",
    iconText: "#BE123C",
  },
  "bg-slate-400": {
    key: "bg-slate-400",
    label: "Sálvia",
    dot: "#648274",
    softBg: "#F4F8F6",
    softBorder: "#DCE8E2",
    iconText: "#3B5949",
  },
};

export const AVAILABLE_TRANSPORTER_COLORS = [
  TRANSPORTER_PALETTES["bg-emerald-600"],
  TRANSPORTER_PALETTES["bg-blue-600"],
  TRANSPORTER_PALETTES["bg-amber-600"],
  TRANSPORTER_PALETTES["bg-teal-600"],
  TRANSPORTER_PALETTES["bg-red-600"],
];

export function resolveTransporterPalette(colorKey?: string): CleanColorPalette {
  if (colorKey && TRANSPORTER_PALETTES[colorKey]) {
    return TRANSPORTER_PALETTES[colorKey];
  }
  return TRANSPORTER_PALETTES["bg-emerald-600"];
}

export function resolveTransporterIcon(iconKey?: string): React.ElementType {
  if (!iconKey) return Truck;
  if (TRANSPORTER_ICONS[iconKey]) return TRANSPORTER_ICONS[iconKey];
  const normalized =
    iconKey.charAt(0).toUpperCase() + iconKey.slice(1).toLowerCase();
  return TRANSPORTER_ICONS[normalized] || Truck;
}
