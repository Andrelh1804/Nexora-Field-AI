import React, { createContext, useContext, useState } from "react";
import { useGetMe, setAuthTokenGetter, User, getGetMeQueryKey } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

setAuthTokenGetter(() => localStorage.getItem("nexora_token"));

export function getAuthToken(): string | null {
  return localStorage.getItem("nexora_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("nexora_token"));

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const setToken = (newToken: string) => {
    localStorage.setItem("nexora_token", newToken);
    setTokenState(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("nexora_token");
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
