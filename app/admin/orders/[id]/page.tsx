"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOrder,
  approveOrder,
  startDeliveryOrder,
  confirmOrder,
  completeOrder,
  uncompleteOrder,
  payOrder,
} from "@/lib/api/orders";
import type { OrderDto } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { Badge, esc, fmtDateTime } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents } from "@/lib/notifications";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useAuth } from "@/lib/auth";
import {
  CheckCircle,
  DollarSign,
  Upload,
  ShieldCheck,
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderId = parseInt(params.id as string, 10);

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delivery modal state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  // Generic loading state per action
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(orderId)) return;
    getOrder(orderId)
      .then((r) => setOrder(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useOrderEvents({
    onOrderStatusChanged(payload) {
      if (payload.id !== orderId) return;
      setOrder((prev) => {
        if (!prev) return prev;
        return { ...prev, status: payload.status as OrderStatus };
      });
    },
  });

  async function reFetchOrder() {
    try {
      const r = await getOrder(orderId);
      if (r.data) setOrder(r.data);
    } catch { /* ignore */ }
  }

  async function setAction(name: string, fn: () => Promise<void>) {
    setActionLoading(name);
    try {
      await fn();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Action failed", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove() {
    if (!order || order.status !== OrderStatus.Pending) return;
    await setAction("approve", async () => {
      const result = await approveOrder(orderId);
      if (result.data) {
        setOrder(result.data);
        toast("Order approved — stock deducted", "ok");
      }
    });
  }

  function openDeliveryModal() {
    setDeliveryAddress(order?.deliveryAddress ?? "");
    setDriverName("");
    setDriverPhone("");
    setDeliveryError("");
    setDeliveryModalOpen(true);
  }

  async function handleConfirmDelivery() {
    if (!deliveryAddress.trim() || !driverName.trim() || !driverPhone.trim()) {
      setDeliveryError("All fields (address, driver name, driver phone) are required.");
      return;
    }
    setDeliverySubmitting(true);
    setDeliveryError("");
    try {
      const result = await startDeliveryOrder(orderId, {
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });
      if (result.data) {
        setOrder(result.data);
        setDeliveryModalOpen(false);
        toast("Delivery started — order is now out for delivery", "ok");
      }
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Failed to start delivery");
      toast(err instanceof Error ? err.message : "Failed to start delivery", "err");
    } finally {
      setDeliverySubmitting(false);
    }
  }

  async function handleConfirmDeliveryStatus() {
    if (!order || order.status !== OrderStatus.Delivering) return;
    await setAction("confirm", async () => {
      const result = await confirmOrder(orderId);
      if (result.data) {
        setOrder(result.data);
        toast("Delivery confirmed", "ok");
      }
    });
  }

  async function handleComplete() {
    if (!order || order.status !== OrderStatus.Confirmed) return;
    await setAction("complete", async () => {
      const result = await completeOrder(orderId);
      if (result.data) {
        setOrder(result.data);
        toast("Order completed", "ok");
      }
    });
  }

  async function handleUncomplete() {
    if (!order || order.status !== OrderStatus.Completed) return;
    await setAction("uncomplete", async () => {
      const result = await uncompleteOrder(orderId);
      if (result.data) setOrder(result.data);
    });
  }

  const canApprove = order?.status === OrderStatus.Pending && (user?.role === "superadmin" || user?.role === "admin");
  const canAddDelivery = order?.status === OrderStatus.Approved;
  const canConfirm = order?.status === OrderStatus.Delivering;
  const canComplete = order?.status === OrderStatus.Confirmed;
  const canUncomplete = order?.status === OrderStatus.Completed;
  const canPay = order?.paymentStatus !== "paid";
  const hasDelivery = order?.driverName || order?.driverPhone || order?.deliveryAddress;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{esc(order?.code ?? "")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Placed on {fmtDateTime(order?.createdAt)}</p>
          </div>
          {order && <OrderStatusBadge status={order.status as OrderStatus} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {order && (
              <div className="flex items-center gap-3">
                <Avatar fallback={(order.customerName ?? "").slice(0, 2).toUpperCase()} className="w-10 h-10 text-sm" />
                <div>
                  <div className="font-medium text-sm">{esc(order.customerName)}</div>
                  <div className="text-xs text-slate-400">ID: {order.customerId}</div>
                </div>
              </div>
            )}
            {order?.deliveryAddress && (
              <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin size={13} /> {esc(order.deliveryAddress)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            {order && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment</span>
                  <Badge variant={order.paymentStatus === "paid" ? "ok" : order.paymentStatus === "partial" ? "warn" : "default"}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total</span>
                  <span className="font-mono font-semibold">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Paid</span>
                  <span className="font-mono font-semibold">${order.paidAmount.toFixed(2)}</span>
                </div>
                {order.approvedAt && order.approvedByName && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    ✅ Approved by <strong>{esc(order.approvedByName)}</strong> on {fmtDateTime(order.approvedAt)}
                  </div>
                )}
                {order.deliveryStartedAt && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Delivery started on {fmtDateTime(order.deliveryStartedAt)}
                  </div>
                )}
                {order.confirmedAt && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Confirmed on {fmtDateTime(order.confirmedAt)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Information Card */}
      {hasDelivery && order && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>
              {order.deliveryAddress && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{esc(order.deliveryAddress)}</span>
                </div>
              )}
              {order.driverName && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{esc(order.driverName)}</span>
                </div>
              )}
              {order.driverPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{esc(order.driverPhone)}</span>
                </div>
              )}
              {order.deliveryStartedAt && (
                <div className="text-xs text-slate-400 pt-1">
                  Created {fmtDateTime(order.deliveryStartedAt)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order?.lines?.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{esc(l.productName)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.qty}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${l.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">${l.lineTotal.toFixed(2)}</TableCell>
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
            {canApprove && (
              <Button onClick={handleApprove} disabled={actionLoading === "approve"} className="gap-2">
                <ShieldCheck size={15} />
                {actionLoading === "approve" ? "Approving…" : "Approve Order"}
              </Button>
            )}
            {canAddDelivery && (
              <Button onClick={openDeliveryModal} disabled={actionLoading === "delivery"} className="gap-2">
                <Truck size={15} />
                {actionLoading === "delivery" ? "Adding Delivery…" : "Add Delivery"}
              </Button>
            )}
            {canConfirm && (
              <Button onClick={handleConfirmDeliveryStatus} disabled={actionLoading === "confirm"} variant="outline" className="gap-2">
                <CheckCircle size={15} />
                {actionLoading === "confirm" ? "Confirming…" : "Confirm Delivery"}
              </Button>
            )}
            {canComplete && (
              <Button onClick={handleComplete} disabled={actionLoading === "complete"} variant="outline" className="gap-2">
                <CheckCircle size={15} />
                {actionLoading === "complete" ? "Completing…" : "Complete"}
              </Button>
            )}
            {canUncomplete && (
              <Button onClick={handleUncomplete} disabled={actionLoading === "uncomplete"} variant="outline" className="gap-2">
                <Upload size={15} />
                {actionLoading === "uncomplete" ? "Reverting…" : "Revert"}
              </Button>
            )}
            {canPay && order && (
              <PaymentModal order={order} orderId={orderId} onSubmit={reFetchOrder} />
            )}
            <Button variant="ghost" onClick={() => router.push("/admin/orders")}>Back to Orders</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Delivery Modal */}
      <Dialog
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        title="Add Delivery"
        description={order ? `Order ${order.code}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeliveryModalOpen(false)} disabled={deliverySubmitting}>Cancel</Button>
            <Button onClick={handleConfirmDelivery} disabled={deliverySubmitting}>
              {deliverySubmitting ? "Confirming…" : "Confirm Delivery"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Phnom Penh, Cambodia"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Driver Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Driver Phone <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="e.g. +84 90 123 4567"
            />
          </div>
          {deliveryError && <p className="text-sm text-red-500">{esc(deliveryError)}</p>}
        </div>
      </Dialog>
    </div>
  );
}

function PaymentModal({ order, orderId, onSubmit }: { order: OrderDto; orderId: number; onSubmit: () => void }) {
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
      await payOrder(orderId, { amount: amt, method });
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
        open={open} onOpenChange={setOpen} title="Record Payment" description={`Order ${order.code}`}
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
