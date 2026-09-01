/**
 * Strict enum mirroring the backend OrderStatus C# enum.
 */
export type OrderStatus = "Pending" | "Approved" | "Delivering" | "Confirmed" | "Completed" | "Cancelled";

/**
 * Strict enum mirroring the backend PurchaseOrderStatus C# enum.
 */
export type PurchaseOrderStatus = "Pending" | "Confirmed" | "Delivering" | "Completed" | "Cancelled";

/**
 * Exhaustive mapping of order status → Badge variant + display label.
 * TypeScript will error at compile time if a new OrderStatus value is added without a mapping.
 */
export const ORDER_STATUS_META: Record<OrderStatus, { variant: "muted" | "ok" | "warn" | "error" | "amber"; label: string }> = {
  Pending:    { variant: "warn",  label: "Pending (Awaiting Approval)" },
  Approved:   { variant: "muted", label: "Approved" },
  Delivering: { variant: "warn",  label: "Out for Delivery" },
  Confirmed:  { variant: "ok",    label: "Confirmed" },
  Completed:  { variant: "ok",    label: "Completed" },
  Cancelled:  { variant: "error", label: "Cancelled" },
} as const;

/**
 * Exhaustive mapping of purchase order status → Badge variant + display label.
 */
export const PO_STATUS_META: Record<PurchaseOrderStatus, { variant: "muted" | "ok" | "warn" | "error" | "amber"; label: string }> = {
  Pending:    { variant: "muted", label: "Pending" },
  Confirmed:  { variant: "ok",    label: "Confirmed" },
  Delivering: { variant: "warn",  label: "Delivering" },
  Completed:  { variant: "ok",    label: "Completed" },
  Cancelled:  { variant: "error", label: "Cancelled" },
} as const;
