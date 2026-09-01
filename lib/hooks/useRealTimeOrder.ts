"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderEvents } from "@/lib/notifications";
import { getOrder } from "@/lib/api/orders";
import type { OrderDto } from "@/lib/types";

export function useRealTimeOrder(orderId: number) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isNaN(orderId)) return;
    setLoading(true);
    try {
      const res = await getOrder(orderId);
      setOrder(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useOrderEvents({
    onOrderStatusChanged: (payload) => {
      if (payload.id !== orderId) return;
      setOrder((prev) => {
        if (!prev) return prev;
        return { ...prev, status: payload.status as OrderDto["status"] };
      });
    },
  });

  return { order, loading, error, reload: load };
}
