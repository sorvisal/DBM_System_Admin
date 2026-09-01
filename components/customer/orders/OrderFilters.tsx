"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { OrderDateRange, OrderStatusFilter } from "@/lib/types/customerOrderLink";

export const STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "delivering", label: "Out for Delivery" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const DATE_OPTIONS: { value: OrderDateRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "year", label: "This Year" },
];

export function OrderFilters({
  search,
  onSearch,
  status,
  onStatus,
  dateRange,
  onDateRange,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: OrderStatusFilter;
  onStatus: (v: OrderStatusFilter) => void;
  dateRange: OrderDateRange;
  onDateRange: (v: OrderDateRange) => void;
}) {
  return (
    <div className="rounded-xl border border-[#e2eaf6] bg-white p-2.5 sm:rounded-2xl sm:p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
        {/* Search — order number or product name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by order number or product…"
            className="pl-9 text-sm"
          />
        </div>

        {/* Status */}
        <Select value={status} onChange={(v) => onStatus(v as OrderStatusFilter)} className="w-full sm:w-40">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </Select>

        {/* Date range */}
        <Select value={dateRange} onChange={(v) => onDateRange(v as OrderDateRange)} className="w-full sm:w-36">
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}
