"use client";

import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { fmtMoney } from "@/lib/api/client";
import { deliveryStatus } from "./OrderStatusTimeline";

export function statusPillClass(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "confirmed":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-600";
    case "delivering":
      return "bg-blue-50 text-[#0d63ff]";
    default: // pending / approved
      return "bg-[#fff6db] text-[#a46b00]";
  }
}

export function OrderCard({
  order,
  onViewDetails,
  onReorder,
  reorderBusy,
}: {
  order: PublicOrderHistoryDto;
  onViewDetails: () => void;
  onReorder: () => void;
  reorderBusy?: boolean;
}) {
  const totalQty = order.lines.reduce((s, l) => s + l.qty, 0);
  const shown = order.lines.slice(0, 3);
  const hidden = order.lines.length - shown.length;

  return (
    <div className="rounded-xl border border-[#e2eaf6] bg-white p-3 transition-shadow hover:shadow-md sm:rounded-2xl sm:p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-black sm:text-base">Order #{order.code}</div>
          <div className="text-[10px] text-slate-400 sm:text-xs">
            {new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            {" · "}
            {new Date(order.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase sm:px-2.5 sm:py-1 sm:text-[10px] ${statusPillClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
        <span><b>{order.lines.length}</b> product{order.lines.length === 1 ? "" : "s"} · <b>{totalQty}</b> item{totalQty === 1 ? "" : "s"}</span>
        <span>Payment: <b className={order.paymentStatus === "paid" ? "text-emerald-600" : "text-[#a46b00]"}>{order.paymentStatus}</b></span>
        <span>Delivery: <b>{deliveryStatus(order)}</b></span>
      </div>

      {/* Lines */}
      <div className="mt-2.5 divide-y divide-slate-50 rounded-lg bg-slate-50/60 px-2.5 sm:mt-3 sm:rounded-xl sm:px-3">
        {shown.map((l) => (
          <div key={l.productId} className="flex items-center justify-between gap-2 py-1.5 sm:py-2">
            <span className="min-w-0 truncate text-xs sm:text-sm">{l.productName} <span className="text-slate-400">× {l.qty}</span></span>
            <b className="whitespace-nowrap text-xs sm:text-sm">{fmtMoney(l.lineTotal)}</b>
          </div>
        ))}
        {hidden > 0 && (
          <div className="py-1 text-[10px] italic text-slate-400 sm:text-xs">+ {hidden} more product{hidden === 1 ? "" : "s"}</div>
        )}
      </div>

      {/* Total */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-bold sm:text-sm">Order Total</span>
        <span className="text-base font-black text-[#0e50b4] sm:text-lg">{fmtMoney(order.totalAmount)}</span>
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex gap-2 sm:mt-3">
        <button onClick={onViewDetails}
          className="h-8 flex-1 rounded-lg bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] text-[10px] font-bold text-white hover:opacity-95 sm:h-9 sm:text-xs">
          View Details
        </button>
        <button onClick={onReorder} disabled={reorderBusy}
          className="h-8 flex-1 rounded-lg border border-[#bdd5fa] bg-white text-[10px] font-bold text-[#0d63ff] hover:bg-blue-50 disabled:opacity-50 sm:h-9 sm:text-xs">
          {reorderBusy ? "Adding…" : "Reorder"}
        </button>
      </div>
    </div>
  );
}
