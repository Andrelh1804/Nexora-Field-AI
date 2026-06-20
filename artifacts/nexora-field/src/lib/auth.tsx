import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, setAuthTokenGetter, User, getGetMeQueryKey } from "@workspace/api-client-react";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

setAuthTokenGetter(() => localStorage.getItem("nexora_token"));

export function getAuthToken(): string | null {
  return localStorage.getItem("nexora_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("nexora_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
      // Never serve stale mustChangePassword data — always validate with server
      staleTime: 0,
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
    // Clear ALL query cache so stale user data (including mustChangePassword: true)
    // is never served after re-login
    queryClient.clear();
  };

  const refreshUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, setToken, logout, refreshUser }}>
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
