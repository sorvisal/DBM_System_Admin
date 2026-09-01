"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listPurchaseOrders, createPurchaseOrder, payPurchaseOrder } from "@/lib/api/purchaseOrders";
import { listProducts } from "@/lib/api/products";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import type { PurchaseOrderDto, ApiMeta, ProductDto } from "@/lib/types";
import { PurchaseOrderStatus } from "@/lib/types";
import { fmtDateTime, esc, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign } from "lucide-react";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewPO, setShowNewPO] = useState(false);
  const { toast } = useToast();

  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [newPOBusy, setNewPOBusy] = useState(false);
  const [newPOSupplierId, setNewPOSupplierId] = useState("");
  const [newPODescription, setNewPODescription] = useState("");
  const [newPOLines, setNewPOLines] = useState<{ productId: number; qty: number; manufactureDate: string; expiryDate: string }[]>([
    { productId: 0, qty: 1, manufactureDate: "", expiryDate: "" },
  ]);
  const [newPOError, setNewPOError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const json = await listPurchaseOrders({ page, pageSize: 20, status: status || undefined });
      setOrders(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, status, refreshTick]);

  // Live updates: PO status changes (confirm/receive) and payments refresh without reload.
  useOrderEvents({
    onPoStatusChanged: (p) => {
      setRefreshTick((t) => t + 1);
      if (p?.status) toast(`Purchase order #${p.id} → ${p.status}`, "info");
    },
  });
  useFinancialEvents({
    onTransactionCreated: () => setRefreshTick((t) => t + 1),
  });

  useEffect(() => {
    listProducts({ pageSize: 200 }).then((r) => setProducts(r.data ?? [])).catch(() => {});
  }, []);

  function handleAddLine() {
    setNewPOLines((prev) => [...prev, { productId: 0, qty: 1, manufactureDate: "", expiryDate: "" }]);
  }

  function handleRemoveLine(idx: number) {
    setNewPOLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleLineChange(idx: number, field: "productId" | "qty" | "manufactureDate" | "expiryDate", value: string | number) {
    setNewPOLines((prev) =>
      prev.map((line, i) =>
        i === idx
          ? { ...line, [field]: field === "productId" ? parseInt(value as string, 10) : field === "qty" ? parseFloat(value as string) || 0 : value }
          : line,
      ),
    );
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    if (!newPOSupplierId) { setNewPOError("Supplier is required"); return; }
    const validLines = newPOLines.filter((l) => l.productId > 0 && l.qty > 0);
    if (validLines.length === 0) { setNewPOError("At least one product line is required"); return; }
    setNewPOBusy(true);
    setNewPOError("");
    try {
      await createPurchaseOrder({
        supplierId: parseInt(newPOSupplierId, 10),
        lines: validLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          manufactureDate: l.manufactureDate || null,
          expiryDate: l.expiryDate || null,
        })),
        description: newPODescription.trim() || null,
      });
      toast("Purchase order created", "ok");
      setShowNewPO(false);
      setNewPOSupplierId("");
      setNewPODescription("");
      setNewPOLines([{ productId: 0, qty: 1, manufactureDate: "", expiryDate: "" }]);
      load();
    } catch (err) {
      setNewPOError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setNewPOBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track and manage purchase orders from suppliers.
          </p>
        </div>
        <Button onClick={() => setShowNewPO(true)}>
          <Plus size={15} />
          New PO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} className="w-40">
            <option value="">All status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Delivering">Delivering</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <span>No purchase orders found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO#</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm font-medium">{esc(po.code)}</TableCell>
                    <TableCell className="font-medium text-sm">{esc(po.supplierName)}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><PurchaseOrderStatusBadge status={po.status as PurchaseOrderStatus} /></TableCell>
                    <TableCell>
                      <Badge variant={po.paymentStatus === "paid" ? "ok" : po.paymentStatus === "partial" ? "warn" : "default"}>
                        {po.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDateTime(po.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {po.paymentStatus !== "paid" && po.status !== "Completed" && po.status !== "Cancelled" && (
                          <RecordPaymentButton order={po} onPaid={load} />
                        )}
                        <button type="button" onClick={() => router.push(`/admin/purchase-orders/${po.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-150">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3" aria-hidden="true"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" /></svg>
                          View
                        </button>
                      </div>
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
        open={showNewPO}
        onOpenChange={setShowNewPO}
        title="Create Purchase Order"
        description="Add a new purchase order from a supplier"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewPO(false)} disabled={newPOBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("new-po-form") as HTMLFormElement)?.requestSubmit()} disabled={newPOBusy}>
              {newPOBusy ? "Saving…" : "Create PO"}
            </Button>
          </>
        }
      >
        <form id="new-po-form" onSubmit={handleCreatePO} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select required value={newPOSupplierId} onChange={(e) => setNewPOSupplierId(e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
              <option value="">Select a supplier…</option>
              {suppliersLoading ? (
                <option disabled>Loading…</option>
              ) : (
                suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>{esc(s.name)} (ID: {s.id})</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={newPODescription} onChange={(e) => setNewPODescription(e.target.value)} rows={2} placeholder="Optional notes…" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Line Items</div>
            {newPOLines.map((line, idx) => (
              <div key={idx} className="mb-2">
                <div className="grid grid-cols-[1fr_64px_auto] gap-2 items-end sm:grid-cols-[minmax(0,1.7fr)_80px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-2 sm:items-end">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block sm:hidden">Product</label>
                    <select value={String(line.productId)} onChange={(e) => handleLineChange(idx, "productId", e.target.value)} className="w-full min-w-0 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                      <option value="0">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>{esc(p.name)} · ${p.price.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block sm:hidden">Qty</label>
                    <Input type="number" min="1" value={line.qty} onChange={(e) => handleLineChange(idx, "qty", e.target.value)} className="w-full min-w-0" />
                  </div>
                  <div className="hidden sm:block">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Mfg Date</label>
                    <Input type="date" value={line.manufactureDate} onChange={(e) => handleLineChange(idx, "manufactureDate", e.target.value)} />
                  </div>
                  <div className="hidden sm:block">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Expiry Date</label>
                    <Input type="date" value={line.expiryDate} onChange={(e) => handleLineChange(idx, "expiryDate", e.target.value)} />
                  </div>
                  {/* Mobile date rows */}
                  <div className="sm:hidden">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Mfg Date</label>
                    <Input type="date" value={line.manufactureDate} onChange={(e) => handleLineChange(idx, "manufactureDate", e.target.value)} className="w-full" />
                  </div>
                  <div className="sm:hidden">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Expiry Date</label>
                    <Input type="date" value={line.expiryDate} onChange={(e) => handleLineChange(idx, "expiryDate", e.target.value)} className="w-full" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveLine(idx)} className="mb-0.5 self-start sm:self-center" title="Remove line">×</Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={handleAddLine} className="mt-1 text-xs">+ Add Line</Button>
          </div>
          {newPOError && <p className="text-sm text-red-500">{newPOError}</p>}
        </form>
      </Dialog>
    </div>
  );
}

function RecordPaymentButton({ order, onPaid }: { order: PurchaseOrderDto; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(order.totalAmount - order.paidAmount));
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function handlePay() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast("Invalid payment amount", "err"); return; }
    setBusy(true);
    try {
      await payPurchaseOrder(order.id, { amount: amt, method });
      toast("Payment recorded", "ok");
      setOpen(false);
      onPaid();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1 text-xs">
        <DollarSign size={13} /> Pay
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Record Payment"
        description={`Order ${order.code}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handlePay} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Amount Due</p>
            <p className="text-lg font-semibold">${(order.totalAmount - order.paidAmount).toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Payment Amount</label>
            <Input id="pay-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Method</label>
            <Select value={method} onChange={setMethod}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
            </Select>
          </div>
        </div>
      </Dialog>
    </>
  );
}
