"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { fmtMoney } from "@/lib/api/client";
import { statusPillClass } from "./OrderCard";
import { OrderStatusTimeline, deliveryStatus } from "./OrderStatusTimeline";
import { OrderItems } from "./OrderItems";
import { PaymentSummary } from "./PaymentSummary";
import { DeliveryInfo } from "./DeliveryInfo";

export function OrderDetailModal({
  order,
  storeName,
  onClose,
  onReorder,
  reorderBusy,
}: {
  order: PublicOrderHistoryDto | null;
  storeName: string;
  onClose: () => void;
  onReorder: () => void;
  reorderBusy?: boolean;
}) {
  if (!order) return null;

  return (
    <Dialog
      open={order != null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={`Order #${order.code}`}
      description={new Date(order.createdAt).toLocaleString()}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => downloadInvoice(order, storeName)}>
            Download Invoice
          </Button>
          <Button onClick={onReorder} disabled={reorderBusy}>
            {reorderBusy ? "Adding…" : "Reorder"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Status trio — stack on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatusTile label="Order Status" value={order.status} cls={statusPillClass(order.status)} />
          <StatusTile
            label="Payment Status"
            value={order.paymentStatus}
            cls={
              order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700"
                : order.paymentStatus === "partial" ? "bg-blue-50 text-[#0d63ff]"
                : "bg-[#fff6db] text-[#a46b00]"
            }
          />
          <StatusTile label="Delivery Status" value={deliveryStatus(order)} cls="bg-blue-50 text-[#0d63ff]" />
        </div>

        <OrderStatusTimeline order={order} />
        <OrderItems order={order} />

        <div className="grid gap-4 md:grid-cols-2">
          <PaymentSummary order={order} />
          <DeliveryInfo order={order} />
        </div>

        {order.description && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            <b>Note:</b> {order.description}
          </div>
        )}

        {/* Customer-facing actions only — no admin operations are exposed here. */}
      </div>
    </Dialog>
  );
}

function StatusTile({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize ${cls}`}>
        {value}
      </span>
    </div>
  );
}

/** Printable invoice — opens the browser print dialog (Save as PDF available there). */
function downloadInvoice(order: PublicOrderHistoryDto, storeName: string) {
  const rows = order.lines.map((l) =>
    `<tr>
       <td>${escapeHtml(l.productName)}${l.sku ? `<br><small>SKU: ${escapeHtml(l.sku)}</small>` : ""}</td>
       <td style="text-align:center">${l.qty}</td>
       <td style="text-align:right">${fmtMoney(l.unitPrice)}</td>
       <td style="text-align:right">${fmtMoney(l.lineTotal)}</td>
     </tr>`).join("");

  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>Invoice ${escapeHtml(order.code)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#17304f;padding:32px;max-width:680px;margin:auto}
      h1{margin:0;color:#0d63ff;font-size:22px}
      .muted{color:#71829a;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      th,td{border-bottom:1px solid #e2eaf6;padding:8px 6px;font-size:13px;text-align:left}
      th{background:#f4f8ff;text-transform:uppercase;font-size:11px;letter-spacing:.4px}
      .totals td{border:none;padding:3px 6px}
      .grand{font-weight:bold;font-size:15px;color:#0e50b4}
      .pills span{display:inline-block;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:bold;margin-right:6px}
    </style></head><body>
    <h1>${escapeHtml(storeName)}</h1>
    <div class="muted">Invoice for order <b>${escapeHtml(order.code)}</b> · ${new Date(order.createdAt).toLocaleString()}</div>
    <div class="pills" style="margin-top:10px">
      <span style="background:#edf5ff;color:#1b58b5">Order: ${escapeHtml(order.status)}</span>
      <span style="background:#fff6db;color:#a46b00">Payment: ${escapeHtml(order.paymentStatus)}</span>
    </div>
    <table>
      <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="totals"><tbody>
      <tr><td></td><td style="text-align:right;width:180px">Grand total</td><td style="text-align:right" class="grand">${fmtMoney(order.totalAmount)}</td></tr>
      <tr><td></td><td style="text-align:right">Paid</td><td style="text-align:right">${fmtMoney(order.paidAmount)}</td></tr>
      <tr><td></td><td style="text-align:right">Remaining</td><td style="text-align:right">${fmtMoney(Math.max(order.totalAmount - order.paidAmount, 0))}</td></tr>
    </tbody></table>
    ${order.deliveryAddress ? `<p class="muted">Deliver to: ${escapeHtml(order.deliveryAddress)}</p>` : ""}
    <p class="muted">Thank you for ordering with DBM Retailer.</p>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
}
