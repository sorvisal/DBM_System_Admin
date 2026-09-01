"use client";

import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

/** Delivery status derived from real order fields — never faked. */
export function deliveryStatus(o: PublicOrderHistoryDto): string {
  if (o.status === "Cancelled") return "Cancelled";
  if (o.completedAt) return "Delivered";
  if (o.status === "Confirmed") return "Delivered";
  if (o.deliveryStartedAt || o.status === "Delivering") return "Out for Delivery";
  if (o.driverName) return "Driver assigned";
  if (o.status === "Approved") return "Preparing";
  return "Awaiting confirmation";
}

/** Index into the timeline steps; -1 when cancelled. */
export function progressIndex(o: PublicOrderHistoryDto): number {
  switch (o.status) {
    case "Pending": return 0;
    case "Approved": return 1;
    case "Delivering": return o.confirmedAt ? 3 : 2;
    case "Confirmed": return 3;
    case "Completed": return 4;
    default: return -1; // Cancelled
  }
}

const STEPS = ["Order Placed", "Approved", "Out for Delivery", "Delivered / Confirmed", "Completed"];

export function OrderStatusTimeline({ order }: { order: PublicOrderHistoryDto }) {
  const idx = progressIndex(order);
  const cancelled = idx === -1;

  return (
    <div className="rounded-2xl border border-[#e2eaf6] bg-white p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Order Progress</h4>

      {cancelled && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
          <XCircle size={16} /> This order was cancelled
        </div>
      )}

      <ol className="space-y-0">
        {STEPS.map((label, i) => {
          const done = !cancelled && i <= idx;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={label} className="flex gap-3">
              {/* rail */}
              <div className="flex flex-col items-center">
                {done
                  ? <CheckCircle2 size={20} className={i === idx ? "text-[#0d63ff]" : "text-emerald-500"} />
                  : <Circle size={20} className="text-slate-300" />}
                {!isLast && (
                  <span className={`w-px flex-1 ${done && !cancelled && i < idx ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
              {/* label + timestamp */}
              <div className={`${isLast ? "" : "pb-4"} min-w-0`}>
                <div className={`text-sm ${done ? "font-bold text-slate-800" : "text-slate-400"}`}>
                  {label}
                  {i === idx && !cancelled && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#0d63ff]">
                      CURRENT
                    </span>
                  )}
                </div>
                {i === 0 && <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</div>}
                {i === 1 && order.status !== "Pending" && order.status !== "Cancelled" && (
                  <div className="text-xs text-slate-400">Approved by the store</div>
                )}
                {i === 2 && order.deliveryStartedAt && (
                  <div className="text-xs text-slate-400">{new Date(order.deliveryStartedAt).toLocaleString()}</div>
                )}
                {i === 3 && order.confirmedAt && (
                  <div className="text-xs text-slate-400">{new Date(order.confirmedAt).toLocaleString()}</div>
                )}
                {i === 4 && order.completedAt && (
                  <div className="text-xs text-slate-400">{new Date(order.completedAt).toLocaleString()}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
