"use client";

import { useEffect, useState } from "react";
import { useRequireSuperAdmin } from "@/lib/platform";
import { getSuperAdminDashboard } from "@/lib/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Building2, Package, Archive, ShoppingCart,
  FileText, DollarSign, AlertTriangle, Clock, CheckCircle,
  CreditCard, Activity,
} from "lucide-react";

export default function SuperAdminDashboardPage() {
  const isSuperAdmin = useRequireSuperAdmin();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    getSuperAdminDashboard()
      .then((json) => {
        if (json.success) setStats(json.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-red-500 py-8">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">SuperAdmin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Global overview of the entire DBM platform.</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Admins"
          value={stats.totalAdmins?.toLocaleString() ?? "0"}
          subtitle={`${stats.activeAdmins ?? 0} active`}
          icon={<Users size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Total Depots"
          value={stats.totalDepots?.toLocaleString() ?? "0"}
          subtitle={`${stats.activeDepots ?? 0} active`}
          icon={<Building2 size={16} />}
          iconColor="text-purple-500"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers?.toLocaleString() ?? "0"}
          subtitle="All organizations"
          icon={<Users size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Total Products"
          value={stats.totalProducts?.toLocaleString() ?? "0"}
          subtitle="All depots"
          icon={<Package size={16} />}
          iconColor="text-amber-500"
        />
        <StatCard
          label="Total Inventory"
          value={stats.totalInventory?.toLocaleString() ?? "0"}
          subtitle="Units across batches"
          icon={<Archive size={16} />}
          iconColor="text-slate-500"
        />
      </div>

      {/* Warnings */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Low Stock Products"
          value={stats.lowStockProducts?.toLocaleString() ?? "0"}
          subtitle="Below threshold"
          icon={<AlertTriangle size={16} />}
          iconColor={stats.lowStockProducts > 0 ? "text-amber-500" : "text-slate-400"}
          warning={stats.lowStockProducts > 0}
        />
        <StatCard
          label="Expired Batches"
          value={stats.expiredBatches?.toLocaleString() ?? "0"}
          subtitle="Past expiry date"
          icon={<Clock size={16} />}
          iconColor={stats.expiredBatches > 0 ? "text-red-500" : "text-slate-400"}
          warning={stats.expiredBatches > 0}
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders?.toLocaleString() ?? "0"}
          subtitle="Awaiting approval"
          icon={<Clock size={16} />}
          iconColor="text-amber-500"
        />
        <StatCard
          label="Completed Orders"
          value={stats.completedOrders?.toLocaleString() ?? "0"}
          subtitle="All time"
          icon={<CheckCircle size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Total Revenue"
          value={`$${(stats.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="All sales"
          icon={<DollarSign size={16} />}
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Customer Orders"
          value={stats.totalCustomerOrders?.toLocaleString() ?? "0"}
          subtitle="All orders"
          icon={<ShoppingCart size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Purchase Orders"
          value={stats.totalPurchaseOrders?.toLocaleString() ?? "0"}
          subtitle="All purchases"
          icon={<FileText size={16} />}
          iconColor="text-purple-500"
        />
        <StatCard
          label="Pending Payments"
          value={stats.pendingPayments?.toLocaleString() ?? "0"}
          subtitle="Awaiting"
          icon={<CreditCard size={16} />}
          iconColor="text-amber-500"
        />
        <StatCard
          label="Completed Payments"
          value={stats.completedPayments?.toLocaleString() ?? "0"}
          subtitle="All time"
          icon={<CheckCircle size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Activity"
          value=""
          subtitle="Platform running"
          icon={<Activity size={16} />}
          iconColor="text-slate-400"
        />
      </div>
    </div>
  );
}
