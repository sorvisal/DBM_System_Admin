"use client";

import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { deliveryStatus } from "./OrderStatusTimeline";
import { MapPin, Phone, Truck, User } from "lucide-react";

export function DeliveryInfo({ order }: { order: PublicOrderHistoryDto }) {
  const status = deliveryStatus(order);

  return (
    <div className="rounded-2xl border border-[#e2eaf6] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">Delivery</h4>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
          status === "Delivered"
            ? "bg-emerald-100 text-emerald-700"
            : status === "Out for Delivery" || status === "Driver assigned"
              ? "bg-blue-50 text-[#0d63ff]"
              : status === "Cancelled"
                ? "bg-red-50 text-red-600"
                : "bg-[#fff6db] text-[#a46b00]"
        }`}>
          {status}
        </span>
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="flex gap-2.5">
          <MapPin size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <dt className="text-xs text-slate-400">Address</dt>
            <dd className="font-semibold">{order.deliveryAddress || "—"}</dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <User size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <dt className="text-xs text-slate-400">Driver</dt>
            <dd className="font-semibold">{order.driverName || "Not assigned yet"}</dd>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Phone size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <dt className="text-xs text-slate-400">Driver phone</dt>
            <dd className="font-semibold">{order.driverPhone || "—"}</dd>
          </div>
        </div>
        {(order.deliveryStartedAt || order.confirmedAt || order.completedAt) && (
          <div className="flex gap-2.5">
            <Truck size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
            <div>
              <dt className="text-xs text-slate-400">Timeline</dt>
              <dd className="space-y-0.5 text-xs font-medium text-slate-600">
                {order.deliveryStartedAt && <div>Left store: {new Date(order.deliveryStartedAt).toLocaleString()}</div>}
                {order.confirmedAt && <div>Delivered/confirmed: {new Date(order.confirmedAt).toLocaleString()}</div>}
                {order.completedAt && <div>Completed: {new Date(order.completedAt).toLocaleString()}</div>}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </div>
  );
}
