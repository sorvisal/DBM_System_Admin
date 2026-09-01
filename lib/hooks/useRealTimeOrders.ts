"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderEvents } from "@/lib/notifications";
import { listOrders } from "@/lib/api/orders";
import type { OrderDto } from "@/lib/types";

interface UseRealTimeOrdersOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  isCompleted?: boolean;
}

export function useRealTimeOrders(options?: UseRealTimeOrdersOptions) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(options?.page ?? 1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders({ ...options, page });
      setOrders(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, options]);

  useEffect(() => {
    load();
  }, [load]);

  useOrderEvents({
    onOrderStatusChanged: () => { load(); },
    onOrderCreated: () => { load(); },
  });

  return { orders, loading, total, page, setPage, reload: load };
}
