"use client";

import { useEffect, useState } from "react";
import { getOrder } from "@/lib/api/orders";
import type { OrderDto } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { Badge, esc, fmtDateTime } from "@/components/ui";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

function OrderModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const orderId = typeof data.id === "number" ? data.id : null;
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then((r) => setOrder(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Dialog open={!!order || loading} onOpenChange={(v) => { if (!v) close(); }}>
      {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
      {error && <p className="p-4 text-sm text-red-500">{error}</p>}
      {order && !loading && (
        <>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">Order</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{esc(order.code)}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Created {fmtDateTime(order.createdAt)}</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Customer</div>
                <div className="font-medium">{esc(order.customerName ?? "—")}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Payment</div>
                <Badge variant={order.paymentStatus === "paid" ? "ok" : order.paymentStatus === "partial" ? "warn" : "muted"}>
                  {order.paymentStatus ?? "—"}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</div>
                <div className="font-bold text-lg">${order.totalAmount.toFixed(2)}</div>
              </div>
            </div>

            {order.lines && order.lines.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Line Items</div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                        <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Product</th>
                        <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium text-right">Qty</th>
                        <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium text-right">Unit Price</th>
                        <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.lines.map((line, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <td className="px-3 py-2 font-medium">{esc(line.productName)}</td>
                          <td className="px-3 py-2 text-right font-mono">{line.qty}</td>
                          <td className="px-3 py-2 text-right font-mono">${line.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">${line.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {order.description && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <strong>Note:</strong> {esc(order.description)}
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button variant="ghost" onClick={close}>Close</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  registerModalSlot("order", (data: ModalRecord) => <OrderModal data={data} />);
}

export { OrderModal };
export default OrderModal;
