"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { listPurchaseOrders } from "@/lib/api/purchaseOrders";
import type { PurchaseOrderDto } from "@/lib/types";

interface UseRealTimePurchaseOrdersOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export function useRealTimePurchaseOrders(options?: UseRealTimePurchaseOrdersOptions) {
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(options?.page ?? 1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPurchaseOrders({ ...options, page });
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
  });

  useFinancialEvents({
    onTransactionCreated: () => { load(); },
  });

  return { orders, loading, total, page, setPage, reload: load };
}
