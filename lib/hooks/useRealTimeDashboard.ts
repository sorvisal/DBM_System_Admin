"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { getFinancialSummary } from "@/lib/api/financialTransactions";
import type { FinancialSummaryDto } from "@/lib/types";

export function useRealTimeDashboard() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFinancialSummary();
      setFinancialSummary(res.data ?? null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOrderEvents({
    onOrderStatusChanged: () => { load(); },
  });

  useFinancialEvents({
    onTransactionCreated: () => { load(); },
  });

  return { financialSummary, loading, reload: load };
}
