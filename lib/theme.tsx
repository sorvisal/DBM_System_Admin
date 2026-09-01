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
import { usePathname } from "next/navigation";

export type Theme = "light" | "dark";

const STORAGE_KEY = "dbm_theme";

/** Customer ordering portal is always light, regardless of the stored theme. */
export function isAlwaysLightPath(pathname: string): boolean {
  return pathname === "/order" || pathname.startsWith("/order/");
}

function readStoredTheme(): Theme {
  if (isAlwaysLightPath(window.location.pathname)) return "light";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* localStorage / matchMedia may be unavailable */
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("dark");

  const sync = useCallback(() => {
    const next = readStoredTheme();
    // Never persist the portal's forced light theme as the user's choice.
    if (!isAlwaysLightPath(window.location.pathname)) applyTheme(next);
    else {
      const root = document.documentElement;
      root.dataset.theme = "light";
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      root.classList.add("light");
      root.classList.remove("dark");
    }
    setThemeState(next);
    return next;
  }, []);

  useEffect(() => {
    sync();
  }, [sync, pathname]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [sync]);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const next: Theme = cur === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
