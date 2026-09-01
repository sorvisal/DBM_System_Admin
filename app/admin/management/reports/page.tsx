"use client";

import { useEffect, useState } from "react";
import { getRevenue, getRevenueChart, getReceivables, exportReport } from "@/lib/api/reports";
import { getFinancialCashFlowChart, getFinancialSummary } from "@/lib/api/financialTransactions";
import { useFinancialEvents } from "@/lib/notifications";
import type { RevenueReportDto, RevenuePointDto, ReceivableDto, FinancialSummaryDto } from "@/lib/types";
import { fmtMoney, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { StatCard } from "@/components/ui/stat-card";

export default function ReportsPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  const [chartRange, setChartRange] = useState("7d");
  const [revenue, setRevenue] = useState<RevenueReportDto | null>(null);
  const [chart, setChart] = useState<RevenuePointDto[]>([]);
  const [receivables, setReceivables] = useState<ReceivableDto[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryDto | null>(null);
  const [cashFlowChart, setCashFlowChart] = useState<RevenuePointDto[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [rev, chartData, recv, finSummary, cashFlow] = await Promise.all([
        getRevenue(period),
        getRevenueChart(chartRange),
        getReceivables(),
        getFinancialSummary(),
        getFinancialCashFlowChart(chartRange),
      ]);
      setRevenue(rev.data ?? null);
      setChart(chartData.data ?? []);
      setReceivables(recv.data ?? []);
      setFinancialSummary(finSummary.data ?? null);
      setCashFlowChart(cashFlow.data ?? []);
    } catch {
      toast("Failed to load reports", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [period, chartRange]);

  useFinancialEvents({
    onTransactionCreated: () => { load(); },
  });

  async function handleExport(type: "excel" | "pdf") {
    try {
      await exportReport(type, period);
      toast(`Exported as ${type}`, "ok");
    } catch {
      toast("Export failed", "err");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-40 mb-2" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Revenue & Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Financial overview and receivables analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onChange={setPeriod} className="w-28">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")} className="gap-2">
            <Download size={14} /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="gap-2">
            <Download size={14} /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {revenue && (
          <StatCard
            label={`Revenue (${period})`}
            value={fmtMoney(revenue.revenue)}
            subtitle={`${fmtDate(revenue.from)} → ${fmtDate(revenue.to)}`}
          />
        )}
        <StatCard
          label="Outstanding Receivables"
          value={fmtMoney(receivables.reduce((s, r) => s + r.balance, 0))}
          subtitle={`${receivables.length} customers`}
        />
      </div>

      {/* Financial Summary Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sales"
            value={fmtMoney(financialSummary.totalSales)}
            subtitle="Money in"
            valueColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Total Purchases"
            value={fmtMoney(financialSummary.totalPurchases)}
            subtitle="Money out"
            valueColor="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Net Cash Flow"
            value={`${financialSummary.netCashFlow >= 0 ? "+" : ""}${fmtMoney(financialSummary.netCashFlow)}`}
            subtitle="Net position"
            valueColor={financialSummary.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
          <StatCard
            label="Current Balance"
            value={fmtMoney(financialSummary.currentBalance)}
            subtitle="Running total"
            valueColor={financialSummary.currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-3">
            <Select value={chartRange} onChange={setChartRange} className="w-32">
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="12m">12 months</option>
            </Select>
          </div>
          {chart.length > 0 ? (
            <RevenueChart data={chart} height={192} />
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">No data</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receivables by Customer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {receivables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((r) => (
                  <TableRow key={r.customerId}>
                    <TableCell className="font-medium text-sm">{r.customerName}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{fmtMoney(r.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-400 gap-2">
              <span>No outstanding receivables</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
