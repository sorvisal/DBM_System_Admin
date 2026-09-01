"use client";

import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { fmtMoney } from "@/lib/api/client";

export function PaymentSummary({ order }: { order: PublicOrderHistoryDto }) {
  const subtotal = order.lines.reduce((s, l) => s + l.lineTotal, 0);
  const remaining = Math.max(order.totalAmount - order.paidAmount, 0);
  const paidLabel =
    order.paymentStatus === "paid" ? "Paid"
      : order.paymentStatus === "partial" ? "Partially paid"
      : "Pending";

  return (
    <div className="rounded-2xl border border-[#e2eaf6] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Payment</h4>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
          order.paymentStatus === "paid"
            ? "bg-emerald-100 text-emerald-700"
            : order.paymentStatus === "partial"
              ? "bg-blue-50 text-[#0d63ff]"
              : "bg-[#fff6db] text-[#a46b00]"
        }`}>
          {paidLabel}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm">
        <Row label="Subtotal" value={fmtMoney(subtotal)} />
        {/* Tax / discount / delivery fee are not part of the current model — rendered only if present later */}
        <Row label="Grand total" value={fmtMoney(order.totalAmount)} bold />
        <Row label="Paid amount" value={fmtMoney(order.paidAmount)} />
        <Row
          label="Remaining"
          value={fmtMoney(remaining)}
          highlight={remaining > 0}
        />
      </dl>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={`${bold ? "font-bold" : "text-slate-500"} ${highlight ? "font-semibold text-red-500" : ""}`}>{label}</dt>
      <dd className={`${bold ? "font-black text-[#0e50b4]" : "font-semibold"} ${highlight ? "text-red-500" : ""}`}>{value}</dd>
    </div>
  );
}
