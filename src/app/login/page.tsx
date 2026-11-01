"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ControleFreteLogo } from "@/components/BrandLogos";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm clean-card p-7"
      >
        <div className="text-center mb-7">
          <ControleFreteLogo className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-[#0F291E]">
            Controle de Frete
          </h1>
          <p className="text-xs text-[#648274] mt-1">
            Gestão diária de transportes e pagamentos
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-sm text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] text-sm text-[#0F291E] placeholder:text-[#86A395] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex justify-center items-center disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
