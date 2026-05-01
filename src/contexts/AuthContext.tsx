"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Role } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Como não teremos login, vamos forçar um usuário "admin/driver" automático instantaneamente
    const mockUser: User = {
      uid: "fretebela_admin_123",
      email: "contato@lojinhadocelular.com",
      role: "admin", 
      name: "Ana (Admin)",
    };
    
    setUser(mockUser);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser: null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
