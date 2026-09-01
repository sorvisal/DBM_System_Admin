// ---------------------------------------------------------------------------
// Admin — customer order link management
// ---------------------------------------------------------------------------

export interface CustomerOrderLinkDto {
  id: number;
  organizationId: number;
  customerId: number | null;
  token: string;
  publicUrl: string;
  /** Shareable link display name, e.g. "Main Store Customer Ordering". */
  name: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  status: "active" | "inactive" | "expired";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
}

export interface CustomerOrderLinkSummaryDto {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number;
  ordersCreated: number;
}

export interface CustomerOrderLinkRequest {
  name: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  isActive: boolean;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Public — token-secured ordering portal
// ---------------------------------------------------------------------------

export interface PublicCustomerOrderInfoDto {
  token: string;
  /** Shareable link display name shown as the portal title. */
  name: string | null;
  organizationName: string;
  expiresAt: string | null;
  isActive: boolean;
  status: string;
  isValid: boolean;
}

export interface PublicCategoryDto {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
}

export interface PublicProductDto {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQty: number;
  inStock: boolean;
  photoPath: string | null;
  description: string | null;
  categoryId: number;
  categoryName: string;
}

export interface CartLineRequest {
  productId: number;
  qty: number;
}

export interface CartLineValidationDto {
  productId: number;
  productName: string;
  requestedQty: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  available: boolean;
  error: string | null;
}

export interface ValidateCartResponseDto {
  valid: boolean;
  total: number;
  items: CartLineValidationDto[];
}

export interface PublicCheckoutRequest {
  items: CartLineRequest[];
  deliveryAddress: string | null;
  phone: string | null;
  note: string | null;
  idempotencyKey: string;
}

export interface PublicOrderLineDto {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PublicOrderDto {
  orderId: number;
  code: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  lines: PublicOrderLineDto[];
}

export interface PublicCustomerDto {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerAuthResponse {
  accessToken: string;
  expiresAt: string;
  customer: PublicCustomerDto;
}

export interface PublicGoogleLoginRequest {
  idToken: string;
}

export interface PublicTelegramLoginRequest {
  telegramAuth: string;
}

// ---------------------------------------------------------------------------
// Customer order history (paged / searchable / filterable)
// ---------------------------------------------------------------------------

export interface PublicOrderHistoryLineDto {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  sku: string | null;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  photoPath: string | null;
  productIsActive: boolean;
}

export interface PublicOrderHistoryDto {
  orderId: number;
  code: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  deliveryAddress: string | null;
  driverName: string | null;
  driverPhone: string | null;
  deliveryStartedAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  description: string | null;
  lines: PublicOrderHistoryLineDto[];
}

export interface PublicOrderHistorySummaryDto {
  totalOrders: number;
  completed: number;
  inProgress: number;
  cancelled: number;
}

export interface PublicOrdersPageDto {
  items: PublicOrderHistoryDto[];
  summary: PublicOrderHistorySummaryDto;
}

export type OrderStatusFilter =
  | "" | "pending" | "approved" | "delivering" | "confirmed" | "completed" | "cancelled";

export type OrderDateRange = "all" | "today" | "7d" | "30d" | "year";
