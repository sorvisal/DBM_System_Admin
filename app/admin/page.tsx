"use client";

import { useEffect, useState } from "react";
import { getRevenue, getRevenueChart, getReceivables, getProductSummary, getOrderCount, getCustomerCount } from "@/lib/api";
import { getFinancialSummary } from "@/lib/api/financialTransactions";
import { useFinancialEvents, useOrderEvents } from "@/lib/notifications";
import type { RevenueReportDto, RevenuePointDto, ReceivableDto, FinancialSummaryDto } from "@/lib/types";
import { fmtMoney, fmtDate } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { StatCard } from "@/components/ui/stat-card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalOrders: 0,
    totalCustomers: 0,
    revenue: 0,
    revenuePeriod: null as RevenueReportDto | null,
    revenueChart: [] as RevenuePointDto[],
    receivables: [] as ReceivableDto[],
    financialSummary: null as FinancialSummaryDto | null,
  });
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("7d");

  async function loadDashboard() {
    try {
      const [summary, orders, customers, revenue, chart, receivables, financialSummary] = await Promise.all([
        getProductSummary(),
        getOrderCount(),
        getCustomerCount(),
        getRevenue("month"),
        getRevenueChart(chartRange),
        getReceivables(),
        getFinancialSummary(),
      ]);
      setStats({
        totalProducts: summary.data?.totalSkus ?? 0,
        lowStockCount: summary.data?.lowStockCount ?? 0,
        expiringCount: summary.data?.expiringCount ?? 0,
        totalOrders: orders.data ?? 0,
        totalCustomers: customers.data ?? 0,
        revenue: revenue.data?.revenue ?? 0,
        revenuePeriod: revenue.data ?? null,
        revenueChart: chart.data ?? [],
        receivables: receivables.data ?? [],
        financialSummary: financialSummary.data ?? null,
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [chartRange]);

  useOrderEvents({
    onOrderStatusChanged: () => { loadDashboard(); },
  });

  useFinancialEvents({
    onTransactionCreated: () => { loadDashboard(); },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your distribution operations.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmtMoney(stats.revenue)}
          subtitle={stats.revenuePeriod ? `${fmtDate(stats.revenuePeriod.from)} → ${fmtDate(stats.revenuePeriod.to)}` : "This month"}
          icon={<ArrowUpRight size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          subtitle="All time"
          icon={<ShoppingCart size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          subtitle="Active customers"
          icon={<Users size={16} />}
          iconColor="text-purple-500"
        />
        <StatCard
          label="Low Stock Items"
          value={stats.lowStockCount.toLocaleString()}
          subtitle={stats.expiringCount > 0 ? `${stats.expiringCount} expiring` : undefined}
          icon={<AlertTriangle size={16} />}
          iconColor={stats.lowStockCount > 0 ? "text-amber-500" : "text-slate-400"}
          warning={stats.lowStockCount > 0}
        />
      </div>

      {/* Financial Summary */}
      {stats.financialSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sales"
            value={fmtMoney(stats.financialSummary.totalSales)}
            subtitle="Money in"
            valueColor="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Total Purchases"
            value={fmtMoney(stats.financialSummary.totalPurchases)}
            subtitle="Money out"
            valueColor="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Net Cash Flow"
            value={`${stats.financialSummary.netCashFlow >= 0 ? "+" : ""}${fmtMoney(stats.financialSummary.netCashFlow)}`}
            subtitle="Net position"
            valueColor={stats.financialSummary.netCashFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
          <StatCard
            label="Current Balance"
            value={fmtMoney(stats.financialSummary.currentBalance)}
            subtitle="Running total"
            valueColor={stats.financialSummary.currentBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
          />
        </div>
      )}

      {/* Charts and tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
            <Select value={chartRange} onChange={(v) => setChartRange(v)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="12m">Last 12 months</option>
            </Select>
          </CardHeader>
          <CardContent>
            {stats.revenueChart.length > 0 ? (
              <RevenueChart data={stats.revenueChart} height={192} />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400 dark:text-slate-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receivables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <a href="/admin/management/reports" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              View all
            </a>
          </CardHeader>
          <CardContent>
            {stats.receivables.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.receivables.slice(0, 8).map((r) => (
                    <TableRow key={r.customerId}>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmtMoney(r.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-sm text-slate-400 gap-2">
                <Package size={28} className="opacity-30" />
                <span>No outstanding receivables</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
