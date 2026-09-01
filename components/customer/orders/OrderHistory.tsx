"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/app/order/[token]/portal-context";
import { useCustomerOrderEvents } from "@/app/order/[token]/use-portal-realtime";
import {
  getPublicProducts,
  publicMyOrdersPaged,
} from "@/lib/api/publicCustomerOrders";
import type {
  OrderDateRange,
  OrderStatusFilter,
  PublicOrderHistoryDto,
  PublicOrdersPageDto,
} from "@/lib/types/customerOrderLink";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast";
import { OrderCard } from "./OrderCard";
import { OrderFilters } from "./OrderFilters";
import { OrderDetailModal } from "./OrderDetailModal";

const PAGE_SIZE = 20;

function rangeBounds(range: OrderDateRange): { dateFrom?: string; dateTo?: string } {
  if (range === "all") return {};
  const now = new Date();
  let from: Date;
  switch (range) {
    case "today": from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "7d": from = new Date(now.getTime() - 7 * 24 * 3600 * 1000); break;
    case "30d": from = new Date(now.getTime() - 30 * 24 * 3600 * 1000); break;
    case "year": from = new Date(now.getFullYear(), 0, 1); break;
    default: return {};
  }
  return { dateFrom: from.toISOString(), dateTo: new Date(now.getTime() + 1000).toISOString() };
}

export function OrderHistory() {
  const { token, session, storeName, addToCart } = usePortal();
  const router = useRouter();
  const { toast } = useToast();
  const base = `/order/${token}`;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("");
  const [dateRange, setDateRange] = useState<OrderDateRange>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [data, setData] = useState<PublicOrdersPageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState<PublicOrderHistoryDto | null>(null);
  const [reorderBusyId, setReorderBusyId] = useState<number | null>(null);

  // debounce the search box so typing doesn't hammer the API
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounced(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError("");
    try {
      const bounds = rangeBounds(dateRange);
      const json = await publicMyOrdersPaged(
        token,
        {
          page,
          pageSize: PAGE_SIZE,
          search: searchDebounced || undefined,
          status: statusFilter || undefined,
          ...bounds,
        },
        session.accessToken,
      );
      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [token, session?.accessToken, page, statusFilter, dateRange, searchDebounced]);

  useEffect(() => { load(); }, [load]);

  // Real-time: any admin action on this customer's orders refreshes the view instantly.
  const loadRef = useRef(load);
  loadRef.current = load;
  useCustomerOrderEvents((e) => {
    toast(`Order #${e.code}: ${e.status}`, "info");
    loadRef.current();
  });

  function changeStatus(v: OrderStatusFilter) { setStatusFilter(v); setPage(1); }
  function changeRange(v: OrderDateRange) { setDateRange(v); setPage(1); }

  const hasActiveFilters =
    Boolean(searchDebounced) || Boolean(statusFilter) || dateRange !== "all";

  async function handleReorder(order: PublicOrderHistoryDto) {
    setReorderBusyId(order.orderId);
    try {
      const prodsJson = await getPublicProducts(token);
      const map = new Map((prodsJson.data ?? []).map((p) => [p.id, p]));
      let added = 0;
      let skipped = 0;
      for (const line of order.lines) {
        const p = map.get(line.productId);
        if (!p || !p.inStock) { skipped += line.qty; continue; }
        addToCart(p, Math.min(line.qty, p.stockQty));
        added += 1;
      }
      if (added > 0) {
        toast(`Added ${added} product${added === 1 ? "" : "s"} to your cart${skipped ? ` — ${skipped} item(s) unavailable` : ""}`, "ok");
        router.push(`${base}/cart`);
      } else {
        toast("These products are no longer available", "warn");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reorder", "err");
    } finally {
      setReorderBusyId(null);
    }
  }

  const summary = data?.summary;
  const filtersActive = hasActiveFilters;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <OrderFilters
        search={searchInput}
        onSearch={setSearchInput}
        status={statusFilter}
        onStatus={changeStatus}
        dateRange={dateRange}
        onDateRange={changeRange}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total Orders" value={summary?.totalOrders ?? 0} tone="text-[#1255bc]" bg="bg-blue-50" />
        <SummaryCard label="Completed" value={summary?.completed ?? 0} tone="text-emerald-600" bg="bg-emerald-50" />
        <SummaryCard label="In Progress" value={summary?.inProgress ?? 0} tone="text-[#a46b00]" bg="bg-[#fff6db]" />
        <SummaryCard label="Cancelled" value={summary?.cancelled ?? 0} tone="text-red-600" bg="bg-red-50" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => load()}>Try again</Button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      )}

      {/* Empty states */}
      {!loading && !error && data && data.items.length === 0 && (
        <div className="rounded-2xl border border-[#e2eaf6] bg-white py-12 text-center">
          <div className="mb-2 text-4xl">{filtersActive ? "🔍" : "🧾"}</div>
          <h3 className="font-bold text-slate-700">No orders found</h3>
          <p className="mx-auto mt-1 max-w-xs px-4 text-xs text-slate-400">
            {filtersActive
              ? "You don't have any orders matching your search or filter."
              : "You don't have any orders yet — browse products to place your first order."}
          </p>
          <div className="mt-4 space-x-2">
            {filtersActive && (
              <Button variant="outline" size="sm" onClick={() => {
                setSearchInput(""); setStatusFilter(""); setDateRange("all"); setPage(1);
              }}>
                Clear filters
              </Button>
            )}
            <Button size="sm" onClick={() => router.push(`${base}/products`)}>Browse products</Button>
          </div>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.items.map((o) => (
              <OrderCard
                key={o.orderId}
                order={o}
                onViewDetails={() => setDetail(o)}
                onReorder={() => handleReorder(o)}
                reorderBusy={reorderBusyId === o.orderId}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data.summary.totalOrders > PAGE_SIZE || page > 1) && (
            <div className="flex items-center justify-between rounded-2xl border border-[#e2eaf6] bg-white px-4 py-3 text-sm text-slate-500">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">
                ← Prev
              </button>
              <span>
                Page <b>{page}</b> of{" "}
                <b>{Math.max(1, Math.ceil(data.summary.totalOrders / PAGE_SIZE))}</b>
                <span className="ml-2 hidden sm:inline">· {data.summary.totalOrders} order(s)</span>
                {loading && <span className="ml-2 animate-pulse text-[#0d63ff]">loading…</span>}
              </span>
              <button onClick={() => setPage((p) => p + 1)}
                disabled={loading || page >= Math.ceil(data.summary.totalOrders / PAGE_SIZE)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800">
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      <OrderDetailModal
        order={detail}
        storeName={storeName}
        onClose={() => setDetail(null)}
        onReorder={async () => { if (detail) await handleReorder(detail); }}
        reorderBusy={detail != null && reorderBusyId === detail.orderId}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone, bg }: { label: string; value: number; tone: string; bg: string }) {
  return (
    <div className={`rounded-2xl p-3.5 ${bg}`}>
      <div className={`text-xl font-black ${tone}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
}
