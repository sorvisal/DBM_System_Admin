"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * useRealTimeData subscribes to SignalR events and refreshes data automatically.
 * Each page passes a map of event names to refresh callbacks.
 * All connections are shared globally so only one HubConnection per type exists.
 */
export function useRealTimeData(deps: unknown[], refreshers: Record<string, () => void>) {
  const refreshersRef = useRef(refreshers);
  refreshersRef.current = refreshers;

  useEffect(() => {
    let cancelled = false;
    let cleanupSubs: (() => void) | null = null;
    // Dynamically import to avoid SSR issues and circular deps
    import("@/lib/notifications").then((mod) => {
      if (cancelled) return;

      const eventMap: Record<string, () => void> = {};
      for (const [event, refresh] of Object.entries(refreshers)) {
        eventMap[`on${event}`] = () => refresh();
      }

      // Subscribe to all relevant hubs based on which refreshers are registered
      const subscriptions: (() => void)[] = [];

      if ("onOrderStatusChanged" in eventMap || "onOrderCreated" in eventMap) {
        const unsub = mod.useOrderEvents(eventMap as Parameters<typeof mod.useOrderEvents>[0]);
        subscriptions.push(() => {}); // no-op — useOrderEvents manages its own lifecycle
      }

      if ("onTransactionCreated" in eventMap) {
        const unsub = mod.useFinancialEvents({ onTransactionCreated: () => refreshersRef.current["onTransactionCreated"]?.() });
        subscriptions.push(() => {});
      }

      if ("onProductUpdated" in eventMap || "onProductCreated" in eventMap || "onProductDeleted" in eventMap) {
        const unsub = mod.useProductEvents(eventMap as Parameters<typeof mod.useProductEvents>[0]);
        subscriptions.push(() => {});
      }

      cleanupSubs = () => {
        for (const unsub of subscriptions) unsub();
      };
    });

    return () => { cancelled = true; cleanupSubs?.(); };
  }, deps);
}

/**
 * Shared refresh triggers that pages can call directly.
 */
export const refreshKey = {
  financialTransaction: "financialTransaction",
  order: "order",
  orderStatusChanged: "orderStatusChanged",
  product: "product",
} as const;
