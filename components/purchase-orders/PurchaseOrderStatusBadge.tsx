"use client";

import { Badge } from "@/components/ui";
import { PurchaseOrderStatus } from "@/lib/types";

const STATUS_META: Record<PurchaseOrderStatus, { variant: "muted" | "ok" | "warn" | "error" | "amber"; label: string }> = {
  Pending:   { variant: "warn",  label: "Pending" },
  Confirmed: { variant: "ok",    label: "Confirmed" },
  Delivering: { variant: "warn", label: "Delivering" },
  Completed: { variant: "ok",    label: "Completed" },
  Cancelled: { variant: "error", label: "Cancelled" },
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} aria-label={`Purchase order status: ${meta.label}`}>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {meta.label}
      </span>
      {meta.label}
    </Badge>
  );
}
