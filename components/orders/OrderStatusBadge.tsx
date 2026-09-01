"use client";

import { Badge } from "@/components/ui";
import type { OrderStatus } from "@/lib/types";

/**
 * Semantic color mapping for OrderStatus values.
 * Uses `satisfies` so TypeScript errors if a new enum value is added without a mapping.
 * Pending now uses "warn" (amber) to signal it requires manager approval.
 */
const STATUS_META: Record<OrderStatus, { variant: "muted" | "ok" | "warn" | "error" | "amber"; label: string }> = {
  Pending:    { variant: "warn",  label: "Pending (Awaiting Approval)" },
  Approved:   { variant: "muted", label: "Approved" },
  Delivering: { variant: "warn",  label: "Out for Delivery" },
  Confirmed:  { variant: "ok",    label: "Confirmed" },
  Completed:  { variant: "ok",    label: "Completed" },
  Cancelled:  { variant: "error", label: "Cancelled" },
} satisfies Record<OrderStatus, { variant: "muted" | "ok" | "warn" | "error" | "amber"; label: string }>;

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} aria-label={`Order status: ${meta.label}`}>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {meta.label}
      </span>
      {meta.label}
    </Badge>
  );
}
