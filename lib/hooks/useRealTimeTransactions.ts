"use client";

import { useEffect, useState, useCallback } from "react";
import { useFinancialEvents } from "@/lib/notifications";
import type { FinancialTransactionDto, FinancialSummaryDto } from "@/lib/types";
import { listFinancialTransactions, getFinancialSummary } from "@/lib/api/financialTransactions";

interface UseRealTimeTransactionsOptions {
  page?: number;
  pageSize?: number;
  type?: string;
  referenceType?: string;
  from?: string;
  to?: string;
}

export function useRealTimeTransactions(options?: UseRealTimeTransactionsOptions) {
  const [transactions, setTransactions] = useState<FinancialTransactionDto[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options?.page ?? 1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txns, finSummary] = await Promise.all([
        listFinancialTransactions({ ...options, page }),
        getFinancialSummary(),
      ]);
      setTransactions(txns.data ?? []);
      setTotal(txns.meta?.total ?? 0);
      setSummary(finSummary.data ?? null);
    } catch {
      // silently fail — error handled by caller
    } finally {
      setLoading(false);
    }
  }, [page, options]);

  useEffect(() => {
    load();
  }, [load]);

  useFinancialEvents({
    onTransactionCreated: () => {
      load();
    },
  });

  return { transactions, summary, loading, total, page, setPage, reload: load };
}
