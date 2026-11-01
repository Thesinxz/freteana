"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && adminOnly && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, router, user, adminOnly]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#D1FAE5] border-t-[#059669] rounded-full"
        />
      </div>
    );
  }

  if (adminOnly && user?.role !== "admin") return null;

  return <>{children}</>;
}
