"use client";

import { useEffect, useRef } from "react";
import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { API_ORIGIN } from "@/lib/api/client";
import { loadCustomerSession } from "@/lib/api/publicCustomerOrders";
import { usePortal } from "./portal-context";

export interface CustomerOrderEvent {
  orderId: number;
  code: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

/**
 * Module-level SINGLETON connection.
 *
 * Started once per customer session and kept alive across page navigation,
 * so navigating Home → Products → Orders never tears a connection down
 * mid-handshake (which caused "The connection was stopped during negotiation").
 * Pages only attach/detach event listeners.
 *
 * The backend places customer connections into a private `portal:cust:{id}`
 * group — customers receive events about THEIR orders only.
 */
let conn: HubConnection | null = null;
let connToken: string | null = null;

function ensureCustomerConn(token: string): HubConnection | null {
  if (conn && connToken === token) return conn;

  // Session changed (different link/customer) — retire the old socket.
  if (conn) {
    const old = conn;
    old.stop().catch(() => {});
    conn = null;
    connToken = null;
  }

  const session = loadCustomerSession(token);
  if (!session?.accessToken) return null;

  const built = new HubConnectionBuilder()
    .withUrl(`${API_ORIGIN}/hubs/orders`, {
      accessTokenFactory: () => loadCustomerSession(token)?.accessToken ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  built.start().catch(() => {
    // Silent — API offline or restarting; auto-reconnect handles recovery.
  });

  conn = built;
  connToken = token;
  return built;
}

export function useCustomerOrderEvents(onEvent: (e: CustomerOrderEvent) => void) {
  const { token, session } = usePortal();
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const hasSession = Boolean(session?.accessToken);

  useEffect(() => {
    if (!hasSession) return;

    const connection = ensureCustomerConn(token);
    if (!connection) return;

    const listener = (dto: unknown) => {
      const d = dto as Record<string, unknown>;
      handlerRef.current({
        orderId: Number(d.orderId ?? 0),
        code: String(d.code ?? ""),
        status: String(d.status ?? ""),
        paymentStatus: String(d.paymentStatus ?? ""),
        totalAmount: Number(d.totalAmount ?? 0),
      });
    };

    connection.on("CustomerOrderUpdated", listener);
    return () => {
      connection.off("CustomerOrderUpdated", listener);
    };
  }, [token, hasSession]);
}
