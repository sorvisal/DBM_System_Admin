"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomer, getCustomerOrders, updateCustomer } from "@/lib/api/customers";
import { listCustomerTypes, createCustomerType } from "@/lib/api/customerTypes";
import { getOrder, approveOrder, startDeliveryOrder, confirmOrder, completeOrder } from "@/lib/api/orders";
import type { CustomerDetailDto, OrderDto, CustomerTypeDto } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { Badge, esc, fmtDate } from "@/components/ui";
import { uploadsUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrderEvents } from "@/lib/notifications";
import { Dialog } from "@/components/ui/dialog";
import { StatCard } from "@/components/ui/stat-card";

type ActionState = "idle" | "loading";
type ModalType = "approve" | "delivery" | "confirm" | "complete" | null;

interface OrderActionState {
  state: ActionState;
  modal: ModalType;
  deliveryAddress: string;
  driverName: string;
  driverPhone: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = parseInt(params.id as string, 10);
  const [data, setData] = useState<CustomerDetailDto | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTypeName, setNewTypeName] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderActions, setOrderActions] = useState<Record<number, OrderActionState>>({});

  useEffect(() => {
    if (isNaN(customerId)) return;
    Promise.all([
      getCustomer(customerId),
      getCustomerOrders(customerId),
      listCustomerTypes(),
    ]).then(([custRes, ordersRes, typesRes]) => {
      setData(custRes.data ?? null);
      setOrders(ordersRes.data ?? []);
      setCustomerTypes(typesRes.data ?? []);
    }).catch((err) => setError(err instanceof Error ? err.message : "Load failed")).finally(() => setLoading(false));
  }, [customerId]);

  useOrderEvents({
    onOrderStatusChanged(payload) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === payload.id ? { ...o, status: payload.status as OrderStatus } : o,
        ),
      );
    },
  });

  async function loadOrders() {
    try {
      const res = await getCustomerOrders(customerId);
      setOrders(res.data ?? []);
    } catch { /* ignore */ }
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setCreating(true);
    try {
      const result = await createCustomerType({ name: newTypeName.trim(), description: null });
      if (result.success && result.data) {
        setCustomerTypes((prev) => [...prev, result.data!]);
        if (!data?.customer.customerTypeId) {
          setData((prev) => prev ? { ...prev, customer: { ...prev.customer, customerTypeId: result.data!.id, customerTypeName: result.data!.name } } : prev);
        }
        toast("Type created", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setCreating(false);
      setNewTypeName("");
    }
  }

  async function handleTypeChange(customerTypeId: number | null) {
    if (!data || saving) return;
    const selected = customerTypeId ? customerTypes.find((ct) => ct.id === customerTypeId) : null;
    setData((prev) => prev ? { ...prev, customer: { ...prev.customer, customerTypeId, customerTypeName: selected?.name ?? null } } : prev);
    setSaving(true);
    try {
      const result = await updateCustomer(customerId, {
        name: data.customer.name,
        phone: data.customer.phone,
        address: data.customer.address,
        status: data.customer.status,
        customerTypeId,
        photo: null,
        description: data.customer.description,
      });
      if (!result.success) toast("Save failed", "err");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "err");
      setData((prev) => prev);
    } finally {
      setSaving(false);
    }
  }

  function setOrderAction(orderId: number, partial: Partial<OrderActionState>) {
    setOrderActions((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...partial },
    }));
  }

  function getEmptyAction(): OrderActionState {
    return { state: "idle", modal: null, deliveryAddress: "", driverName: "", driverPhone: "" };
  }

  function getOrderActionState(orderId: number): OrderActionState {
    return orderActions[orderId] ?? getEmptyAction();
  }

  async function handleApprove(order: OrderDto) {
    if (order.status !== OrderStatus.Pending) return;
    setOrderAction(order.id, { ...getOrderActionState(order.id), state: "loading", modal: null });
    try {
      const result = await approveOrder(order.id);
      if (result.data) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? result.data! : o));
        toast("Order approved", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approval failed", "err");
    } finally {
      setOrderAction(order.id, { ...getOrderActionState(order.id), state: "idle" });
    }
  }

  async function handleStartDelivery(order: OrderDto) {
    if (order.status !== OrderStatus.Approved) return;
    const action = getOrderActionState(order.id);
    if (!action.driverName.trim()) { toast("Driver name is required", "err"); return; }
    setOrderAction(order.id, { ...action, state: "loading", modal: null });
    try {
      const result = await startDeliveryOrder(order.id, {
        driverName: action.driverName.trim(),
        driverPhone: action.driverPhone.trim(),
        deliveryAddress: action.deliveryAddress.trim() || null,
      });
      if (result.data) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? result.data! : o));
        toast("Order sent for delivery", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to start delivery", "err");
    } finally {
      setOrderAction(order.id, { ...getOrderActionState(order.id), state: "idle" });
    }
  }

  async function handleConfirm(order: OrderDto) {
    if (order.status !== OrderStatus.Delivering) return;
    setOrderAction(order.id, { ...getOrderActionState(order.id), state: "loading", modal: null });
    try {
      const result = await confirmOrder(order.id);
      if (result.data) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? result.data! : o));
        toast("Order confirmed", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Confirm failed", "err");
    } finally {
      setOrderAction(order.id, { ...getOrderActionState(order.id), state: "idle" });
    }
  }

  async function handleComplete(order: OrderDto) {
    if (order.status !== OrderStatus.Confirmed) return;
    setOrderAction(order.id, { ...getOrderActionState(order.id), state: "loading", modal: null });
    try {
      const result = await completeOrder(order.id);
      if (result.data) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? result.data! : o));
        toast("Order completed", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Complete failed", "err");
    } finally {
      setOrderAction(order.id, { ...getOrderActionState(order.id), state: "idle" });
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
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-500 p-4">{error}</div>;
  if (!data) return <div className="flex flex-col items-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2"><User size={32} className="opacity-30" /><span>Customer not found</span></div>;

  const { customer, stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{esc(customer.name)}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Customer since {fmtDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              {customer.photoPath ? (
                <img src={uploadsUrl(customer.photoPath)} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <Avatar fallback={(customer.name ?? "").slice(0, 2).toUpperCase()} className="w-14 h-14 text-base flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phone</span><span className="font-mono text-xs">{esc(customer.phone ?? "—")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Address</span><span className="text-xs text-right max-w-48 truncate">{esc(customer.address ?? "—")}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <Badge variant={customer.status === "active" ? "ok" : customer.status === "blocked" ? "warn" : "default"}>{customer.status}</Badge>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <span className="text-slate-500 dark:text-slate-400">Type</span>
                  <span className="text-xs font-medium">{esc(customer.customerTypeName ?? "—")}</span>
                </div>
              </div>
            </div>

            {/* Customer Type selector + create */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Customer Type</label>
              <div className="flex gap-2">
                <select
                  value={customer.customerTypeId ?? ""}
                  onChange={(e) => handleTypeChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                  disabled={saving}
                  className="flex h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:focus-visible:border-blue-400"
                >
                  <option value="">— None —</option>
                  {customerTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>{esc(ct.name ?? "")}</option>
                  ))}
                </select>
                {saving && <Loader2 size={16} className="mt-1.5 animate-spin text-slate-400" />}
              </div>
              <form onSubmit={handleCreateType} className="flex gap-2 mt-2">
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="New type name…"
                  className="h-8 text-sm"
                  disabled={creating}
                />
                <Button type="submit" variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" disabled={creating || !newTypeName.trim()}>
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Spent"
                value={`$${stats.totalSpent.toFixed(2)}`}
                subtitle="All time"
                iconColor="text-emerald-500"
              />
              <StatCard
                label="Balance"
                value={`$${stats.balance.toFixed(2)}`}
                subtitle={stats.balance > 0 ? "Customer owes" : "Credit available"}
                valueColor={stats.balance > 0 ? "text-red-500" : undefined}
                iconColor="text-amber-500"
              />
              <StatCard
                label="Orders"
                value={String(stats.orderCount)}
                subtitle="Total orders"
                iconColor="text-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History with Workflow Actions */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const action = getOrderActionState(o.id);
                  const st = o.status as OrderStatus;
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-sm">{esc(o.code)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">${o.totalAmount.toFixed(2)}</TableCell>
                      <TableCell><OrderStatusBadge status={st} /></TableCell>
                      <TableCell>
                        <span className={`text-xs ${o.paymentStatus === "paid" ? "text-emerald-600 dark:text-emerald-400" : o.paymentStatus === "partial" ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>{o.paymentStatus}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400 dark:text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/orders/${o.id}`)} className="text-xs">
                            View
                          </Button>
                          {st === OrderStatus.Pending && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setOrderAction(o.id, { ...action, modal: "approve" })}
                              isLoading={action.state === "loading" && action.modal === "approve"}
                              className="text-xs gap-1"
                            >
                              Approve
                            </Button>
                          )}
                          {st === OrderStatus.Approved && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setOrderAction(o.id, { ...action, modal: "delivery" })}
                              isLoading={action.state === "loading" && action.modal === "delivery"}
                              className="text-xs gap-1"
                            >
                              Add Delivery
                            </Button>
                          )}
                          {st === OrderStatus.Delivering && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setOrderAction(o.id, { ...action, modal: "confirm" })}
                              isLoading={action.state === "loading" && action.modal === "confirm"}
                              className="text-xs gap-1"
                            >
                              Confirm
                            </Button>
                          )}
                          {st === OrderStatus.Confirmed && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => setOrderAction(o.id, { ...action, modal: "complete" })}
                              isLoading={action.state === "loading" && action.modal === "complete"}
                              className="text-xs gap-1"
                            >
                              Complete
                            </Button>
                          )}
                          {st === OrderStatus.Completed && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">Completed</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approve Confirmation Dialog */}
      {(() => {
        const order = orders.find((o) => getOrderActionState(o.id).modal === "approve");
        if (!order) return null;
        const action = getOrderActionState(order.id);
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) setOrderAction(order.id, { ...action, state: "idle", modal: null }); }}
            title="Approve Order?"
            description={`Are you sure you want to approve ${order.code}? Stock will be deducted.`}
            footer={
              <>
                <Button variant="ghost" onClick={() => setOrderAction(order.id, { ...action, state: "idle", modal: null })} isLoading={action.state === "loading"}>Cancel</Button>
                <Button onClick={() => handleApprove(order)} isLoading={action.state === "loading"}>Approve Order</Button>
              </>
            }
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Order <strong>{esc(order.code)}</strong> — Total: <strong>${order.totalAmount.toFixed(2)}</strong>
            </p>
          </Dialog>
        );
      })()}

      {/* Add Delivery Modal */}
      {(() => {
        const order = orders.find((o) => getOrderActionState(o.id).modal === "delivery");
        if (!order) return null;
        const action = getOrderActionState(order.id);
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) setOrderAction(order.id, { ...action, state: "idle", modal: null }); }}
            title="Add Delivery"
            description={`Order ${order.code}`}
            footer={
              <>
                <Button variant="ghost" onClick={() => setOrderAction(order.id, { ...action, state: "idle", modal: null })} isLoading={action.state === "loading"}>Cancel</Button>
                <Button onClick={() => handleStartDelivery(order)} isLoading={action.state === "loading"} disabled={!action.driverName.trim()}>Add Delivery</Button>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Delivery Address</label>
                <Input
                  value={action.deliveryAddress}
                  onChange={(e) => setOrderAction(order.id, { ...action, deliveryAddress: e.target.value })}
                  placeholder="Delivery address"
                  disabled={action.state === "loading"}
                />
                {action.deliveryAddress.trim() === "" && action.state !== "loading" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Use existing address or enter a new one</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Driver Name</label>
                <Input
                  value={action.driverName}
                  onChange={(e) => setOrderAction(order.id, { ...action, driverName: e.target.value })}
                  placeholder="Driver name"
                  disabled={action.state === "loading"}
                />
                {action.driverName.trim() === "" && action.state !== "loading" && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Driver name is required</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Driver Phone</label>
                <Input
                  value={action.driverPhone}
                  onChange={(e) => setOrderAction(order.id, { ...action, driverPhone: e.target.value })}
                  placeholder="Driver phone (optional)"
                  disabled={action.state === "loading"}
                />
              </div>
            </div>
          </Dialog>
        );
      })()}

      {/* Confirm Delivery Dialog */}
      {(() => {
        const order = orders.find((o) => getOrderActionState(o.id).modal === "confirm");
        if (!order) return null;
        const action = getOrderActionState(order.id);
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) setOrderAction(order.id, { ...action, state: "idle", modal: null }); }}
            title="Confirm Delivery?"
            description="Confirm that this order has been delivered to the customer successfully."
            footer={
              <>
                <Button variant="ghost" onClick={() => setOrderAction(order.id, { ...action, state: "idle", modal: null })} isLoading={action.state === "loading"}>Cancel</Button>
                <Button onClick={() => handleConfirm(order)} isLoading={action.state === "loading"}>Confirm</Button>
              </>
            }
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Order <strong>{esc(order.code)}</strong> — Total: <strong>${order.totalAmount.toFixed(2)}</strong>
            </p>
          </Dialog>
        );
      })()}

      {/* Complete Dialog */}
      {(() => {
        const order = orders.find((o) => getOrderActionState(o.id).modal === "complete");
        if (!order) return null;
        const action = getOrderActionState(order.id);
        return (
          <Dialog
            open
            onOpenChange={(open) => { if (!open) setOrderAction(order.id, { ...action, state: "idle", modal: null }); }}
            title="Complete Order?"
            description="Are you sure you want to complete this order? This marks it as fully delivered and closed."
            footer={
              <>
                <Button variant="ghost" onClick={() => setOrderAction(order.id, { ...action, state: "idle", modal: null })} isLoading={action.state === "loading"}>Cancel</Button>
                <Button onClick={() => handleComplete(order)} isLoading={action.state === "loading"}>Complete Order</Button>
              </>
            }
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Order <strong>{esc(order.code)}</strong> — Total: <strong>${order.totalAmount.toFixed(2)}</strong>
            </p>
          </Dialog>
        );
      })()}
    </div>
  );
}
