import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LedgerProvider } from "@/contexts/LedgerContext";
import { Toaster } from "sonner";
import { PwaNotificationManager } from "@/components/PwaNotificationManager";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Controle de Frete",
  description: "Controle limpo e em tempo real de fretes, pagamentos e coletas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Controle de Frete",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={jakarta.variable}>
      <body className="font-sans antialiased bg-[#F4F8F6] text-[#0F291E] min-h-screen">
        <AuthProvider>
          <ProtectedRoute>
            <LedgerProvider>{children}</LedgerProvider>
          </ProtectedRoute>
        </AuthProvider>
        <PwaNotificationManager />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              borderRadius: "1rem",
              border: "1px solid #C6F0DC",
            },
          }}
        />
      </body>
    </html>
  );
}
