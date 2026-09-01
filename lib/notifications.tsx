"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from "@microsoft/signalr";
import { getTokens, SWAGGER_URL } from "@/lib/api";
import type { NotificationDto, LowStockAlertPayload, ProductDto } from "@/lib/types";

// ─── Toast context ────────────────────────────────────────────────────────────

export interface ToastOptions {
  persistent?: boolean;
  actionLabel?: string;
  actionHref?: string;
  type?: "ok" | "err" | "info" | "warn";
}

interface ToastEntry {
  id: number;
  message: string;
  type: "ok" | "err" | "info" | "warn";
  opts?: ToastOptions;
}

interface ToastContextValue {
  toast: (message: string, typeOrOpts?: ToastOptions | "ok" | "err" | "info", opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);

  const toast = useRef((message: string, typeOrOpts?: ToastOptions | "ok" | "err" | "info", opts?: ToastOptions) => {
    let type: ToastEntry["type"] = "info";
    let resolvedOpts: ToastOptions | undefined;
    if (typeof typeOrOpts === "string") {
      type = typeOrOpts as ToastEntry["type"];
      resolvedOpts = opts;
    } else if (typeof typeOrOpts === "object" && typeOrOpts !== null) {
      resolvedOpts = typeOrOpts;
      if (typeOrOpts.type) type = typeOrOpts.type;
    }
    const id = nextToastId++;
    setItems((prev) => [...prev, { id, message, type, opts: resolvedOpts }]);
    if (!resolvedOpts?.persistent) {
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  });

  const value = { toast: toast.current };

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

// ─── NotificationHub connection ──────────────────────────────────────────────

export interface NotificationEvents {
  onNotification?: (n: NotificationDto) => void;
  onNotificationRead?: (id: number) => void;
  onNotificationsReadAll?: () => void;
  onNotificationDeleted?: (id: number) => void;
  onUnreadCountChanged?: (count: number) => void;
  onLowStockAlert?: (payload: LowStockAlertPayload) => void;
}

let notifConn: HubConnection | null = null;
let notifListeners: NotificationEvents[] = [];

function ensureNotifConn(): HubConnection | null {
  if (notifConn) return notifConn;

  const t = getTokens();
  if (!t?.accessToken) return null;

  const baseUrl = SWAGGER_URL || window.location.origin;

  const conn = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/notifications`, {
      accessTokenFactory: () => {
        const tokens = getTokens();
        return tokens?.accessToken ?? "";
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  function dispatch(event: string, ...args: unknown[]) {
    for (const l of notifListeners) {
      const handler = l[event as keyof NotificationEvents] as ((...a: unknown[]) => void) | undefined;
      handler?.(...args);
    }
  }

  conn.on("newNotification", (n: NotificationDto) => dispatch("onNotification", n));
  conn.on("notificationRead", (id: number) => dispatch("onNotificationRead", id));
  conn.on("notificationsReadAll", () => dispatch("onNotificationsReadAll"));
  conn.on("notificationDeleted", (id: number) => dispatch("onNotificationDeleted", id));
  conn.on("unreadCountChanged", (count: number) => dispatch("onUnreadCountChanged", count));
  conn.on("LowStockAlert", (p: LowStockAlertPayload) => dispatch("onLowStockAlert", p));

  notifConn = conn;
  conn.start().catch(() => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] NotificationsHub connect failed");
  });
  return conn;
}

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    if (notifConn) {
      notifConn = null;
      ensureNotifConn();
    }
    if (orderConn) {
      orderConn = null;
      ensureOrderConn();
    }
    if (productConn) {
      productConn = null;
      ensureProductConn();
    }
    if (financialConn) {
      financialConn = null;
      ensureFinancialConn();
    }
  });
}

export function useNotifications(events: NotificationEvents) {
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
    const entry: NotificationEvents = {};
    (Object.keys(events) as (keyof NotificationEvents)[]).forEach((key) => {
      (entry as Record<string, unknown>)[key] = (...args: unknown[]) =>
        eventsRef.current[key as keyof NotificationEvents] &&
        (eventsRef.current[key as keyof NotificationEvents] as (...a: unknown[]) => void)(...args);
    });
    notifListeners.push(entry);
    ensureNotifConn();

    return () => {
      notifListeners = notifListeners.filter((l) => l !== entry);
    };
  }, [events]);
}

// ─── OrdersHub connection ────────────────────────────────────────────────────

export interface OrderEvents {
  onOrderStatusChanged?: (payload: { id: number; status: string }) => void;
  onOrderCreated?: (payload: { id: number; code: string; status: string }) => void;
  onPoStatusChanged?: (payload: { id: number; status: string }) => void;
}

let orderConn: HubConnection | null = null;
let orderListeners: OrderEvents[] = [];

export type ConnState = "Connecting" | "Connected" | "Reconnecting" | "Disconnected";

export function ensureOrderConn(): HubConnection | null {
  if (orderConn) return orderConn;

  const t = getTokens();
  if (!t?.accessToken) return null;

  const baseUrl = SWAGGER_URL || window.location.origin;

  const conn = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/orders`, {
      accessTokenFactory: () => {
        const tokens = getTokens();
        return tokens?.accessToken ?? "";
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  function dispatch(event: string, ...args: unknown[]) {
    for (const l of orderListeners) {
      const handler = l[event as keyof OrderEvents] as ((...a: unknown[]) => void) | undefined;
      handler?.(...args);
    }
  }

  conn.on("OrderStatusChanged", (dto: unknown) => {
    const d = dto as Record<string, unknown>;
    dispatch("onOrderStatusChanged", {
      id: Number(d.id ?? 0),
      status: String(d.status ?? ""),
    });
  });

  conn.on("OrderCreated", (dto: unknown) => {
    const d = dto as Record<string, unknown>;
    dispatch("onOrderCreated", {
      id: Number(d.id ?? 0),
      code: String(d.code ?? ""),
      status: String(d.status ?? "Confirmed"),
    });
  });

  conn.on("PoStatusChanged", (dto: unknown) => {
    const d = dto as Record<string, unknown>;
    dispatch("onPoStatusChanged", {
      id: Number(d.id ?? 0),
      status: String(d.status ?? ""),
    });
  });

  conn.onclose = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] OrdersHub disconnected");
  };
  conn.onreconnecting = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] OrdersHub reconnecting");
  };
  conn.onreconnected = () => {
    if (process.env.NODE_ENV === "development") console.info("[SignalR] OrdersHub reconnected");
  };

  orderConn = conn;
  conn.start().catch(() => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] OrdersHub connect failed");
  });
  return conn;
}

export function useOrderEvents(events: OrderEvents) {
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
    const entry: OrderEvents = {};
    (Object.keys(events) as (keyof OrderEvents)[]).forEach((key) => {
      (entry as Record<string, unknown>)[key] = (...args: unknown[]) =>
        eventsRef.current[key as keyof OrderEvents] &&
        (eventsRef.current[key as keyof OrderEvents] as (...a: unknown[]) => void)(...args);
    });
    orderListeners.push(entry);
    ensureOrderConn();

    return () => {
      orderListeners = orderListeners.filter((l) => l !== entry);
    };
  }, [events]);
}

/**
 * Returns the current SignalR connection state for a given HubConnection.
 */
export function useConnState(connection: HubConnection | null): ConnState {
  const [state, setState] = useState<ConnState>("Connecting");

  useEffect(() => {
    if (!connection) {
      setState("Disconnected");
      return;
    }
    if (connection.state === HubConnectionState.Connected) setState("Connected");
    else if (connection.state === HubConnectionState.Connecting) setState("Connecting");

    const onClose = () => setState("Disconnected");
    const onReconnecting = () => setState("Reconnecting");
    const onReconnected = () => setState("Connected");

    connection.onclose = onClose;
    connection.onreconnecting = onReconnecting;
    connection.onreconnected = onReconnected;

    return () => {
      // No-op cleanup — SignalR handles reconnection internally
    };
  }, [connection]);

  return state;
}

// ─── FinancialHub connection ──────────────────────────────────────────────────

export interface FinancialEvents {
  onTransactionCreated?: (payload: { id: number; type: string; amount: number; referenceId: number; referenceType: string }) => void;
}

let financialConn: HubConnection | null = null;
let financialListeners: FinancialEvents[] = [];

export function ensureFinancialConn(): HubConnection | null {
  if (financialConn) return financialConn;

  const t = getTokens();
  if (!t?.accessToken) return null;

  const baseUrl = SWAGGER_URL || window.location.origin;

  const conn = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/financial`, {
      accessTokenFactory: () => {
        const tokens = getTokens();
        return tokens?.accessToken ?? "";
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  conn.on("TransactionCreated", (payload: unknown) => {
    const p = payload as Record<string, unknown>;
    for (const l of financialListeners) {
      const handler = l.onTransactionCreated as ((...a: unknown[]) => void) | undefined;
      if (handler) {
        handler({
          id: Number(p.id ?? 0),
          type: String(p.type ?? ""),
          amount: Number(p.amount ?? 0),
          referenceId: Number(p.referenceId ?? 0),
          referenceType: String(p.referenceType ?? ""),
        });
      }
    }
  });

  conn.onclose = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] FinancialHub disconnected");
  };
  conn.onreconnecting = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] FinancialHub reconnecting");
  };
  conn.onreconnected = () => {
    if (process.env.NODE_ENV === "development") console.info("[SignalR] FinancialHub reconnected");
  };

  financialConn = conn;
  conn.start().catch(() => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] FinancialHub connect failed");
  });
  return conn;
}

export function useFinancialEvents(events: FinancialEvents) {
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
    const entry: FinancialEvents = {};
    (Object.keys(events) as (keyof FinancialEvents)[]).forEach((key) => {
      (entry as Record<string, unknown>)[key] = (...args: unknown[]) =>
        eventsRef.current[key as keyof FinancialEvents] &&
        (eventsRef.current[key as keyof FinancialEvents] as (...a: unknown[]) => void)(...args);
    });
    financialListeners.push(entry);
    ensureFinancialConn();

    return () => {
      financialListeners = financialListeners.filter((l) => l !== entry);
    };
  }, [events]);
}

// ─── ProductsHub connection ──────────────────────────────────────────────────

export interface ProductEvents {
  onProductCreated?: (product: ProductDto) => void;
  onProductUpdated?: (product: ProductDto) => void;
  onProductDeleted?: (id: number) => void;
  onStockAdjusted?: (payload: { productId: number; productName: string; newStockQty: number }) => void;
  onLowStockAlert?: (payload: LowStockAlertPayload) => void;
}

let productConn: HubConnection | null = null;
let productListeners: ProductEvents[] = [];

export function ensureProductConn(): HubConnection | null {
  if (productConn) return productConn;

  const t = getTokens();
  if (!t?.accessToken) return null;

  const baseUrl = SWAGGER_URL || window.location.origin;

  const conn = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/products`, {
      accessTokenFactory: () => {
        const tokens = getTokens();
        return tokens?.accessToken ?? "";
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  function dispatch(event: string, ...args: unknown[]) {
    for (const l of productListeners) {
      const handler = l[event as keyof ProductEvents] as ((...a: unknown[]) => void) | undefined;
      handler?.(...args);
    }
  }

  conn.on("ProductCreated", (product: ProductDto) => dispatch("onProductCreated", product));
  conn.on("ProductUpdated", (product: ProductDto) => dispatch("onProductUpdated", product));
  conn.on("ProductDeleted", (id: number) => dispatch("onProductDeleted", id));
  conn.on("StockAdjusted", (payload: unknown) => {
    const p = payload as Record<string, unknown>;
    dispatch("onStockAdjusted", {
      productId: Number(p.productId ?? 0),
      productName: String(p.productName ?? ""),
      newStockQty: Number(p.newStockQty ?? p.quantity ?? 0),
    });
  });
  conn.on("LowStockAlert", (p: LowStockAlertPayload) => dispatch("onLowStockAlert", p));

  conn.onclose = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] ProductsHub disconnected");
  };
  conn.onreconnecting = () => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] ProductsHub reconnecting");
  };
  conn.onreconnected = () => {
    if (process.env.NODE_ENV === "development") console.info("[SignalR] ProductsHub reconnected");
  };

  productConn = conn;
  conn.start().catch(() => {
    if (process.env.NODE_ENV === "development") console.warn("[SignalR] ProductsHub connect failed");
  });
  return conn;
}

export function useProductEvents(events: ProductEvents) {
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
    const entry: ProductEvents = {};
    (Object.keys(events) as (keyof ProductEvents)[]).forEach((key) => {
      (entry as Record<string, unknown>)[key] = (...args: unknown[]) =>
        eventsRef.current[key as keyof ProductEvents] &&
        (eventsRef.current[key as keyof ProductEvents] as (...a: unknown[]) => void)(...args);
    });
    productListeners.push(entry);
    ensureProductConn();

    return () => {
      productListeners = productListeners.filter((l) => l !== entry);
    };
  }, [events]);
}
