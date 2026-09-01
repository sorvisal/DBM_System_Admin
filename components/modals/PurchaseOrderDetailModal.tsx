"use client";

import { useEffect, useState } from "react";
import { getPurchaseOrder, confirmPurchaseOrder, payPurchaseOrder } from "@/lib/api/purchaseOrders";
import type { PurchaseOrderDto } from "@/lib/types";
import { PurchaseOrderStatus } from "@/lib/types";
import { Badge, esc, fmtDate, fmtDateTime } from "@/components/ui";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { X, ShieldCheck, DollarSign, CheckCircle, Loader2 } from "lucide-react";

function PurchaseOrderDetailModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const poId = typeof data.id === "number" ? data.id : null;
  const [po, setPo] = useState<PurchaseOrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [busyConfirm, setBusyConfirm] = useState(false);
  const [busyPay, setBusyPay] = useState(false);

  useEffect(() => {
    if (!poId) return;
    getPurchaseOrder(poId)
      .then((r) => setPo(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [poId]);

  async function handleConfirm() {
    if (!po) return;
    setBusyConfirm(true);
    try {
      const result = await confirmPurchaseOrder(po.id);
      if (result.data) setPo(result.data);
      alert("Purchase order confirmed");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setBusyConfirm(false);
    }
  }

  async function handlePay() {
    if (!po) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { alert("Invalid payment amount"); return; }
    setBusyPay(true);
    try {
      const result = await payPurchaseOrder(po.id, { amount: amt, method: payMethod });
      if (result.data) setPo(result.data);
      alert("Payment recorded");
      setShowPay(false);
      setPayAmount("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusyPay(false);
    }
  }

  if (loading) return <p className="empty" style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p className="login-error" style={{ padding: 24 }}>{error}</p>;
  if (!po) return <p className="empty" style={{ padding: 24 }}>Purchase order not found</p>;

  const total = po.totalAmount ?? 0;
  const paid = po.paidAmount ?? 0;
  const balance = total - paid;
  const lines = po.lines ?? [];

  return (
    <div>
      {/* Header */}
      <div className="modal-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="modal-eyebrow">Purchase Order</div>
          <div className="modal-title">{esc(po.code)}</div>
          <div className="modal-sub">Created {fmtDate(po.createdAt)} · {lines.length} item{lines.length !== 1 ? "s" : ""}</div>
        </div>
        <button type="button" onClick={close} className="modal-close" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="modal-body">
        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Supplier</div>
            <div style={{ fontWeight: 500 }}>{esc(po.supplierName)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Status</div>
            <Badge variant={
              po.status === PurchaseOrderStatus.Completed ? "ok" :
              po.status === PurchaseOrderStatus.Cancelled ? "error" :
              po.status === PurchaseOrderStatus.Pending ? "warn" : "muted"
            }>{po.status}</Badge>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Total</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>${total.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Paid</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>${paid.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Balance</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: balance > 0 ? "var(--warn)" : "var(--success)" }}>
              ${balance.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Payment</div>
            <Badge variant={
              po.paymentStatus === "paid" ? "ok" :
              po.paymentStatus === "partial" ? "warn" : "muted"
            }>{po.paymentStatus}</Badge>
          </div>
          {po.paymentMethod && (
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Method</div>
              <div style={{ fontWeight: 500 }}>{esc(po.paymentMethod)}</div>
            </div>
          )}
          {po.paidAt && (
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Paid at</div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{fmtDateTime(po.paidAt)}</div>
            </div>
          )}
        </div>

        {/* Line items */}
        {lines.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-dim)" }}>Line Items</div>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "var(--text-muted)", fontSize: 11, textAlign: "left" }}>
                  <th style={{ padding: "4px 0" }}>Product</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>Qty</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>Unit Cost</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "6px 0" }}>{esc(line.productName)}</td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>{line.qty}</td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>${(line.unitCost ?? 0).toFixed(2)}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 500 }}>${(line.lineTotal ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {po.description && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
            <strong>Note:</strong> {esc(po.description)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={close}>Close</button>

        {po.status === PurchaseOrderStatus.Pending && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={busyConfirm}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {busyConfirm ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
            {busyConfirm ? "Confirming…" : "Confirm"}
          </button>
        )}

        {po.status === PurchaseOrderStatus.Confirmed && po.paymentStatus === "paid" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { close(); window.location.href = `/admin/purchase-orders/${po.id}`; }}
          >
            <CheckCircle className="w-3 h-3" /> Receive
          </button>
        )}

        {po.status === PurchaseOrderStatus.Confirmed && po.paymentStatus !== "paid" && (
          <button
            type="button"
            className="btn btn-primary"
            disabled
            title="Record payment before receiving"
            style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <CheckCircle className="w-3 h-3" /> Receive <span style={{ fontSize: 11, marginLeft: 4 }}>(Pay first)</span>
          </button>
        )}

        {po.paymentStatus !== "paid" && po.status !== PurchaseOrderStatus.Completed && po.status !== PurchaseOrderStatus.Cancelled && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPayAmount(String(balance));
              setShowPay(true);
            }}
            disabled={busyPay}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <DollarSign className="w-3 h-3" /> Record Payment
          </button>
        )}
      </div>

      {/* Pay dialog */}
      {showPay && (
        <div className="modal-backdrop" onClick={() => setShowPay(false)}>
          <div className="modal-content" style={{ width: "min(400px, 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">Payment</div>
                <div className="modal-title">Record Payment</div>
                <div className="modal-sub">PO {esc(po.code)} · Due ${balance.toFixed(2)}</div>
              </div>
              <button className="modal-close" onClick={() => setShowPay(false)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="field">
                <label>Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPay(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handlePay}
                disabled={busyPay}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {busyPay ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                {busyPay ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  registerModalSlot("purchase-order-detail", (data: ModalRecord) => <PurchaseOrderDetailModal data={data} />);
}

export { PurchaseOrderDetailModal };
export default PurchaseOrderDetailModal;
