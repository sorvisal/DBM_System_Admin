"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "ok" | "err" | "info" | "warn";

export interface ToastOptions {
  persistent?: boolean;
  actionLabel?: string;
  actionHref?: string;
  type?: ToastType;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  opts?: ToastOptions;
}

interface ToastContextValue {
  toast: (message: string, typeOrOpts?: ToastOptions | ToastType, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useMemo(() => {
    function fn(message: string, typeOrOpts?: ToastOptions | ToastType, opts?: ToastOptions) {
      let type: ToastType = "info";
      let resolvedOpts: ToastOptions | undefined;
      if (typeof typeOrOpts === "string") {
        type = typeOrOpts as ToastType;
        resolvedOpts = opts;
      } else if (typeof typeOrOpts === "object" && typeOrOpts !== null) {
        resolvedOpts = typeOrOpts;
        if (typeOrOpts.type) type = typeOrOpts.type;
      }
      const id = nextId++;
      setItems((prev) => [...prev, { id, message, type, opts: resolvedOpts }]);
      if (!resolvedOpts?.persistent) {
        setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      }
    }
    return fn;
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div id="toast-wrap" aria-live="polite" aria-atomic="true">
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type === "ok" ? "ok" : t.type === "err" ? "err" : t.type === "warn" ? "warn" : ""}`}
            role="status"
          >
            {t.message}
            {t.opts?.actionLabel && t.opts.actionHref && (
              <a
                href={t.opts.actionHref}
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "inherit" }}
              >
                {t.opts.actionLabel}
              </a>
            )}
            {!t.opts?.persistent && (
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                style={{ marginLeft: 8, background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
