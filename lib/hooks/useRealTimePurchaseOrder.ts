"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderEvents } from "@/lib/notifications";
import { getPurchaseOrder } from "@/lib/api/purchaseOrders";
import type { PurchaseOrderDto } from "@/lib/types";

export function useRealTimePurchaseOrder(poId: number) {
  const [po, setPo] = useState<PurchaseOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isNaN(poId)) return;
    setLoading(true);
    try {
      const res = await getPurchaseOrder(poId);
      setPo(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => {
    load();
  }, [load]);

  useOrderEvents({
    onOrderStatusChanged: (payload) => {
      // PoStatusChanged is dispatched as OrderStatusChanged in the hub
      // We handle it by checking if the id matches a PO (we can't differentiate, so reload all)
      // A better approach would be to add a dedicated PoStatusChanged event
      if (payload.id === poId) {
        setPo((prev) => {
          if (!prev) return prev;
          return { ...prev, status: payload.status };
        });
      }
    },
  });

  return { po, loading, error, reload: load };
}
