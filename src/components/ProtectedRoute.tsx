"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If adminOnly is true and the user is loaded but not admin, we could redirect to /
    if (!loading && adminOnly && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, router, user, adminOnly]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  // Se for adminOnly mas usuário não for admin, não renderiza
  if (adminOnly && user?.role !== "admin") return null;

  return <>{children}</>;
}
