"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearTokens,
  getTokens,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  setStoredUser,
  setTokens,
  getMe,
} from "./api";
import { canAccessAdmin } from "./types";
import type { LoginRequest, RegisterRequest, UserDto } from "./types";

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<UserDto>;
  register: (body: RegisterRequest) => Promise<UserDto>;
  applyAuth: (accessToken: string, refreshToken: string) => Promise<UserDto | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  async function restoreSession() {
    try {
      if (!getTokens()?.accessToken) {
        return null;
      }
      const json = await getMe();
      if (json.success && json.data && canAccessAdmin(json.data.role)) {
        setUser(json.data);
        setStoredUser(json.data);
        return json.data;
      }
      clearTokens();
      setStoredUser(null);
      return null;
    } catch {
      clearTokens();
      setStoredUser(null);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      await restoreSession();
      if (!cancelled) setLoading(false);
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const data = await apiLogin(credentials);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    const data = await apiRegister(body);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const applyAuth = useCallback(async (accessToken: string, refreshToken: string) => {
    setTokens({ accessToken, refreshToken });
    const json = await getMe();
    if (json.success && json.data && canAccessAdmin(json.data.role)) {
      setUser(json.data);
      setStoredUser(json.data);
      return json.data;
    }
    clearTokens();
    setStoredUser(null);
    setUser(null);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const json = await getMe();
    if (json.success && json.data) {
      setUser(json.data);
      setStoredUser(json.data);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, applyAuth, logout, refreshUser }),
    [user, loading, login, register, applyAuth, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
