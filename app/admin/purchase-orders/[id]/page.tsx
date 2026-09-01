"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  deletePurchaseOrder,
  payPurchaseOrder,
} from "@/lib/api/purchaseOrders";
import type { PurchaseOrderDto } from "@/lib/types";
import { PurchaseOrderStatus } from "@/lib/types";
import { Badge, esc, fmtDateTime } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge";
import { useAuth } from "@/lib/auth";
import { CheckCircle, DollarSign, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const poId = parseInt(params.id as string, 10);

  const [po, setPo] = useState<PurchaseOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyReceive, setBusyReceive] = useState(false);

  useEffect(() => {
    if (isNaN(poId)) return;
    getPurchaseOrder(poId)
      .then((r) => setPo(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [poId]);

  useOrderEvents({
    onOrderStatusChanged(payload) {
      if (payload.id !== poId) return;
      setPo((prev) => {
        if (!prev) return prev;
        return { ...prev, status: payload.status as PurchaseOrderStatus };
      });
    },
    onPoStatusChanged(payload) {
      if (payload.id !== poId) return;
      setPo((prev) => {
        if (!prev) return prev;
        return { ...prev, status: payload.status as PurchaseOrderStatus };
      });
    },
  });

  useFinancialEvents({
    onTransactionCreated: () => {
      getPurchaseOrder(poId).then((r) => setPo(r.data ?? null)).catch(() => {});
    },
  });

  async function handleAction(fn: () => Promise<unknown>) {
    try {
      await fn();
      toast("Action completed", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function handleConfirm() {
    if (!po || po.status !== PurchaseOrderStatus.Pending) return;
    try {
      const result = await confirmPurchaseOrder(poId);
      if (result.data) setPo(result.data);
      toast("Purchase order confirmed", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Confirm failed", "err");
    }
  }

  async function handleReceive() {
    if (!po) return;
    setBusyReceive(true);
    try {
      const result = await receivePurchaseOrder(poId);
      if (result.data) {
        setPo(result.data);
        toast("Stock received", "ok");
        router.push("/admin/purchase-orders");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Receive failed", "err");
    } finally {
      setBusyReceive(false);
    }
  }

  async function handleDelete() {
    if (!po) return;
    if (!confirm("Delete this purchase order?")) return;
    try {
      await deletePurchaseOrder(poId);
      toast("PO deleted", "ok");
      router.push("/admin/purchase-orders");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-500 p-4">{error}</div>;
  if (!po) return <div className="flex flex-col items-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2"><span>Purchase order not found</span></div>;

  const canConfirm = po.status === PurchaseOrderStatus.Pending;
  const canReceive = po.status === PurchaseOrderStatus.Confirmed && po.paymentStatus === "paid";
  const isUnpaidConfirmed = po.status === PurchaseOrderStatus.Confirmed && po.paymentStatus !== "paid";
  const canPay = po.paymentStatus !== "paid" && po.status !== PurchaseOrderStatus.Completed && po.status !== PurchaseOrderStatus.Cancelled;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{esc(po.code)}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Created {fmtDateTime(po.createdAt)} · {(po.lines ?? []).length} items</p>
          </div>
          <PurchaseOrderStatusBadge status={po.status as PurchaseOrderStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar fallback={(po.supplierName ?? "").slice(0, 2).toUpperCase()} className="w-10 h-10 text-sm" />
              <div>
                <div className="font-medium text-sm">{esc(po.supplierName)}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">ID: {po.supplierId}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Status</span><PurchaseOrderStatusBadge status={po.status as PurchaseOrderStatus} /></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Payment</span><Badge variant={po.paymentStatus === "paid" ? "ok" : po.paymentStatus === "partial" ? "warn" : "default"}>{po.paymentStatus}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Total</span><span className="font-mono font-semibold">${po.totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Paid</span><span className="font-mono font-semibold">${po.paidAmount.toFixed(2)}</span></div>
              {po.paymentMethod && (
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Method</span><span className="font-medium">{esc(po.paymentMethod)}</span></div>
              )}
              {po.confirmedAt && (
                <div className="text-sm text-slate-500 dark:text-slate-400">✅ Confirmed on {fmtDateTime(po.confirmedAt)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Mfg</TableHead>
                <TableHead>Exp</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.lines?.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{esc(l.productName)}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{esc(l.batchNumber ?? "—")}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.manufactureDate ? fmtDateTime(l.manufactureDate) : "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{l.expiryDate ? fmtDateTime(l.expiryDate) : "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.qty}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${(l.unitCost ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">${(l.lineTotal ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {canConfirm && (
              <Button onClick={handleConfirm} className="gap-2">
                <ShieldCheck size={15} />
                Confirm
              </Button>
            )}
            {canReceive && (
              <Button variant="outline" onClick={() => handleAction(handleReceive)} className="gap-2" disabled={busyReceive}>
                <CheckCircle size={15} /> Receive
              </Button>
            )}
            {isUnpaidConfirmed && (
              <Button variant="outline" disabled className="gap-2 opacity-50 cursor-not-allowed">
                <CheckCircle size={15} /> Receive
                <span className="text-xs text-amber-500 ml-1">(Pay first)</span>
              </Button>
            )}
            {canPay && (
              <PaymentModal po={po} poId={poId} onSubmit={() => { getPurchaseOrder(poId).then((r) => setPo(r.data ?? null)).catch(() => {}); }} />
            )}
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 gap-2">
              Delete
            </Button>
            <Button variant="ghost" onClick={() => router.push("/admin/purchase-orders")}>Back to Purchase Orders</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentModal({ po, poId, onSubmit }: { po: PurchaseOrderDto; poId: number; onSubmit: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(po.totalAmount - po.paidAmount));
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function handlePay() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast("Invalid payment amount", "err"); return; }
    setBusy(true);
    try {
      await payPurchaseOrder(poId, { amount: amt, method });
      toast("Payment recorded", "ok");
      setOpen(false);
      onSubmit();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <DollarSign size={15} /> Record Payment
      </Button>
      <Dialog
        open={open} onOpenChange={setOpen} title="Record Payment" description={`Purchase order ${po.code}`}
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
            <p className="text-lg font-semibold">${(po.totalAmount - po.paidAmount).toFixed(2)}</p>
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
