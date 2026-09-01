"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { listOrders, createOrder } from "@/lib/api/orders";
import { listProducts } from "@/lib/api/products";
import { getProductStockBatches } from "@/lib/api/stockBatches";
import { useCustomers } from "@/lib/hooks/useCustomers";
import type { OrderDto, ApiMeta, ProductDto, StockBatchSummaryDto } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { fmtDateTime, esc, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents, useFinancialEvents, ensureOrderConn } from "@/lib/notifications";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, WifiOff } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const { toast } = useToast();

  const { customers, loading: customersLoading } = useCustomers({ pageSize: 200 });
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [batchMap, setBatchMap] = useState<Record<number, StockBatchSummaryDto[]>>({});
  const [newOrderBusy, setNewOrderBusy] = useState(false);
  const [newOrderCustomerId, setNewOrderCustomerId] = useState("");
  const [newOrderDescription, setNewOrderDescription] = useState("");
  const [newOrderLines, setNewOrderLines] = useState<{ productId: number; qty: number; unitPrice: number; stockBatchId: number | null }[]>([
    { productId: 0, qty: 1, unitPrice: 0, stockBatchId: null },
  ]);
  const [newOrderError, setNewOrderError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await listOrders({ page, pageSize: 20, status: status || undefined });
      setOrders(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      // ignore – live fallback will handle it
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    listProducts({ pageSize: 200 }).then((r) => setProducts(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    const loadedIds = new Set<number>();
    for (const line of newOrderLines) {
      if (line.productId > 0 && !batchMap[line.productId] && !loadedIds.has(line.productId)) {
        loadedIds.add(line.productId);
        getProductStockBatches(line.productId)
          .then((r) => setBatchMap((prev) => ({ ...prev, [line.productId]: r.data ?? [] })))
          .catch(() => {});
      }
    }
  }, [newOrderLines, batchMap]);

  function handleAddLine() {
    setNewOrderLines((prev) => [...prev, { productId: 0, qty: 1, unitPrice: 0, stockBatchId: null }]);
  }

  function handleRemoveLine(idx: number) {
    setNewOrderLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleLineChange(idx: number, field: "productId" | "qty" | "unitPrice" | "stockBatchId", value: string | number) {
    setNewOrderLines((prev) =>
      prev.map((line, i) =>
        i === idx
          ? { ...line, [field]: field === "productId" ? parseInt(value as string, 10) : field === "stockBatchId" ? (parseInt(value as string, 10) || null) : field === "qty" ? Math.max(1, parseInt(value as string, 10) || 1) : parseFloat(value as string) || 0 }
          : line,
      ),
    );
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrderCustomerId) { setNewOrderError("Customer is required"); return; }
    const validLines = newOrderLines.filter((l) => l.productId > 0 && l.qty > 0);
    if (validLines.length === 0) { setNewOrderError("At least one product line is required"); return; }
    setNewOrderBusy(true);
    setNewOrderError("");
    try {
      await createOrder({
        customerId: parseInt(newOrderCustomerId, 10),
        lines: validLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          stockBatchId: l.stockBatchId,
        })),
        deliveryAddress: "",
        description: newOrderDescription.trim() || null,
      });
      toast("Order created", "ok");
      setShowNewOrder(false);
      setNewOrderCustomerId("");
      setNewOrderDescription("");
      setNewOrderLines([{ productId: 0, qty: 1, unitPrice: 0, stockBatchId: null }]);
      load();
    } catch (err) {
      setNewOrderError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setNewOrderBusy(false);
    }
  }

  useOrderEvents({
    onOrderStatusChanged(payload) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.id
            ? { ...o, status: payload.status as OrderStatus, updatedAt: new Date().toISOString() }
            : o,
        ),
      );
    },
    onOrderCreated(payload) {
      setOrders((prev) => [
        {
          id: payload.id,
          code: payload.code ?? null,
          customerId: 0,
          customerName: null,
          status: payload.status as OrderStatus,
          paymentStatus: null,
          deliveryAddress: null,
          driverName: null,
          driverPhone: null,
          totalAmount: 0,
          paidAmount: 0,
          paymentMethod: null,
          createdAt: new Date().toISOString(),
          confirmedAt: null,
          completedAt: null,
          deliveryStartedAt: null,
          lines: [],
          description: null,
          approvedByUserId: null,
          approvedAt: null,
          approvedByName: null,
        } as OrderDto,
        ...prev,
      ]);
    },
  });

  useFinancialEvents({
    onTransactionCreated: () => { load(); },
  });

  useEffect(() => {
    const conn = ensureOrderConn();
    if (!conn) setLiveUnavailable(true);
  }, []);

  const statusOptions: { value: OrderStatus | ""; label: string }[] = [
    { value: "", label: "All status" },
    { value: OrderStatus.Pending, label: "Pending" },
    { value: OrderStatus.Approved, label: "Approved" },
    { value: OrderStatus.Delivering, label: "Delivering" },
    { value: OrderStatus.Confirmed, label: "Confirmed" },
    { value: OrderStatus.Completed, label: "Completed" },
    { value: OrderStatus.Cancelled, label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track and manage customer orders.
            {liveUnavailable && <span className="ml-2 text-xs opacity-60 inline-flex items-center gap-1"><WifiOff size={12} /> Offline</span>}
          </p>
        </div>
        <Button onClick={() => setShowNewOrder(true)}>
          <Plus size={15} />
          New Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status} onChange={(v) => { setStatus(v as OrderStatus | ""); setPage(1); }} className="w-40">
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></svg>
              <span>No orders found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">{esc(o.code)}</div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{esc(o.customerName)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">${o.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><OrderStatusBadge status={o.status as OrderStatus} /></TableCell>
                    <TableCell>
                      <Badge variant={o.paymentStatus === "paid" ? "ok" : o.paymentStatus === "partial" ? "warn" : "default"}>
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDateTime(o.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <button type="button" onClick={() => router.push(`/admin/orders/${o.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-150">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3" aria-hidden="true"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" /></svg>
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">‹ Prev</button>
            <span>Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next ›</button>
          </div>
        )}
      </Card>

      <Dialog
        open={showNewOrder}
        onOpenChange={setShowNewOrder}
        title="Create Order"
        description="Add a new sales order"
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewOrder(false)} disabled={newOrderBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("new-order-form") as HTMLFormElement)?.requestSubmit()} disabled={newOrderBusy}>
              {newOrderBusy ? "Saving…" : "Create Order"}
            </Button>
          </>
        }
      >
        <form id="new-order-form" onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Customer <span className="text-red-500">*</span>
            </label>
            <select required value={newOrderCustomerId} onChange={(e) => setNewOrderCustomerId(e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
              <option value="">Select a customer…</option>
              {customersLoading ? (
                <option disabled>Loading…</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>{esc(c.name)} (ID: {c.id})</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={newOrderDescription} onChange={(e) => setNewOrderDescription(e.target.value)} rows={2} placeholder="Optional notes…" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Line Items</div>
            {newOrderLines.map((line, idx) => (
              <div key={idx} className="mb-2">
                <div className="grid grid-cols-[1fr_72px_auto] gap-2 items-end sm:grid-cols-[minmax(0,1.7fr)_80px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-2 sm:items-end">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block sm:hidden">Product</label>
                    <select value={String(line.productId)} onChange={(e) => {
                      const pid = parseInt(e.target.value, 10);
                      const prod = products.find((p) => p.id === pid);
                      handleLineChange(idx, "productId", pid);
                      if (prod) handleLineChange(idx, "unitPrice", String(prod.price));
                    }} className="w-full min-w-0 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                      <option value="0">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>{esc(p.name)} · ${p.price.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block sm:hidden">Qty</label>
                    <Input type="number" min="1" step="1" value={line.qty} onChange={(e) => handleLineChange(idx, "qty", e.target.value)} className="w-full min-w-0" />
                  </div>
                  <div className="hidden sm:block">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Batch</label>
                    <select
                      value={String(line.stockBatchId ?? "")}
                      onChange={(e) => {
                        const bid = e.target.value ? parseInt(e.target.value, 10) : null;
                        handleLineChange(idx, "stockBatchId", bid ?? "");
                      }}
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                    >
                      <option value="">Auto (FEFO)</option>
                      {(batchMap[line.productId] ?? []).map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.batchNumber ?? `Batch #${b.id}`} · EXP {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : "—"} · {b.availableQuantity} avail
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden sm:block">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Unit Price</label>
                    <Input type="number" step="0.01" min="0" value={line.unitPrice} onChange={(e) => handleLineChange(idx, "unitPrice", e.target.value)} />
                  </div>
                  <div className="sm:hidden">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Batch</label>
                    <select
                      value={String(line.stockBatchId ?? "")}
                      onChange={(e) => {
                        const bid = e.target.value ? parseInt(e.target.value, 10) : null;
                        handleLineChange(idx, "stockBatchId", bid ?? "");
                      }}
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                    >
                      <option value="">Auto (FEFO)</option>
                      {(batchMap[line.productId] ?? []).map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.batchNumber ?? `Batch #${b.id}`} · {b.availableQuantity} avail
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:hidden">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Unit Price</label>
                    <Input type="number" step="0.01" min="0" value={line.unitPrice} onChange={(e) => handleLineChange(idx, "unitPrice", e.target.value)} className="w-full" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveLine(idx)} className="self-start sm:self-center mb-0.5" title="Remove line">×</Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={handleAddLine} className="mt-1 text-xs">+ Add Line</Button>
          </div>
          {newOrderError && <p className="text-sm text-red-500">{newOrderError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
