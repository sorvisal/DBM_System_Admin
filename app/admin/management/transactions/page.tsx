"use client";

import { useEffect, useState } from "react";
import {
  listFinancialTransactions,
  getFinancialSummary,
} from "@/lib/api/financialTransactions";
import type {
  FinancialTransactionDto,
  FinancialSummaryDto,
} from "@/lib/types";
import { fmtMoney, fmtDateTime } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useFinancialEvents } from "@/lib/notifications";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function FinancialTransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransactionDto[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [txns, summaryData] = await Promise.all([
          listFinancialTransactions({ page, pageSize: 20 }),
          getFinancialSummary(),
        ]);
        setTransactions(txns.data ?? []);
        setTotal(txns.meta?.total ?? 0);
        setSummary(summaryData.data ?? null);
      } catch (err) {
        toast("Failed to load transactions", "err");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, toast]);

  useFinancialEvents({
    onTransactionCreated: () => {
      // Reload when a new transaction is created
      setLoading(true);
      listFinancialTransactions({ page, pageSize: 20 })
        .then((txns) => {
          setTransactions(txns.data ?? []);
          setTotal(txns.meta?.total ?? 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      getFinancialSummary()
        .then((s) => setSummary(s.data ?? null))
        .catch(() => {});
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return (
      <span className={amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {prefix}
        {fmtMoney(Math.abs(amount))}
      </span>
    );
  };

  const formatType = (type: string) => {
    const isPositive = type === "SALE" || type === "PURCHASE_RETURN";
    return (
      <span className={`flex items-center gap-1 ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Financial Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Complete transaction history with cash flow tracking.</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sales"
            value={fmtMoney(summary.totalSales)}
            subtitle="Money in"
            valueColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Total Purchases"
            value={fmtMoney(summary.totalPurchases)}
            subtitle="Money out"
            valueColor="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Net Cash Flow"
            value={`${summary.netCashFlow >= 0 ? "+" : ""}${fmtMoney(summary.netCashFlow)}`}
            subtitle="Net position"
            valueColor={summary.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
          <StatCard
            label="Current Balance"
            value={fmtMoney(summary.currentBalance)}
            subtitle="Running total"
            valueColor={summary.currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium text-sm">{fmtDateTime(txn.transactionDate)}</TableCell>
                    <TableCell>{formatType(txn.transactionType)}</TableCell>
                    <TableCell className="text-sm">
                      {txn.referenceType === "ORDER" ? (
                        <a href={`/admin/orders/${txn.referenceId}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          {txn.referenceCode ?? `#${txn.referenceId}`}
                        </a>
                      ) : txn.referenceType === "PURCHASE_ORDER" ? (
                        <a href={`/admin/purchase-orders/${txn.referenceId}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          {txn.referenceCode ?? `#${txn.referenceId}`}
                        </a>
                      ) : (
                        <span className="text-slate-500">{txn.referenceCode}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatAmount(txn.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {txn.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 gap-2">
              <DollarSign size={32} className="opacity-30" />
              <span>No transactions yet</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500 self-center">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
