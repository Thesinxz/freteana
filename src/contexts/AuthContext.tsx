"use client";

import { createContext, useContext } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: null;
  loading: boolean;
}

const DEFAULT_ADMIN_USER: User = {
  uid: "controle_frete_admin",
  email: "contato@lojinhadocelular.com",
  role: "admin",
  name: "Controle de Frete",
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_ADMIN_USER,
  firebaseUser: null,
  loading: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{ user: DEFAULT_ADMIN_USER, firebaseUser: null, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}
